import test from "node:test";
import assert from "node:assert/strict";
import { encodeAPG, APG_RECORD_SIZE, DPAD } from "./apg-codec.mjs";

const metadata = { marker: 2, counterStart: 11, counterStep: 14 };
const record = (bytes, n = 0) =>
  bytes.subarray(n * APG_RECORD_SIZE, (n + 1) * APG_RECORD_SIZE);
const u16 = (r, offset) => (r[offset] << 8) | r[offset + 1];

test("200 ms produces 16 records; blank delay is neutral", () => {
  const result = encodeAPG({ macroList: [
    { delay: 200, isBlankDelay: false, buttons: [], sticks: [] },
    { delay: 200, isBlankDelay: true, buttons: [], sticks: [] },
  ] }, { metadata });
  assert.equal(result.recordCount, 32);
  assert.equal(result.data.length, 1024 * 1024);
  const blank = record(result.data, 16);
  assert.deepEqual([0, 2, 4, 6].map(o => u16(blank, o)), [2048, 2048, 2048, 2048]);
  assert.deepEqual([u16(blank, 8), u16(blank, 10), blank[12], blank[13], blank[14]], [0, 0, 0, 0, 0]);
});

test("PC and Switch ABXY layouts use different face-button masks", () => {
  const config = { macroList: [{ delay: 13, buttons: [
    { id: "A" }, { id: "B" }, { id: "X" }, { id: "Y" },
  ], sticks: [] }] };
  const pc = record(encodeAPG(config, { metadata, fileSize: 18 }).data);
  const sw = record(encodeAPG(config, { metadata, abxyLayout: "SWITCH", fileSize: 18 }).data);
  assert.equal(pc[12], 0x0f);
  assert.equal(sw[12], 0x0f);
  assert.notEqual(pc[12], sw[12]); // all four buttons together are invariant
});

test("trigger and second-mask fields are encoded", () => {
  const bytes = encodeAPG({ macroList: [{ delay: 13, buttons: [
    { id: "LT" }, { id: "RT" }, { id: "L3" }, { id: "R3" },
    { id: "START" }, { id: "SELECT" }, { id: "HOME" },
  ], sticks: [] }] }, { metadata, fileSize: 18 }).data;
  const r = record(bytes);
  assert.equal(u16(r, 8), 4095);
  assert.equal(u16(r, 10), 4095);
  assert.equal(r[13], 0x1f);
});

test("d-pad values and cardinal stick values are written big-endian", () => {
  const bytes = encodeAPG({ macroList: [{ delay: 13, buttons: [{ id: "D_UP_RIGHT" }],
    sticks: [{ stick: { id: "L_STICK" }, direction: "RIGHT", value: 100 }] }] },
  { metadata, fileSize: 18 }).data;
  const r = record(bytes);
  assert.equal(r[14], DPAD.D_UP_RIGHT);
  assert.equal(u16(r, 0), 2048 + Math.round(100 * 100 / 2047));
});

test("zero delay creates no records and preserves fill", () => {
  const result = encodeAPG({ macroList: [{ delay: 0, buttons: [], sticks: [] }] },
    { metadata, fileSize: 36, fillByte: 0xff });
  assert.equal(result.recordCount, 0);
  assert.ok(result.data.every(v => v === 0xff));
});

test("rejects absent metadata and invalid layout", () => {
  assert.throws(() => encodeAPG({ macroList: [] }), /metadata/);
  assert.throws(() => encodeAPG({ macroList: [] }, { metadata, abxyLayout: "bad" }), /abxyLayout/);
});
