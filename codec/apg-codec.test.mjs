import test from "node:test";
import assert from "node:assert/strict";
import { encodeAPG, decodeAPGSteps, APG_RECORD_SIZE, DPAD } from "./apg-codec.mjs";

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
  const config = { macroList: [{ delay: 13, buttons: [{ id: "A" }], sticks: [] }] };
  const pc = record(encodeAPG(config, { metadata, fileSize: 18 }).data);
  const sw = record(encodeAPG(config, { metadata, abxyLayout: "SWITCH", fileSize: 18 }).data);
  assert.equal(pc[12], 0x02);
  assert.equal(sw[12], 0x01);
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


test("record parser preserves raw records and opaque tail bytes", async () => {
  const { decodeAPGRecords } = await import("./apg-codec.mjs");
  const encoded = encodeAPG({ macroList: [{ delay: 1, buttons: [{ id: "A" }, { id: "LT" }],
    sticks: [] }] }, { metadata, fileSize: 64, fillByte: 0xff });
  const parsed = decodeAPGRecords(encoded.data, { recordCount: 1, abxyLayout: "PC" });
  assert.equal(parsed.records.length, 1);
  assert.deepEqual([...parsed.records[0].raw], [...record(encoded.data)]);
  assert.equal(parsed.records[0].buttons.includes("A"), true);
  assert.equal(parsed.records[0].triggers.LT, 4095);
  assert.equal(parsed.tail.length, 46);
  assert.ok(parsed.tail.every(byte => byte === 0xff));
});

test("record parser leaves ABXY interpretation unresolved without layout", async () => {
  const { decodeAPGRecords } = await import("./apg-codec.mjs");
  const bytes = encodeAPG({ macroList: [{ delay: 13, buttons: [{ id: "A" }], sticks: [] }] },
    { metadata, fileSize: 18 }).data;
  const parsed = decodeAPGRecords(bytes, { recordCount: 1 });
  assert.deepEqual(parsed.records[0].buttons, []);
  assert.ok(parsed.records[0].faceButtonCandidates.length > 0);
});

test("record parser requires explicit record count and preserves counter/marker", async () => {
  const { decodeAPGRecords } = await import("./apg-codec.mjs");
  const bytes = encodeAPG({ macroList: [{ delay: 13, buttons: [], sticks: [] }] },
    { metadata, fileSize: 18 }).data;
  assert.throws(() => decodeAPGRecords(bytes), /recordCount/);
  const parsed = decodeAPGRecords(bytes, { recordCount: 1 });
  assert.equal(parsed.records[0].marker, 2);
  assert.equal(parsed.records[0].counter, 11);
  assert.equal(parsed.records[0].raw.length, 18);
});


test("high-level run grouping reports delay ranges, not fabricated exact delays", () => {
  const config = { macroList: [
    { delay: 200, buttons: [{ id: "A" }], sticks: [] },
    { delay: 200, buttons: [], sticks: [] },
  ] };
  const encoded = encodeAPG(config, { metadata, fileSize: 1024, fillByte: 0xff });
  const decoded = decodeAPGSteps(encoded.data, { recordCount: 32, abxyLayout: "PC" });
  assert.equal(decoded.runs.length, 2);
  assert.equal(decoded.runs[0].recordCount, 16);
  assert.deepEqual(decoded.runs[0].delayMsRange, { min: 190, max: 202 });
  assert.equal(decoded.runs[0].delayMsExact, null);
  assert.deepEqual(decoded.runs[1].delayMsRange, { min: 190, max: 202 });
  assert.match(decoded.warnings.join(" "), /cannot be distinguished/);
});

test("adjacent identical action states are merged and explicitly marked ambiguous", () => {
  const config = { macroList: [
    { delay: 13, buttons: [{ id: "A" }], sticks: [] },
    { delay: 13, buttons: [{ id: "A" }], sticks: [] },
  ] };
  const encoded = encodeAPG(config, { metadata, fileSize: 128, fillByte: 0xff });
  const decoded = decodeAPGSteps(encoded.data, { recordCount: 2, abxyLayout: "PC" });
  assert.equal(decoded.runs.length, 1);
  assert.equal(decoded.runs[0].recordCount, 2);
  assert.match(decoded.warnings.join(" "), /identical states/);
});

test("delay inverse range is exact for one-record run", () => {
  const encoded = encodeAPG({ macroList: [{ delay: 1, buttons: [], sticks: [] }] },
    { metadata, fileSize: 18 });
  const decoded = decodeAPGSteps(encoded.data, { recordCount: 1 });
  assert.deepEqual(decoded.runs[0].delayMsRange, { min: 1, max: 12 });
  assert.equal(decoded.runs[0].delayMsExact, null);
});


test("stick value coercion and overflow follow the serializer arithmetic", () => {
  const encodeAxis = value => {
    const bytes = encodeAPG({ macroList: [{ delay: 13, buttons: [], sticks: [
      { stick: { id: "L_STICK" }, direction: "RIGHT", ...(value === undefined ? {} : { value }) },
    ] }] }, { metadata, fileSize: 18 }).data;
    return u16(record(bytes), 0);
  };
  assert.equal(encodeAxis(undefined), 2048);
  assert.equal(encodeAxis(-2047), 1948);
  assert.equal(encodeAxis(0.5), 2048);
  assert.equal(encodeAxis(2047), 2148);
  assert.equal(encodeAxis(2000000), (2048 + Math.round(2000000 * 100 / 2047)) & 0xffff);
  assert.equal(encodeAxis(null), 2048);
});

test("negative delays produce no records; capacity overflow is reported", () => {
  const negative = encodeAPG({ macroList: [{ delay: -100, buttons: [], sticks: [] }] },
    { metadata, fileSize: 36 });
  assert.equal(negative.recordCount, 0);
  assert.equal(negative.requestedRecordCount, 0);
  const overflow = encodeAPG({ macroList: [{ delay: 40, buttons: [], sticks: [] }] },
    { metadata, fileSize: 36 });
  assert.equal(overflow.requestedRecordCount, 4);
  assert.equal(overflow.recordCount, 2);
  assert.equal(overflow.truncated, true);
});
