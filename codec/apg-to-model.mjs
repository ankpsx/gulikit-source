/**
 * APG inferred-run -> editable macro model adapter.
 *
 * This is a lossy semantic projection by design: the exact source records and
 * inferred delay range are attached to each step so the UI can disclose what
 * cannot be recovered. Unknown bytes are never silently discarded.
 */
import { decodeAPGSteps } from "./apg-codec.mjs";

const BUTTON_LABELS = Object.freeze({
  A: "A", B: "B", X: "X", Y: "Y",
  LB: "LB", RB: "RB", LT: "LT", RT: "RT",
  L3: "L3", R3: "R3", START: "START", SELECT: "SELECT", HOME: "HOME",
  D_UP: "D-Up", D_DOWN: "D-Down", D_LEFT: "D-Left", D_RIGHT: "D-Right",
  D_UP_LEFT: "D-Up-Left", D_UP_RIGHT: "D-Up-Right",
  D_DOWN_LEFT: "D-Down-Left", D_DOWN_RIGHT: "D-Down-Right",
});

function hex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function descriptor(id) {
  return { id, label: BUTTON_LABELS[id] ?? id, type: id === "LT" || id === "RT" ? "trigger" : "button" };
}

function inferStickEntries(axes) {
  const entries = [];
  const axesToDirections = [
    ["L_STICK", "UP", "leftY", 1],
    ["L_STICK", "DOWN", "leftY", -1],
    ["L_STICK", "LEFT", "leftX", -1],
    ["L_STICK", "RIGHT", "leftX", 1],
    ["R_STICK", "UP", "rightY", 1],
    ["R_STICK", "DOWN", "rightY", -1],
    ["R_STICK", "LEFT", "rightX", -1],
    ["R_STICK", "RIGHT", "rightX", 1],
  ];
  for (const [stickId, direction, axis, sign] of axesToDirections) {
    const delta = axes[axis] - 2048;
    if (delta !== 0 && Math.sign(delta) === sign) {
      // The original input value is not uniquely recoverable after rounding.
      const value = Math.abs(delta) * 2047 / 100;
      entries.push({
        stick: { id: stickId, label: stickId === "L_STICK" ? "Left Stick" : "Right Stick", type: "stick" },
        direction,
        value: Math.round(value * 1000) / 1000,
      });
    }
  }
  return entries;
}

function inferStep(run, index, preferredDelayMs) {
  const record = run.state;
  const buttons = record.buttons.map(descriptor);
  if (record.dpad) buttons.push(descriptor(record.dpad));
  if (record.triggers.LT > 0 && !buttons.some(button => button.id === "LT")) buttons.push(descriptor("LT"));
  if (record.triggers.RT > 0 && !buttons.some(button => button.id === "RT")) buttons.push(descriptor("RT"));

  const sticks = inferStickEntries({
    leftX: record.axes.leftX,
    leftY: record.axes.leftY,
    rightX: record.axes.rightX,
    rightY: record.axes.rightY,
  });

  const range = run.delayMsRange;
  const chosenDelay = preferredDelayMs !== undefined
    ? preferredDelayMs
    : range.min === range.max ? range.min
      : Math.max(range.min, Math.min(range.max, 200));

  return {
    id: `apg-step-${index + 1}`,
    buttons,
    sticks,
    delay: chosenDelay,
    isBlankDelay: buttons.length === 0 && sticks.length === 0,
    apgSource: {
      recordStart: run.recordsStart,
      recordEnd: run.recordsEnd,
      recordCount: run.recordCount,
      possibleDelayMs: { ...range },
      delayWasInferred: true,
      rawRecordsHex: run.records.map(item => hex(item.raw)),
      markerValues: [...new Set(run.records.map(item => item.marker))],
      counterStart: run.records[0]?.counter ?? null,
      counterEnd: run.records.at(-1)?.counter ?? null,
    },
  };
}

/**
 * Decode APG into a JSON-shaped editable model.
 *
 * Required option: abxyLayout (PC or SWITCH). Supply recordCount explicitly,
 * or opt in to autoDetectRecordCount when conservative detection is acceptable.
 * Ambiguous delays default to 200 ms when it falls inside the valid range,
 * otherwise the minimum valid integer delay. Pass preferredDelayMs to override.
 */
export function apgToEditableModel(input, options = {}) {
  const { recordCount, abxyLayout, fileName = "imported-apg", preferredDelayMs, autoDetectRecordCount = false } = options;
  if (abxyLayout !== "PC" && abxyLayout !== "SWITCH") {
    throw new TypeError('abxyLayout must be explicitly "PC" or "SWITCH"');
  }
  if (preferredDelayMs !== undefined &&
      (typeof preferredDelayMs !== "number" || !Number.isFinite(preferredDelayMs) || preferredDelayMs < 0)) {
    throw new TypeError("preferredDelayMs must be a finite non-negative number");
  }

  const decoded = decodeAPGSteps(input, { recordCount, abxyLayout, autoDetectRecordCount });
  const macroList = decoded.runs.map((run, index) => inferStep(run, index, preferredDelayMs));
  const warnings = [...decoded.warnings];
  if (decoded.runs.some(run => run.delayMsExact === null)) {
    warnings.push("One or more step delays are ambiguous. Editable delay values are inferred; see apgSource.possibleDelayMs before accepting or changing them.");
  }
  if (decoded.runs.some(run => run.state.faceButtonCandidates.length > 0)) {
    warnings.push("ABXY interpretation was unresolved; select PC or SWITCH layout and re-import.");
  }
  if (decoded.runs.some(run => run.state.axes.leftX !== 2048 && run.state.axes.leftY !== 2048 ||
      run.state.axes.rightX !== 2048 && run.state.axes.rightY !== 2048)) {
    warnings.push("Stick values are approximate inversions of rounded axis values; original UI values may not be recoverable exactly.");
  }

  return {
    config: { fileName, version: "1.0", macroList },
    source: {
      recordCount: decoded.recordCount,
      recordRangeDetection: decoded.rangeDetection,
      tailHex: hex(decoded.tail),
      trailingFragmentHex: hex(decoded.trailingFragment),
      fidelity: "editable inferred model; raw APG record bytes retained per step and tail retained separately",
    },
    warnings,
  };
}
