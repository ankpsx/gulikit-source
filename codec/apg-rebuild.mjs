/**
 * Layout-aware APG rebuild from ordered source and generated segments.
 *
 * Segment forms:
 *   { sourceStart, sourceCount }  // copy this exact original record range
 *   { step }                      // encode this step using step.delay
 *
 * The original suffix (tail/fill and any fragment) is relocated after the new
 * record area. The output keeps the original file length. Counter values for
 * generated records continue from the previous output record using the
 * caller-supplied counterStep; copied source records retain their exact bytes.
 */
import { encodeAPG, APG_RECORD_SIZE } from "./apg-codec.mjs";

function bytesOf(input) {
  if (input instanceof Uint8Array) return new Uint8Array(input);
  if (input instanceof ArrayBuffer) return new Uint8Array(input.slice(0));
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
  }
  throw new TypeError("input must be bytes");
}

function readU16BE(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

export function rebuildAPGFromSegments(input, options = {}) {
  const bytes = bytesOf(input);
  const { recordCount, segments, metadata, abxyLayout, fillByte } = options;
  if (!Number.isInteger(recordCount) || recordCount < 0 ||
      recordCount > Math.floor(bytes.length / APG_RECORD_SIZE)) {
    throw new RangeError("recordCount must be a valid count within the input file");
  }
  if (!Array.isArray(segments)) throw new TypeError("segments must be an array");
  if (!metadata || !Number.isInteger(metadata.marker) ||
      !Number.isInteger(metadata.counterStep)) {
    throw new TypeError("metadata.marker and metadata.counterStep are required integers");
  }
  if (metadata.marker < 0 || metadata.marker > 255 ||
      metadata.counterStep < 0 || metadata.counterStep > 65535) {
    throw new RangeError("metadata.marker and counterStep are out of range");
  }
  if (abxyLayout !== "PC" && abxyLayout !== "SWITCH") {
    throw new TypeError('abxyLayout must be "PC" or "SWITCH"');
  }
  const suffixOffset = recordCount * APG_RECORD_SIZE;
  const originalSuffix = bytes.slice(suffixOffset);
  const outputRecords = [];
  const copiedRanges = [];
  const generatedSegments = [];
  const usedSourceRecords = new Set();
  let counter = metadata.counterStart;
  if (!Number.isInteger(counter) || counter < 0 || counter > 65535) {
    throw new RangeError("metadata.counterStart must be a 16-bit integer");
  }

  for (const [segmentIndex, segment] of segments.entries()) {
    if (segment && Number.isInteger(segment.sourceStart) &&
        Number.isInteger(segment.sourceCount)) {
      const { sourceStart, sourceCount } = segment;
      if (sourceStart < 0 || sourceCount < 1 || sourceStart + sourceCount > recordCount) {
        throw new RangeError("source segment is outside the declared original record range");
      }
      for (let i = sourceStart; i < sourceStart + sourceCount; i++) {
        if (usedSourceRecords.has(i)) throw new TypeError("source record ranges must not overlap");
        usedSourceRecords.add(i);
        const start = i * APG_RECORD_SIZE;
        outputRecords.push(bytes.slice(start, start + APG_RECORD_SIZE));
      }
      const lastOffset = (sourceStart + sourceCount - 1) * APG_RECORD_SIZE;
      counter = (readU16BE(bytes, lastOffset + 16) + metadata.counterStep) & 0xffff;
      copiedRanges.push({ segmentIndex, sourceStart, sourceCount });
      continue;
    }

    if (!segment || !segment.step || typeof segment.step !== "object") {
      throw new TypeError("each segment must be a source range or contain a step");
    }
    const delay = segment.step.delay;
    if (typeof delay !== "number" || !Number.isFinite(delay) || delay < 0) {
      throw new TypeError("generated step delay must be a finite non-negative number");
    }
    const count = Math.ceil(delay * 79 / 1000);
    if (count === 0) {
      generatedSegments.push({ segmentIndex, recordCount: 0 });
      continue;
    }
    const encoded = encodeAPG({ macroList: [{ ...segment.step }] }, {
      abxyLayout,
      metadata: { marker: metadata.marker, counterStart: counter, counterStep: metadata.counterStep },
      fileSize: Math.max(APG_RECORD_SIZE, count * APG_RECORD_SIZE),
      fillByte: 0,
    });
    if (encoded.recordCount !== count) throw new Error("generated segment record count mismatch");
    for (let i = 0; i < count; i++) {
      const start = i * APG_RECORD_SIZE;
      outputRecords.push(encoded.data.slice(start, start + APG_RECORD_SIZE));
    }
    counter = (counter + count * metadata.counterStep) & 0xffff;
    generatedSegments.push({ segmentIndex, recordCount: count });
  }

  const newRecordCount = outputRecords.length;
  const recordCapacity = Math.floor(bytes.length / APG_RECORD_SIZE);
  if (newRecordCount > recordCapacity) {
    throw new RangeError("rebuilt records exceed the original file capacity");
  }

  const result = new Uint8Array(bytes.length);
  result.fill(fillByte === undefined ? 0x67 : fillByte);
  outputRecords.forEach((record, index) => {
    result.set(record, index * APG_RECORD_SIZE);
  });
  const newSuffixOffset = newRecordCount * APG_RECORD_SIZE;
  const suffixCapacity = result.length - newSuffixOffset;
  result.set(originalSuffix.subarray(0, suffixCapacity), newSuffixOffset);

  const counterDiscontinuities = [];
  for (let i = 1; i < newRecordCount; i++) {
    const previous = readU16BE(result, (i - 1) * APG_RECORD_SIZE + 16);
    const current = readU16BE(result, i * APG_RECORD_SIZE + 16);
    const expected = (previous + metadata.counterStep) & 0xffff;
    if (current !== expected) counterDiscontinuities.push({ recordIndex: i, expected, actual: current });
  }

  return {
    data: result,
    originalRecordCount: recordCount,
    recordCount: newRecordCount,
    copiedRanges,
    generatedSegments,
    removedRecordCount: recordCount - usedSourceRecords.size,
    addedRecordCount: Math.max(0, newRecordCount - usedSourceRecords.size),
    counterDiscontinuities,
    suffixPreservedBytes: Math.min(originalSuffix.length, suffixCapacity),
    warnings: [
      "Copied source records are byte-identical; generated records use the supplied marker/counter profile.",
      "Counter discontinuities are reported, not silently rewritten in copied records.",
      "The original suffix is relocated after the rebuilt records; if the new record area grows, suffix bytes that no longer fit are truncated.",
      "Source records omitted from segments are deleted. The caller is responsible for mapping editor steps to correct source ranges.",
    ],
  };
}
