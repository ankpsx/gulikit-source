/**
 * Conservative GuliKit APG encoder (first implementation).
 *
 * Evidence-backed payload fields are encoded from the shared macro model.
 * Record metadata is deliberately explicit: marker/counter policy is not yet
 * established across independent exports. The source-derived tail byte is
 * 0x67; callers may choose another byte when reproducing a known sample.
 */

export const APG_FILE_SIZE = 1024 * 1024;
export const APG_RECORD_SIZE = 18;
export const APG_RECORDS_PER_SECOND_FACTOR = 79;

export const DPAD = Object.freeze({
  NEUTRAL: 0,
  D_UP: 1,
  D_UP_RIGHT: 2,
  D_RIGHT: 3,
  D_DOWN_RIGHT: 4,
  D_DOWN: 5,
  D_DOWN_LEFT: 6,
  D_LEFT: 7,
  D_UP_LEFT: 8,
});

const FIRST_MASK = Object.freeze({
  A: [0x02, 0x01],
  B: [0x01, 0x02],
  X: [0x08, 0x04],
  Y: [0x04, 0x08],
  LB: [0x10, 0x10],
  RB: [0x20, 0x20],
  LT: [0x40, 0x40],
  RT: [0x80, 0x80],
});

const SECOND_MASK = Object.freeze({
  R3: 0x01,
  L3: 0x02,
  START: 0x04,
  SELECT: 0x08,
  HOME: 0x10,
});

const STICK_IDS = Object.freeze({ left: "L_STICK", right: "R_STICK" });

function writeU16BE(bytes, offset, value) {
  // Mirrors the official serializer's bitwise + Uint8Array byte writes.
  bytes[offset] = (value >> 8) & 0xff;
  bytes[offset + 1] = value & 0xff;
}

function axisMagnitude(value) {
  // Official code uses value || 0, then Math.round(value * 100 / 2047).
  return Math.round(((value || 0) * 100) / 2047);
}

function actionState(step, abxyLayout) {
  const axes = { lx: 2048, ly: 2048, rx: 2048, ry: 2048 };
  let triggerL = 0;
  let triggerR = 0;
  let mask1 = 0;
  let mask2 = 0;
  let dpad = DPAD.NEUTRAL;

  if (!step.isBlankDelay) {
    for (const stickEntry of step.sticks ?? []) {
      const stickId = stickEntry.stick?.id;
      const magnitude = axisMagnitude(stickEntry.value);
      const direction = stickEntry.direction;
      const target = stickId === STICK_IDS.left ? "l" :
        stickId === STICK_IDS.right ? "r" : null;
      if (!target) continue;

      // Deliberately cardinal-only: the official serializer switch has no
      // diagonal cases. Later entries overwrite earlier assignments.
      if (direction === "UP") axes[target + "y"] = 2048 + magnitude;
      else if (direction === "DOWN") axes[target + "y"] = 2048 - magnitude;
      else if (direction === "LEFT") axes[target + "x"] = 2048 - magnitude;
      else if (direction === "RIGHT") axes[target + "x"] = 2048 + magnitude;
    }

    for (const button of step.buttons ?? []) {
      const id = button.id;
      if (id === "LT") triggerL = 4095;
      if (id === "RT") triggerR = 4095;

      const masks = FIRST_MASK[id];
      if (masks) mask1 |= masks[abxyLayout === "PC" ? 0 : 1];
      if (SECOND_MASK[id]) mask2 |= SECOND_MASK[id];

      if (Object.hasOwn(DPAD, id)) dpad = DPAD[id];
    }
  }

  return { ...axes, triggerL, triggerR, mask1, mask2, dpad };
}

function validateConfig(config) {
  if (!config || typeof config !== "object" || !Array.isArray(config.macroList)) {
    throw new TypeError("config.macroList must be an array");
  }
  for (const [index, step] of config.macroList.entries()) {
    if (!step || typeof step !== "object") {
      throw new TypeError(`macroList[${index}] must be an object`);
    }
    if (typeof step.delay !== "number" || !Number.isFinite(step.delay)) {
      throw new TypeError(`macroList[${index}].delay must be a finite number`);
    }
  }
}

