import test from "node:test";
import assert from "node:assert/strict";
import { detectAPGRecordRange } from "./apg-range-detect.mjs";

function makeRecords(count, { marker = 2, counterStart = 11, counterStep = 14 } = {}) {
  const bytes = new Uint8Array(count * 18);
  for (let i = 0; i < count; i++) {
    const o = i * 18;
    bytes[o] = 0x08;
    bytes[o + 1] = i & 0xff;
    bytes[o + 15] = marker;
    const counter = (counterStart + i * counterStep) & 0xffff;
    bytes[o + 16] = counter >>> 8;
    bytes[o + 17] = counter & 0xff;
  }
  return bytes;
}

test("detects aligned 0xFF padding after a stable record prefix", () => {
  const active = makeRecords(32);
  const file = new Uint8Array(1024 * 1024).fill(0xff);
  file.set(active);
  const result = detectAPGRecordRange(file);
  assert.equal(result.status, "detected");
  assert.equal(result.recordCount, 32);
  assert.equal(result.fillByte, 0xff);
  assert.equal(result.profile.counterStep, 14);
  assert.equal(result.tail.length, file.length - 32 * 18);
});

test("detects source-expression 0x67 fill when evidence pattern is stable", () => {
  const active = makeRecords(5, { marker: 7, counterStart: 65520, counterStep: 14 });
  const file = new Uint8Array(256).fill(0x67);
  file.set(active);
  const result = detectAPGRecordRange(file);
  assert.equal(result.status, "detected");
  assert.equal(result.recordCount, 5);
  assert.equal(result.fillByte, 0x67);
  assert.equal(result.profile.counterStart, 65520);
});

test("supports modulo-16-bit counter wrap", () => {
  const active = makeRecords(4, { counterStart: 65530, counterStep: 14 });
  const file = new Uint8Array(128).fill(0xff);
  file.set(active);
  const result = detectAPGRecordRange(file);
  assert.equal(result.status, "detected");
  assert.equal(result.profile.counterStep, 14);
});

test("ambiguous for an all-fill file", () => {
  const result = detectAPGRecordRange(new Uint8Array(1024).fill(0xff));
  assert.equal(result.status, "ambiguous");
  assert.equal(result.recordCount, null);
});

test("ambiguous when marker changes inside the candidate prefix", () => {
  const active = makeRecords(5);
  active[3 * 18 + 15] = 9;
  const file = new Uint8Array(256).fill(0xff);
  file.set(active);
  const result = detectAPGRecordRange(file);
  assert.equal(result.status, "ambiguous");
});

test("ambiguous when counter progression is inconsistent", () => {
  const active = makeRecords(5);
  active[4 * 18 + 17] += 1;
  const file = new Uint8Array(256).fill(0xff);
  file.set(active);
  const result = detectAPGRecordRange(file);
  assert.equal(result.status, "ambiguous");
});

test("ambiguous when fill suffix does not start on a record boundary", () => {
  const active = makeRecords(5);
  const file = new Uint8Array(256).fill(0xff);
  file.set(active);
  file[active.length] = 0x00;
  const result = detectAPGRecordRange(file);
  assert.equal(result.status, "ambiguous");
});

test("ambiguous for too-short and empty input", () => {
  assert.equal(detectAPGRecordRange(new Uint8Array()).status, "ambiguous");
  assert.equal(detectAPGRecordRange(new Uint8Array(36)).status, "ambiguous");
});
