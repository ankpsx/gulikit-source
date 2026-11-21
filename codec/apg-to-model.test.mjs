import test from "node:test";
import assert from "node:assert/strict";
import { encodeAPG } from "./apg-codec.mjs";
import { apgToEditableModel } from "./apg-to-model.mjs";

const metadata = { marker: 2, counterStart: 11, counterStep: 14 };
const button = id => ({ id, label: id, type: id === "LT" ? "trigger" : "button", position: { row: 0, col: 0 } });

test("APG run projects into editable action model with raw record preservation", () => {
  const encoded = encodeAPG({
    fileName: "macro",
    macroList: [{ id: 1, buttons: [button("A")], sticks: [], delay: 200, isBlankDelay: false }],
  }, { metadata, abxyLayout: "PC", fileSize: 1024 });
  const result = apgToEditableModel(encoded.data, { recordCount: encoded.recordCount, abxyLayout: "PC" });
  assert.equal(result.config.macroList.length, 1);
  assert.equal(result.config.macroList[0].buttons[0].id, "A");
  assert.equal(result.config.macroList[0].delay, 200);
  assert.equal(result.config.macroList[0].apgSource.rawRecordsHex.length, 16);
  assert.ok(result.source.tailHex.length > 0);
});

test("blank APG run becomes blank delay and retains inferred timing range", () => {
  const encoded = encodeAPG({
    fileName: "macro",
    macroList: [{ id: 1, buttons: [], sticks: [], delay: 200, isBlankDelay: true }],
  }, { metadata, abxyLayout: "PC", fileSize: 1024 });
  const result = apgToEditableModel(encoded.data, { recordCount: encoded.recordCount, abxyLayout: "PC" });
  const step = result.config.macroList[0];
  assert.equal(step.isBlankDelay, true);
  assert.deepEqual(step.buttons, []);
  assert.deepEqual(step.sticks, []);
  assert.deepEqual(step.apgSource.possibleDelayMs, { min: 190, max: 202 });
});

test("layout is required and user can override inferred delay", () => {
  const encoded = encodeAPG({
    fileName: "macro",
    macroList: [{ id: 1, buttons: [], sticks: [], delay: 200, isBlankDelay: true }],
  }, { metadata, abxyLayout: "PC", fileSize: 1024 });
  assert.throws(() => apgToEditableModel(encoded.data, { recordCount: encoded.recordCount }), /abxyLayout/);
  const result = apgToEditableModel(encoded.data, {
    recordCount: encoded.recordCount, abxyLayout: "PC", preferredDelayMs: 195,
  });
  assert.equal(result.config.macroList[0].delay, 195);
});


test("editable model adapter can opt into automatic record-range detection", () => {
  const encoded = encodeAPG({
    fileName: "auto-range",
    macroList: [{ id: 1, buttons: [button("A")], sticks: [], delay: 200, isBlankDelay: false }],
  }, { metadata, abxyLayout: "PC", fileSize: 1024, fillByte: 0xff });
  const result = apgToEditableModel(encoded.data, {
    abxyLayout: "PC",
    autoDetectRecordCount: true,
  });
  assert.equal(result.source.recordCount, 16);
  assert.equal(result.source.recordRangeDetection.status, "detected");
  assert.equal(result.config.macroList.length, 1);
});