/**
 * Encode a JSON/editor configuration into the official 1 MiB APG container.
 *
 * metadata is required because marker/counter conventions have only been
 * cross-checked against one supplied APG sample so far:
 *   { marker: 2, counterStart: 11, counterStep: 14 }
 *
 * Options:
 *   abxyLayout: "PC" | "SWITCH" (default "PC")
 *   metadata: required marker/counter profile
 *   fillByte: source expression resolves to 0x67; default 0x67
 *   fileSize: default 1 MiB; useful for tests, never exceed official size
 */
export function encodeAPG(config, options = {}) {
  validateConfig(config);
  const {
    abxyLayout = "PC",
    metadata,
    fillByte = 0x67,
    fileSize = APG_FILE_SIZE,
  } = options;

  if (!metadata || !Number.isInteger(metadata.marker) ||
      !Number.isInteger(metadata.counterStart) ||
      !Number.isInteger(metadata.counterStep)) {
    throw new TypeError("metadata.marker, metadata.counterStart and metadata.counterStep are required integers");
  }
  if (abxyLayout !== "PC" && abxyLayout !== "SWITCH") {
    throw new TypeError('abxyLayout must be "PC" or "SWITCH"');
  }
  if (!Number.isInteger(fileSize) || fileSize < APG_RECORD_SIZE || fileSize > APG_FILE_SIZE) {
    throw new RangeError("fileSize must be between 18 bytes and 1 MiB");
  }
  if (!Number.isInteger(fillByte) || fillByte < 0 || fillByte > 255 ||
      !Number.isInteger(metadata.marker) || metadata.marker < 0 || metadata.marker > 255) {
    throw new RangeError("fillByte and metadata.marker must be bytes");
  }

  const recordCapacity = Math.floor(fileSize / APG_RECORD_SIZE);
  const output = new Uint8Array(fileSize).fill(fillByte);
  let recordIndex = 0;
  let requestedRecordCount = 0;
  let counter = metadata.counterStart;

  for (const step of config.macroList) {
    // Same expression as the official editor. Negative delays produce no
    // iterations in its loop; validation above only rejects non-finite values.
    const count = Math.ceil((step.delay * APG_RECORDS_PER_SECOND_FACTOR) / 1000);
    if (count > 0) requestedRecordCount += count;
    const state = actionState(step, abxyLayout);

    for (let i = 0; i < count; i++) {
      if (recordIndex >= recordCapacity) break;
      const offset = recordIndex * APG_RECORD_SIZE;

      writeU16BE(output, offset + 0, state.lx);
      writeU16BE(output, offset + 2, state.ly);
      writeU16BE(output, offset + 4, state.rx);
      writeU16BE(output, offset + 6, state.ry);
      writeU16BE(output, offset + 8, state.triggerL);
      writeU16BE(output, offset + 10, state.triggerR);
      output[offset + 12] = state.mask1;
      output[offset + 13] = state.mask2;
      output[offset + 14] = state.dpad;
      output[offset + 15] = metadata.marker;
      writeU16BE(output, offset + 16, counter);

      recordIndex++;
      counter = (counter + metadata.counterStep) & 0xffff;
    }
  }

  return {
    data: output,
    recordCount: recordIndex,
    requestedRecordCount,
    truncated: requestedRecordCount > recordCapacity,
    warnings: [
      "Marker/counter values are supplied by the caller; their universal APG rule is not yet proven.",
      "The encoder implements verified cardinal stick directions only; diagonal stick entries are ignored, matching the audited serializer switch.",
    ],
  };
}


const DPAD_BY_VALUE = Object.freeze(Object.fromEntries(
  Object.entries(DPAD).filter(([key]) => key.startsWith("D_")).map(([key, value]) => [value, key]),
));

