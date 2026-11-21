import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_DELAY_MS,
  createActionStep,
  createBlankDelayStep,
  normalizeMacroConfig,
  updateStepDelay,
  exportMacroJson,
} from "./action-model.mjs";

const buttonA = { id: "A", label: "A", type: "button", position: { row: 2, col: 1 } };
const stickUp = {
  stick: { id: "L_STICK", label: "Left Stick", type: "stick", position: { row: 1, col: 1 } },
  direction: "UP",
  value: 100,
};

test("new ordinary and blank steps default independently to 200 ms", () => {
  assert.equal(DEFAULT_DELAY_MS, 200);
  assert.equal(createActionStep({ id: "a", buttons: [buttonA] }).delay, 200);
  const blank = createBlankDelayStep({ id: "b" });
  assert.equal(blank.delay, 200);
  assert.equal(blank.isBlankDelay, true);
  assert.deepEqual(blank.buttons, []);
  assert.deepEqual(blank.sticks, []);
});

test("custom delay is stored per step without changing neighbouring steps", () => {
  const config = { fileName: "macro", macroList: [
    createActionStep({ id: 1, buttons: [buttonA], delay: 350 }),
    createBlankDelayStep({ id: 2, delay: 725 }),
  ] };
  const changed = updateStepDelay(config, 1, 410);
  assert.equal(changed.macroList[0].delay, 410);
  assert.equal(changed.macroList[1].delay, 725);
  assert.equal(config.macroList[0].delay, 350);
});

test("normalization preserves official descriptors and unknown fields", () => {
  const source = {
    fileName: "sample",
    version: "1.0",
    futureConfigField: { keep: true },
    macroList: [{
      id: 123,
      buttons: [buttonA],
      sticks: [stickUp],
      delay: 200,
      isBlankDelay: false,
      futureStepField: "opaque",
    }],
  };
  const normalized = normalizeMacroConfig(source);
  assert.deepEqual(normalized, source);
  assert.notEqual(normalized, source);
  assert.notEqual(normalized.macroList[0], source.macroList[0]);
});

test("JSON export retains independent delays and official version", () => {
  const json = exportMacroJson({ fileName: "macro", macroList: [
    createActionStep({ id: 1, buttons: [buttonA], delay: 350 }),
    createBlankDelayStep({ id: 2, delay: 125 }),
  ] });
  const parsed = JSON.parse(json);
  assert.equal(parsed.version, "1.0");
  assert.deepEqual(parsed.macroList.map(step => step.delay), [350, 125]);
});

test("rejects invalid delay, descriptors and malformed blank steps", () => {
  assert.throws(() => createActionStep({ id: 1, delay: -1 }), /non-negative/);
  assert.throws(() => createActionStep({ id: 1, buttons: [{ label: "missing id" }] }), /id/);
  assert.throws(() => normalizeMacroConfig({ fileName: "x", macroList: [{
    id: 1, buttons: [buttonA], sticks: [], delay: 200, isBlankDelay: true,
  }] }), /blank delay/);
  assert.throws(() => updateStepDelay({ fileName: "x", macroList: [] }, 99, 100), /step not found/);
});
