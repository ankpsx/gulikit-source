/**
 * Loss-aware, fixed-layout APG record patcher.
 *
 * Applies semantic edits to explicitly selected record indices while retaining
 * record count, marker/counter bytes, opaque high bits in byte 13, all untouched
 * records, and the original tail byte-for-byte. This deliberately does not
 * insert/delete records or alter timing.
 */
import { encodeAPG, APG_RECORD_SIZE } from "./apg-codec.mjs";

function toBytes(input) {
  if (input instanceof Uint8Array) return new Uint8Array(input);
  if (input instanceof ArrayBuffer) return new Uint8Array(input.slice(0));
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
  }
  throw new TypeError("input must be a Uint8Array, ArrayBuffer, or ArrayBuffer view");
}

function readU16BE(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

/**
 * patches: [{ recordIndex, step }]
 * step uses the shared action model (buttons, sticks, isBlankDelay).
 */
export function patchAPGRecordStates(input, options = {}) {
  const bytes = toBytes(input);
  const { recordCount, patches, abxyLayout } = options;

  if (!Number.isInteger(recordCount) || recordCount < 0) {
    throw new TypeError("recordCount must be a non-negative integer");
  }
  const capacity = Math.floor(bytes.length / APG_RECORD_SIZE);
  if (recordCount > capacity) throw new RangeError("recordCount exceeds file capacity");
  if (!Array.isArray(patches)) throw new TypeError("patches must be an array");
  if (abxyLayout !== "PC" && abxyLayout !== "SWITCH") {
    throw new TypeError('abxyLayout must be "PC" or "SWITCH"');
  }

  const output = new Uint8Array(bytes);
  const seen = new Set();
  const patchedRecords = [];

  for (const patch of patches) {
    if (!patch || !Number.isInteger(patch.recordIndex) ||
        patch.recordIndex < 0 || patch.recordIndex >= recordCount) {
      throw new RangeError("each patch.recordIndex must point to a declared record");
    }
    if (seen.has(patch.recordIndex)) {
      throw new TypeError("duplicate recordIndex patches are not allowed");
    }
    if (!patch.step || typeof patch.step !== "object") {
      throw new TypeError("each patch must include a step object");
    }
    seen.add(patch.recordIndex);

    const offset = patch.recordIndex * APG_RECORD_SIZE;
    const marker = bytes[offset + 15];
    const counter = readU16BE(bytes, offset + 16);
    const encoded = encodeAPG({
      macroList: [{
        ...patch.step,
        delay: 1,
      }],
    }, {
      abxyLayout,
      metadata: { marker, counterStart: counter, counterStep: 0 },
      fileSize: APG_RECORD_SIZE,
      fillByte: 0,
    });

    if (encoded.recordCount !== 1) {
      throw new Error("internal error: a one-record patch did not encode exactly one record");
    }

    // Bytes 0-12 and 14 are fully represented by the current semantic model.
    // Byte 13's lower five bits are known; preserve its upper three opaque bits.
    output.set(encoded.data.subarray(0, 13), offset);
    output[offset + 13] = (bytes[offset + 13] & 0xe0) | (encoded.data[13] & 0x1f);
    output[offset + 14] = encoded.data[14];
    // Offsets 15-17 (marker/counter) are intentionally untouched.
    patchedRecords.push(patch.recordIndex);
  }

  return {
    data: output,
    patchedRecords,
    recordCount,
    tail: output.slice(recordCount * APG_RECORD_SIZE),
    warnings: [
      "Record count and timing are unchanged; this operation patches selected existing record states only.",
      "Marker/counter and byte-13 upper three bits are preserved. Unknown semantics inside the other control fields are not independently understood.",
      "Adding/removing steps or changing delays requires a separate layout-aware rebuild operation.",
    ],
  };
}
