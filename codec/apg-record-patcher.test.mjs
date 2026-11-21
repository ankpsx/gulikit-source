import test from "node:test";
import assert from "node:assert/strict";
import { encodeAPG } from "./apg-codec.mjs";
import { patchAPGRecordStates } from "./apg-record-patcher.mjs";

const metadata = { marker: 2, counterStart: 11, counterStep: 14 };
const button = id => ({ id, label: id, type: "button" });

function makeFile() {
  const encoded = encodeAPG({
    macroList: [
      { id: 1, buttons: [button("A")], sticks: [], delay: 200, isBlankDelay: false },
      { id: 2, buttons: [], sticks: [], delay: 200, isBlankDelay: true },
    ],
  }, { metadata, abxyLayout: "PC", fileSize: 1024, fillByte: 0xff });
  return encoded;
}

test("patches one record state and preserves all other bytes and file length", () => {
  const source = makeFile();
  const before = new Uint8Array(source.data);
  const result = patchAPGRecordStates(before, {
    recordCount: source.recordCount,
    abxyLayout: "PC",
    patches: [{ recordIndex: 0, step: { buttons: [button("B")], sticks: [], isBlankDelay: false } }],
  });
  assert.equal(result.data.length, before.length);
  assert.deepEqual(result.patchedRecords, [0]);
  assert.equal(result.data[0 + 12], 0x01);
  assert.deepEqual(result.data.slice(15, 18), before.slice(15, 18));
  assert.deepEqual(result.data.slice(18), before.slice(18));
  assert.deepEqual(result.tail, before.slice(source.recordCount * 18));
});

test("preserves opaque upper bits of byte 13 when patching a record", () => {
  const source = makeFile();
  const before = new Uint8Array(source.data);
  before[13] |= 0xa0;
  const result = patchAPGRecordStates(before, {
    recordCount: source.recordCount,
    abxyLayout: "PC",
    patches: [{ recordIndex: 0, step: { buttons: [button("HOME")], sticks: [], isBlankDelay: false } }],
  });
  assert.equal(result.data[13] & 0xe0, 0xa0);
  assert.equal(result.data[13] & 0x1f, 0x10);
});

test("supports multiple selected record patches without touching intervening records", () => {
  const source = makeFile();
  const before = new Uint8Array(source.data);
  const result = patchAPGRecordStates(before, {
    recordCount: source.recordCount,
    abxyLayout: "PC",
    patches: [
      { recordIndex: 0, step: { buttons: [button("X")], sticks: [], isBlankDelay: false } },
      { recordIndex: 17, step: { buttons: [button("Y")], sticks: [], isBlankDelay: false } },
    ],
  });
  assert.deepEqual(result.patchedRecords, [0, 17]);
  assert.deepEqual(result.data.slice(18, 17 * 18), before.slice(18, 17 * 18));
  assert.deepEqual(result.data.slice(17 * 18 + 15, 17 * 18 + 18), before.slice(17 * 18 + 15, 17 * 18 + 18));
});

test("rejects duplicate or out-of-range record patches", () => {
  const source = makeFile();
  const patch = { recordIndex: 0, step: { buttons: [], sticks: [] } };
  assert.throws(() => patchAPGRecordStates(source.data, {
    recordCount: source.recordCount, abxyLayout: "PC", patches: [patch, patch],
  }), /duplicate/);
  assert.throws(() => patchAPGRecordStates(source.data, {
    recordCount: source.recordCount, abxyLayout: "PC", patches: [{ ...patch, recordIndex: source.recordCount }],
  }), /recordIndex/);
});

test("empty patch list returns byte-identical file", () => {
  const source = makeFile();
  const result = patchAPGRecordStates(source.data, {
    recordCount: source.recordCount, abxyLayout: "PC", patches: [],
  });
  assert.deepEqual(result.data, source.data);
});