const FIRST_BUTTONS = Object.freeze([
  ["A", 0x02, 0x01], ["B", 0x01, 0x02],
  ["X", 0x08, 0x04], ["Y", 0x04, 0x08],
  ["LB", 0x10, 0x10], ["RB", 0x20, 0x20],
  ["LT", 0x40, 0x40], ["RT", 0x80, 0x80],
]);

const SECOND_BUTTONS = Object.freeze([
  ["R3", 0x01], ["L3", 0x02], ["START", 0x04],
  ["SELECT", 0x08], ["HOME", 0x10],
]);

function readU16BE(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

/**
 * Low-level, loss-aware APG record parser.
 *
 * It intentionally requires recordCount. A 1 MiB APG file has no proven
 * universal terminator: the sample tail is 0xFF while the audited source's
 * fill expression resolves to 0x67. Guessing the end of records could eat
 * valid records or discard opaque data.
 *
 * Returns parsed fields plus each exact 18-byte record and the untouched tail.
 * This is not yet a high-level macro-step reconstruction.
 */
export function decodeAPGRecords(input, options = {}) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const { recordCount, abxyLayout } = options;

  if (!Number.isInteger(recordCount) || recordCount < 0) {
    throw new TypeError("recordCount must be supplied as a non-negative integer");
  }
  const capacity = Math.floor(bytes.length / APG_RECORD_SIZE);
  if (recordCount > capacity) {
    throw new RangeError(`recordCount exceeds file capacity (${capacity})`);
  }
  if (abxyLayout !== undefined && abxyLayout !== "PC" && abxyLayout !== "SWITCH") {
    throw new TypeError('abxyLayout must be "PC" or "SWITCH"');
  }

  const records = [];
  const warnings = [];
  for (let index = 0; index < recordCount; index++) {
    const offset = index * APG_RECORD_SIZE;
    const raw = bytes.slice(offset, offset + APG_RECORD_SIZE);
    const buttonMask1 = raw[12];
    const buttonMask2 = raw[13];
    const buttons = [];
    const faceButtonCandidates = [];

    for (const [id, pcMask, switchMask] of FIRST_BUTTONS) {
      const pcActive = (buttonMask1 & pcMask) !== 0;
      const switchActive = (buttonMask1 & switchMask) !== 0;
      if (["A", "B", "X", "Y"].includes(id)) {
        if (abxyLayout === "PC" && pcActive) buttons.push(id);
        else if (abxyLayout === "SWITCH" && switchActive) buttons.push(id);
        else if (abxyLayout === undefined && (pcActive || switchActive)) {
          faceButtonCandidates.push({ id, pcActive, switchActive });
        }
      } else if (pcActive) {
        buttons.push(id);
      }
    }

    for (const [id, mask] of SECOND_BUTTONS) {
      if ((buttonMask2 & mask) !== 0) buttons.push(id);
    }

    const dpad = raw[14] === 0 ? null : (DPAD_BY_VALUE[raw[14]] ?? null);
    if (raw[14] !== 0 && dpad === null) {
      warnings.push(`Record ${index}: unknown D-pad value 0x${raw[14].toString(16).padStart(2, "0")}`);
    }
    if (raw[15] !== 0x02) {
      warnings.push(`Record ${index}: marker is 0x${raw[15].toString(16).padStart(2, "0")}, not sample marker 0x02`);
    }

    records.push({
      index,
      axes: {
        leftX: readU16BE(raw, 0),
        leftY: readU16BE(raw, 2),
        rightX: readU16BE(raw, 4),
        rightY: readU16BE(raw, 6),
      },
      triggers: { LT: readU16BE(raw, 8), RT: readU16BE(raw, 10) },
      buttonMask1,
      buttonMask2,
      buttons,
      faceButtonCandidates,
      dpad,
      marker: raw[15],
      counter: readU16BE(raw, 16),
      raw,
    });
  }

  const recordBytes = recordCount * APG_RECORD_SIZE;
  return {
    recordCount,
    records,
    tail: bytes.slice(recordBytes),
    trailingFragment: bytes.slice(capacity * APG_RECORD_SIZE),
    warnings,
    fidelity: "record-level; macro steps and original delays are not reconstructed",
  };
}
