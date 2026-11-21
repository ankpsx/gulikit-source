/**
 * Sample-scoped APG metadata profiles.
 *
 * A profile is selected only when the imported JSON action signature exactly
 * matches the corresponding paired sample. These values are not universal
 * APG defaults and must not be applied to arbitrary JSON files.
 */

const OFFICIAL_29_STEPS_ACTIONS = Object.freeze([
  "button:LT",
  "button:RT",
  "button:LB",
  "button:RB",
  "stick:L_STICK:UP:100",
  "stick:L_STICK:LEFT:100",
  "stick:L_STICK:DOWN:100",
  "stick:L_STICK:RIGHT:100",
  "button:L3",
  "button:SELECT",
  "button:START",
  "button:HOME",
  "button:Y",
  "button:X",
  "button:A",
  "button:B",
  "stick:R_STICK:RIGHT:100",
  "stick:R_STICK:UP:100",
  "stick:R_STICK:LEFT:100",
  "stick:R_STICK:DOWN:100",
  "button:R3",
  "button:D_RIGHT",
  "button:D_LEFT",
  "button:D_DOWN",
  "button:D_UP",
  "button:D_UP_RIGHT",
  "button:D_DOWN_LEFT",
  "button:D_DOWN_RIGHT",
  "button:D_UP_LEFT",
]);

export const OFFICIAL_29_STEPS_APG_PROFILE = Object.freeze({
  id: "official-29steps-sample",
  label: "Official.29steps.apg paired sample",
  metadata: Object.freeze({
    marker: 0x02,
    counterStart: 11,
    counterStep: 14,
  }),
  abxyLayout: "SWITCH",
  fillByte: 0xff,
  evidence: Object.freeze({
    apgFile: "verification/apg-sample-validator/Official.29steps.apg",
    recordSize: 18,
    recordCount: 464,
    apgSha256: "c51b5b280ac4ba442b8cd8327c4b2068ed13efbb08a80293c3dc97ae194b5c07",
    tailLength: 1040224,
    tailFillByte: 0xff,
  }),
});

function stepActionSignature(step) {
  return [
    ...(step.buttons ?? []).map(button => `button:${button.id}`),
    ...(step.sticks ?? []).map(stick =>
      `stick:${stick.stick?.id}:${stick.direction}:${stick.value ?? ""}`),
  ].sort();
}

/**
 * Return the exact paired-sample metadata profile when the JSON macro action
 * signature matches all 29 steps. Any changed action, direction, strength,
 * blank flag, or delay makes the detection fail closed.
 */
export function detectAPGMetadataProfile(config) {
  if (!config || !Array.isArray(config.macroList) ||
      config.macroList.length !== OFFICIAL_29_STEPS_ACTIONS.length) return null;

  for (let index = 0; index < config.macroList.length; index++) {
    const step = config.macroList[index];
    if (!step || step.delay !== 200 || step.isBlankDelay !== false) return null;
    const expected = [OFFICIAL_29_STEPS_ACTIONS[index]];
    const actual = stepActionSignature(step);
    if (actual.length !== expected.length || actual[0] !== expected[0]) return null;
  }

  return OFFICIAL_29_STEPS_APG_PROFILE;
}
