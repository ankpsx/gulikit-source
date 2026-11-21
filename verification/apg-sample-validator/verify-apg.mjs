#!/usr/bin/env node
/**
 * Sample-specific validator for the observed Auto.apg browser-export sample.
 *
 * This is a verifier, not an APG parser or generator. It intentionally checks
 * only properties established for this exact sample.
 */

import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const EXPECTED = Object.freeze({
  fileSize: 1_048_576,
  sha256: "15b6c5f4d55e50e08e734c9e337f7b739b3d42c612917941373a4b6c66707617",
  recordSize: 18,
  recordCount: 32,
  populatedBytes: 576,
  groupSize: 16,
  firstGroupPrefix: "0fff00010fff00010fff0fffff1f0602",
  secondGroupPrefix: "08000800080008000000000000000002",
  markerOffset: 15,
  markerValue: 0x02,
  counterOffset: 16,
  counterStart: 11,
  counterStep: 14,
  tailByte: 0xff,
});

function hex(buffer) {
  return Buffer.from(buffer).toString("hex");
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath || inputPath === "--help" || inputPath === "-h") {
    console.log("Usage: node verify-apg.mjs <path-to-Auto.apg>");
    process.exitCode = inputPath ? 0 : 2;
    return;
  }

  return readFile(resolve(inputPath)).then((data) => {
    const failures = [];
    const checks = [];

    function check(name, condition, detail = "") {
      checks.push({ name, passed: Boolean(condition), detail });
      if (!condition) failures.push(name);
    }

    check(
      "File size is exactly 1 MiB",
      data.length === EXPECTED.fileSize,
      `actual=${data.length}, expected=${EXPECTED.fileSize}`,
    );

    const actualHash = sha256(data);
    check(
      "SHA-256 matches the supplied Auto.apg sample",
      actualHash === EXPECTED.sha256,
      `actual=${actualHash}`,
    );

    check(
      "Populated prefix contains exactly 32 complete 18-byte records",
      EXPECTED.recordCount * EXPECTED.recordSize === EXPECTED.populatedBytes &&
        data.length >= EXPECTED.populatedBytes,
      `records=${EXPECTED.recordCount}, stride=${EXPECTED.recordSize}, prefix=${EXPECTED.populatedBytes}`,
    );

    if (data.length >= EXPECTED.populatedBytes) {
      let firstGroupMatches = true;
      let secondGroupMatches = true;
      let markerMatches = true;
      let counterSequenceMatches = true;
      const observedCounters = [];

      for (let index = 0; index < EXPECTED.recordCount; index += 1) {
        const offset = index * EXPECTED.recordSize;
        const record = data.subarray(offset, offset + EXPECTED.recordSize);
        const prefix = hex(record.subarray(0, 16));
        const expectedPrefix =
          index < EXPECTED.groupSize
            ? EXPECTED.firstGroupPrefix
            : EXPECTED.secondGroupPrefix;

        if (prefix !== expectedPrefix) {
          if (index < EXPECTED.groupSize) firstGroupMatches = false;
          else secondGroupMatches = false;
        }

        if (record[EXPECTED.markerOffset] !== EXPECTED.markerValue) {
          markerMatches = false;
        }

        const counter = record.readUInt16BE(EXPECTED.counterOffset);
        observedCounters.push(counter);
        const expectedCounter =
          EXPECTED.counterStart + index * EXPECTED.counterStep;
        if (counter !== expectedCounter) counterSequenceMatches = false;
      }

      check(
        "Records 1–16 match the simultaneous-button state prefix",
        firstGroupMatches,
        `expected prefix=${EXPECTED.firstGroupPrefix}`,
      );
      check(
        "Records 17–32 match the blank-delay state prefix",
        secondGroupMatches,
        `expected prefix=${EXPECTED.secondGroupPrefix}`,
      );
      check(
        "All 32 records contain marker 0x02 at relative offset 15",
        markerMatches,
      );
      check(
        "Big-endian counter starts at 11 and increases by 14 per record",
        counterSequenceMatches,
        `first=${observedCounters[0]}, last=${observedCounters.at(-1)}`,
      );
    } else {
      check("Record-content checks skipped", false, "file is shorter than 576 bytes");
    }

    const tailIsExpected =
      data.length >= EXPECTED.populatedBytes &&
      data.subarray(EXPECTED.populatedBytes).every(
        (byte) => byte === EXPECTED.tailByte,
      );
    check(
      "All bytes from offset 576 to EOF are 0xFF",
      tailIsExpected,
      `tail length=${Math.max(0, data.length - EXPECTED.populatedBytes)}`,
    );

    for (const item of checks) {
      console.log(`${item.passed ? "PASS" : "FAIL"}  ${item.name}`);
      if (item.detail) console.log(`      ${item.detail}`);
    }

    console.log("");
    console.log(
      failures.length === 0
        ? "RESULT: PASS — file matches the recorded Auto.apg sample."
        : `RESULT: FAIL — ${failures.length} check(s) failed.`,
    );

    if (failures.length > 0) process.exitCode = 1;
  });
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
