/**
 * Conservative APG record-range detector.
 *
 * This is a heuristic, not a universal APG terminator specification. It only
 * reports an automatic candidate when a uniform supported fill suffix begins
 * on an 18-byte boundary and the preceding records share a marker and a
 * constant modulo-16-bit counter delta. Otherwise callers must ask the user.
 */
export const APG_DETECTOR_FILL_BYTES = Object.freeze([0xff, 0x67]);
export const APG_DETECTOR_RECORD_SIZE = 18;

function asBytes(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  throw new TypeError("input must be a Uint8Array, ArrayBuffer, or ArrayBuffer view");
}

function readU16BE(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function findUniformSuffixStart(bytes, fillByte) {
  let offset = bytes.length;
  while (offset > 0 && bytes[offset - 1] === fillByte) offset--;
  return offset;
}

function inspectPrefix(bytes, recordCount) {
  if (recordCount < 3) {
    return { valid: false, reason: "At least three complete records are required to infer a stable counter progression." };
  }

  const marker = bytes[15];
  const firstCounter = readU16BE(bytes, 16);
  const secondCounter = readU16BE(bytes, 18 + 16);
  const counterStep = (secondCounter - firstCounter + 0x10000) & 0xffff;

  for (let index = 0; index < recordCount; index++) {
    const offset = index * APG_DETECTOR_RECORD_SIZE;
    if (bytes[offset + 15] !== marker) {
      return { valid: false, reason: `Marker changes at record ${index}; the sample-style constant-marker pattern does not hold.` };
    }
    if (index > 0) {
      const previous = readU16BE(bytes, offset - 2);
      const current = readU16BE(bytes, offset + 16);
      const delta = (current - previous + 0x10000) & 0xffff;
      if (delta !== counterStep) {
        return { valid: false, reason: `Counter progression changes at record ${index}; automatic boundary is not safe.` };
      }
    }
  }

  return { valid: true, marker, counterStart: firstCounter, counterStep };
}

/**
 * Returns {status:"detected"|"ambiguous", ...}. Never edits or strips bytes.
 * A detected count is a best-supported candidate, not a mathematical proof:
 * active data could coincidentally end with the same fill pattern.
 */
export function detectAPGRecordRange(input) {
  const bytes = asBytes(input);
  const recordCapacity = Math.floor(bytes.length / APG_DETECTOR_RECORD_SIZE);
  const trailingFragmentLength = bytes.length % APG_DETECTOR_RECORD_SIZE;

  if (bytes.length < APG_DETECTOR_RECORD_SIZE * 3) {
    return {
      status: "ambiguous",
      confidence: "none",
      recordCount: null,
      recordCapacity,
      trailingFragmentLength,
      candidates: [],
      warnings: ["File is too short to establish a stable marker/counter pattern."],
    };
  }

  const candidates = [];
  for (const fillByte of APG_DETECTOR_FILL_BYTES) {
    const suffixStart = findUniformSuffixStart(bytes, fillByte);
    if (suffixStart === bytes.length) continue;
    if (suffixStart % APG_DETECTOR_RECORD_SIZE !== 0) continue;

    const recordCount = suffixStart / APG_DETECTOR_RECORD_SIZE;
    const tailLength = bytes.length - suffixStart;
    if (recordCount < 3 || tailLength < APG_DETECTOR_RECORD_SIZE) continue;

    const profile = inspectPrefix(bytes, recordCount);
    if (!profile.valid) continue;

    candidates.push({
      recordCount,
      recordBytes: suffixStart,
      fillByte,
      tailLength,
      marker: profile.marker,
      counterStart: profile.counterStart,
      counterStep: profile.counterStep,
    });
  }

  if (candidates.length !== 1) {
    const reasons = candidates.length > 1
      ? ["More than one fill/profile interpretation is plausible."]
      : ["No unique aligned fill suffix with a stable marker and counter progression was found."];
    return {
      status: "ambiguous",
      confidence: "none",
      recordCount: null,
      recordCapacity,
      trailingFragmentLength,
      candidates,
      warnings: [
        ...reasons,
        "Do not guess from 0xFF or 0x67 alone; supply recordCount manually and preserve the remaining bytes.",
      ],
    };
  }

  const candidate = candidates[0];
  return {
    status: "detected",
    confidence: "heuristic-high",
    recordCount: candidate.recordCount,
    recordBytes: candidate.recordBytes,
    tail: bytes.slice(candidate.recordBytes),
    recordCapacity,
    trailingFragmentLength,
    profile: {
      marker: candidate.marker,
      counterStart: candidate.counterStart,
      counterStep: candidate.counterStep,
    },
    fillByte: candidate.fillByte,
    warnings: [
      "Boundary is inferred from an aligned uniform 0xFF/0x67 suffix plus a stable marker/counter pattern; it is not a universal APG terminator rule.",
      "A legitimate final record that coincidentally matches the fill pattern cannot be distinguished from padding using this evidence alone. Preserve the original file and allow manual recordCount override.",
    ],
  };
}
