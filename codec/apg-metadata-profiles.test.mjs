import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeMacroConfig } from "./action-model.mjs";
import {
  detectAPGMetadataProfile,
  OFFICIAL_29_STEPS_APG_PROFILE,
} from "./apg-metadata-profiles.mjs";

const samplePath = new URL("../verification/apg-sample-validator/Official.29steps.json", import.meta.url);

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
