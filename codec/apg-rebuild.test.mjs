import test from "node:test";
import assert from "node:assert/strict";
import { encodeAPG } from "./apg-codec.mjs";
import { rebuildAPGFromSegments } from "./apg-rebuild.mjs";

const metadata = { marker: 2, counterStart: 11, counterStep: 14 };
const button = id => ({ id, label: id, type: "button" });
const step = (id, delay = 200) => ({
  id, buttons: [button(id)], sticks: [], delay, isBlankDelay: false,
});

function sourceFile() {
  return encodeAPG({ macroList: [step("A"), step("B")] }, {
    metadata, abxyLayout: "PC", fileSize: 1024, fillByte: 0xff,
  });
}

test("copies unchanged source range byte-for-byte and appends generated step", () => {
  const source = sourceFile();
  const firstRun = source.data.slice(0, 16 * 18);
  const result = rebuildAPGFromSegments(source.data, {
    recordCount: 32, metadata, abxyLayout: "PC", fillByte: 0xff,
    segments: [{ sourceStart: 0, sourceCount: 16 }, { step: step("X", 100) }],
  });
  assert.equal(result.recordCount, 24);
  assert.deepEqual(result.data.slice(0, 16 * 18), firstRun);
  assert.equal(result.data[16 * 18 + 12], 0x08);
  assert.deepEqual(result.data.slice(24 * 18, 24 * 18 + (1024 - 32 * 18)), source.data.slice(32 * 18));
  assert.ok(result.data.slice(24 * 18 + (1024 - 32 * 18)).every(byte => byte === 0xff));
});

test("supports delay changes by regenerating only the selected step", () => {
  const source = sourceFile();
  const secondRun = source.data.slice(16 * 18, 32 * 18);
  const result = rebuildAPGFromSegments(source.data, {
    recordCount: 32, metadata, abxyLayout: "PC", fillByte: 0xff,
    segments: [{ sourceStart: 0, sourceCount: 16 }, { step: step("B", 300) }],
  });
  assert.equal(result.recordCount, 40);
  assert.deepEqual(result.data.slice(0, 16 * 18), source.data.slice(0, 16 * 18));
  assert.equal(result.data[16 * 18 + 12], 0x01);
  assert.deepEqual(result.data.slice(40 * 18), source.data.slice(32 * 18, 32 * 18 + (1024 - 40 * 18)));
  assert.equal(secondRun.length, 16 * 18);
});

test("supports deleting a source step by omitting its range", () => {
  const source = sourceFile();
  const result = rebuildAPGFromSegments(source.data, {
    recordCount: 32, metadata, abxyLayout: "PC", fillByte: 0xff,
    segments: [{ sourceStart: 16, sourceCount: 16 }],
  });
  assert.equal(result.recordCount, 16);
  assert.deepEqual(result.data.slice(0, 16 * 18), source.data.slice(16 * 18, 32 * 18));
  assert.equal(result.removedRecordCount, 16);
});

test("supports inserting a generated step between preserved source ranges", () => {
  const source = sourceFile();
  const result = rebuildAPGFromSegments(source.data, {
    recordCount: 32, metadata, abxyLayout: "PC", fillByte: 0xff,
    segments: [
      { sourceStart: 0, sourceCount: 16 },
      { step: step("X", 100) },
      { sourceStart: 16, sourceCount: 16 },
    ],
  });
  assert.equal(result.recordCount, 40);
  assert.deepEqual(result.data.slice(0, 16 * 18), source.data.slice(0, 16 * 18));
  assert.deepEqual(result.data.slice(24 * 18, 40 * 18), source.data.slice(16 * 18, 32 * 18));
  assert.equal(result.counterDiscontinuities.length, 16);
});

test("rejects overlapping source ranges and output overflow", () => {
  const source = sourceFile();
  assert.throws(() => rebuildAPGFromSegments(source.data, {
    recordCount: 32, metadata, abxyLayout: "PC",
    segments: [{ sourceStart: 0, sourceCount: 16 }, { sourceStart: 8, sourceCount: 4 }],
  }), /overlap/);
  assert.throws(() => rebuildAPGFromSegments(source.data, {
    recordCount: 32, metadata, abxyLayout: "PC",
    segments: [{ step: step("A", 20000) }],
  }), /capacity/);
});

test("preserves the original suffix exactly when its full length fits", () => {
  const source = sourceFile();
  const result = rebuildAPGFromSegments(source.data, {
    recordCount: 32, metadata, abxyLayout: "PC", fillByte: 0xff,
    segments: [{ sourceStart: 0, sourceCount: 16 }],
  });
  assert.deepEqual(result.data.slice(16 * 18, 16 * 18 + (1024 - 32 * 18)), source.data.slice(32 * 18));
  assert.ok(result.data.slice(16 * 18 + (1024 - 32 * 18)).every(byte => byte === 0xff));
});
