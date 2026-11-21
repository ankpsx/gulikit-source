import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeMacroConfig } from "./action-model.mjs";
import {
  detectAPGMetadataProfile,
  OFFICIAL_17_STEPS_APG_PROFILE,
  OFFICIAL_29_STEPS_APG_PROFILE,
} from "./apg-metadata-profiles.mjs";

const samplePath = new URL("../verification/apg-sample-validator/Official.29steps.json", import.meta.url);
const sample17JsonPath = new URL("../verification/apg-sample-validator/Official.17steps.json", import.meta.url);
const sample17ApgPath = new URL("../verification/apg-sample-validator/Official.17steps.apg", import.meta.url);

test("recognizes only the exact 29-step action signature paired with the audited APG", async () => {
  const source = JSON.parse(await readFile(samplePath, "utf8"));
  const config = normalizeMacroConfig(source);
  const profile = detectAPGMetadataProfile(config);
  assert.equal(profile, OFFICIAL_29_STEPS_APG_PROFILE);
  assert.deepEqual(profile.metadata, { marker: 2, counterStart: 11, counterStep: 14 });
  assert.equal(profile.evidence.recordCount, 464);
});

test("does not apply the 29-step APG profile to arbitrary or edited JSON", async () => {
  const source = JSON.parse(await readFile(samplePath, "utf8"));
  const config = normalizeMacroConfig(source);

  const changedDelay = structuredClone(config);
  changedDelay.macroList[0].delay = 201;
  assert.equal(detectAPGMetadataProfile(changedDelay), null);

  const changedStrength = structuredClone(config);
  changedStrength.macroList[4].sticks[0].value = 99;
  assert.equal(detectAPGMetadataProfile(changedStrength), null);

  const changedAction = structuredClone(config);
  changedAction.macroList[21].buttons[0].id = "D_LEFT";
  assert.equal(detectAPGMetadataProfile(changedAction), null);

  const shortened = structuredClone(config);
  shortened.macroList.pop();
  assert.equal(detectAPGMetadataProfile(shortened), null);

  const blankStep = structuredClone(config);
  blankStep.macroList[0].isBlankDelay = true;
  assert.equal(detectAPGMetadataProfile(blankStep), null);
});

test("recognizes the exact 17-step official JSON and exports its paired APG byte-for-byte", async () => {
  const source = JSON.parse(await readFile(sample17JsonPath, "utf8"));
  const config = normalizeMacroConfig(source);
  const profile = detectAPGMetadataProfile(config);
  assert.equal(profile, OFFICIAL_17_STEPS_APG_PROFILE);
  assert.deepEqual(profile.metadata, { marker: 2, counterStart: 11, counterStep: 14 });
  assert.equal(profile.abxyLayout, "SWITCH");
  assert.equal(profile.fillByte, 0xff);
  assert.equal(profile.evidence.recordCount, 777);

  const { encodeAPG } = await import("./apg-codec.mjs");
  const expected = await readFile(sample17ApgPath);
  const actual = encodeAPG(config, { abxyLayout: "SWITCH" }).data;
  assert.deepEqual(Buffer.from(actual), expected);
});

test("does not apply the 17-step profile when order, action, delay or blank flag changes", async () => {
  const source = JSON.parse(await readFile(sample17JsonPath, "utf8"));
  const config = normalizeMacroConfig(source);

  const reordered = structuredClone(config);
  [reordered.macroList[2].sticks[0], reordered.macroList[2].sticks[1]] =
    [reordered.macroList[2].sticks[1], reordered.macroList[2].sticks[0]];
  assert.equal(detectAPGMetadataProfile(reordered), null);

  const changedDpad = structuredClone(config);
  changedDpad.macroList[7].buttons[1].id = "D_UP";
  assert.equal(detectAPGMetadataProfile(changedDpad), null);

  const changedDelay = structuredClone(config);
  changedDelay.macroList[15].delay = 2999;
  assert.equal(detectAPGMetadataProfile(changedDelay), null);

  const changedBlank = structuredClone(config);
  changedBlank.macroList[14].isBlankDelay = false;
  assert.equal(detectAPGMetadataProfile(changedBlank), null);
});
