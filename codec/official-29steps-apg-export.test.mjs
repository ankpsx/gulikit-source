import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { encodeAPG, APG_RECORD_SIZE } from "./apg-codec.mjs";
import { detectAPGMetadataProfile } from "./apg-metadata-profiles.mjs";

const jsonPath = new URL("../verification/apg-sample-validator/Official.29steps.json", import.meta.url);
const apgPath = new URL("../verification/apg-sample-validator/Official.29steps.apg", import.meta.url);

test("JSON export with its exact paired profile reproduces all 464 official APG records", async () => {
  const [jsonText, officialBytes] = await Promise.all([
    readFile(jsonPath, "utf8"),
    readFile(apgPath),
  ]);
  const config = JSON.parse(jsonText);
  const profile = detectAPGMetadataProfile(config);
  assert.ok(profile, "official 29-step JSON should match its paired profile");

  const encoded = encodeAPG(config, {
    metadata: profile.metadata,
    abxyLayout: profile.abxyLayout,
    fillByte: profile.fillByte,
  });

  assert.equal(encoded.recordCount, 464);
  assert.equal(encoded.requestedRecordCount, 464);
  assert.equal(encoded.truncated, false);
  assert.equal(encoded.data.length, 1024 * 1024);

  const activeLength = 464 * APG_RECORD_SIZE;
  assert.deepEqual(
    Buffer.from(encoded.data.subarray(0, activeLength)),
    officialBytes.subarray(0, activeLength),
    "all encoded controller records must match the paired official APG sample byte-for-byte",
  );
  assert.deepEqual(
    Buffer.from(encoded.data.subarray(activeLength)),
    officialBytes.subarray(activeLength),
    "the sample-specific FF tail must match byte-for-byte",
  );
});
