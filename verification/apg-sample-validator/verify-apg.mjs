#!/usr/bin/env node
/**
 * Cross-check the supplied official-editor JSON export against its APG file.
 * This validator is intentionally scoped to this 2-step, 200 ms sample.
 */
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const APG = process.argv[2] ?? "Auto.apg";
const JSON_PATH = process.argv[3] ?? "macro.json";
const RECORD_SIZE = 18;
const RECORDS_PER_STEP = 16;
const EXPECTED_SIZE = 1024 * 1024;

function fail(message) {
  console.error(`FAIL  ${message}`);
  process.exitCode = 1;
}
function pass(message, detail = "") {
  console.log(`PASS  ${message}${detail ? ` — ${detail}` : ""}`);
}
function same(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

async function main() {
  const [data, jsonText] = await Promise.all([
    readFile(APG),
    readFile(JSON_PATH, "utf8"),
  ]);
  const config = JSON.parse(jsonText);
  const steps = config.macroList;

  const hash = createHash("sha256").update(data).digest("hex");
  console.log(`APG: ${APG}`);
  console.log(`JSON: ${JSON_PATH}`);
  console.log(`Size: ${data.length} bytes`);
  console.log(`SHA-256: ${hash}`);

  if (data.length === EXPECTED_SIZE) pass("APG file is 1 MiB");
  else fail(`APG size is ${data.length}; expected ${EXPECTED_SIZE}`);

  if (Array.isArray(steps) && steps.length === 2) pass("JSON contains exactly two macro steps");
  else {
    fail("JSON must contain exactly two macro steps for this sample");
    return;
  }

  const [normal, blank] = steps;
  if (normal.isBlankDelay === false && normal.delay === 200 && Array.isArray(normal.buttons) && normal.buttons.length > 0) {
    pass("Step 1 is a normal 200 ms action", `${normal.buttons.length} selected button entries`);
  } else fail("Step 1 JSON does not match the expected normal 200 ms action");

  if (blank.isBlankDelay === true && blank.delay === 200 && blank.buttons?.length === 0 && blank.sticks?.length === 0) {
    pass("Step 2 is a blank 200 ms delay");
  } else fail("Step 2 JSON does not match the expected blank 200 ms delay");

  const expectedRecords = steps.reduce((sum, step) => sum + (step.delay === 200 ? RECORDS_PER_STEP : 0), 0);
  const prefixBytes = expectedRecords * RECORD_SIZE;
  if (expectedRecords === 32 && data.length >= prefixBytes) {
    pass("JSON delays imply 32 records for this sample", `${RECORDS_PER_STEP} records per 200 ms step`);
  } else {
    fail(`Expected 32 records / 576-byte record area; calculated ${expectedRecords} records`);
    return;
  }

  const records = [];
  for (let i = 0; i < expectedRecords; i++) {
    const start = i * RECORD_SIZE;
    records.push(data.subarray(start, start + RECORD_SIZE));
  }

  const normalState = records[0].subarray(0, 16);
  const blankState = records[RECORDS_PER_STEP].subarray(0, 16);
  const normalRepeated = records.slice(0, RECORDS_PER_STEP).every(r => same(r.subarray(0, 16), normalState));
  const blankRepeated = records.slice(RECORDS_PER_STEP).every(r => same(r.subarray(0, 16), blankState));

  if (normalRepeated) pass("All 16 records for normal action repeat the same controller state");
  else fail("Normal-action records do not repeat one controller state");

  if (blankRepeated) pass("All 16 records for blank delay repeat the same neutral state");
  else fail("Blank-delay records do not repeat one neutral state");

  const axesNeutral = [0, 2, 4, 6].every(o => blankState.readUInt16BE(o) === 0x0800);
  const triggersNeutral = blankState.readUInt16BE(8) === 0 && blankState.readUInt16BE(10) === 0;
  const buttonsNeutral = blankState.readUInt16BE(12) === 0 && blankState[14] === 0;
  if (axesNeutral && triggersNeutral && buttonsNeutral) pass("Blank-delay APG state is neutral (axes centered; triggers/buttons/d-pad released)");
  else fail("Blank-delay APG state is not fully neutral");

  const selectedIds = normal.buttons.map(b => b.id);
  const hasTriggerSelection = selectedIds.includes("LT") && selectedIds.includes("RT");
  const triggerValuesPresent = normalState.readUInt16BE(8) !== 0 && normalState.readUInt16BE(10) !== 0;
  if (hasTriggerSelection && triggerValuesPresent) pass("JSON LT/RT selections correspond to non-zero APG trigger fields");
  else fail("JSON LT/RT selections do not correspond to non-zero APG trigger fields");

  const hasButtonMask = normalState.readUInt16BE(12) !== 0;
  const hasDpadMask = normalState[14] !== 0;
  if (hasButtonMask && hasDpadMask) pass("Normal-action APG contains button and d-pad state");
  else fail("Normal-action APG is missing button or d-pad state");

  // Source-decoded second-mask bits: R3=01, L3=02, START=04, SELECT=08, HOME=10.
  const secondMaskById = { R3: 0x01, L3: 0x02, START: 0x04, SELECT: 0x08, HOME: 0x10 };
  const expectedSecondMask = selectedIds.reduce((mask, id) => mask | (secondMaskById[id] ?? 0), 0);
  const actualSecondMask = normalState[13];
  if ((actualSecondMask & expectedSecondMask) === expectedSecondMask) {
    pass("JSON R3/L3/START/SELECT/HOME selections are present in APG byte 13",
      `expected bits=0x${expectedSecondMask.toString(16).padStart(2, "0")}, actual=0x${actualSecondMask.toString(16).padStart(2, "0")}`);
  } else {
    fail(`APG byte 13 is missing expected second-mask bits: expected 0x${expectedSecondMask.toString(16)}, actual 0x${actualSecondMask.toString(16)}`);
  }

  let markersOk = true;
  let countersOk = true;
  const firstCounter = records[0].readUInt16BE(16);
  for (let i = 0; i < records.length; i++) {
    if (records[i][15] !== 0x02) markersOk = false;
    if (records[i].readUInt16BE(16) !== firstCounter + i * 14) countersOk = false;
  }
  if (markersOk) pass("All records contain marker 0x02 at byte offset 15");
  else fail("One or more records have an unexpected marker");
  if (countersOk) pass("16-bit big-endian counter advances by 14 per record", `first=${firstCounter}, last=${records.at(-1).readUInt16BE(16)}`);
  else fail("Record counter sequence is inconsistent");

  const tail = data.subarray(prefixBytes);
  const tailUniform = tail.length > 0 && tail.every(b => b === tail[0]);
  if (tailUniform) pass("Unused APG area is uniformly padded", `byte=0x${tail[0].toString(16).padStart(2, "0")}, length=${tail.length}`);
  else fail("Unused APG area is not uniformly padded");

  console.log("");
  if (process.exitCode) console.log("RESULT: FAIL — APG and JSON cross-check did not pass.");
  else console.log("RESULT: PASS — APG structure and the two JSON actions agree on the tested fields.");
}

main().catch(error => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
