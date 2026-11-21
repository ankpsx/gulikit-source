/**
 * Sample-scoped APG metadata profiles.
 *
 * A profile is selected only when the imported JSON action signature exactly
 * matches the corresponding paired sample. These values are not universal
 * APG defaults and must not be applied to arbitrary JSON files.
 */

const OFFICIAL_17_STEPS_ACTIONS = Object.freeze([
  { delay: 200, blank: false, actions: ["button:LB", "button:LT"] },
  { delay: 200, blank: false, actions: ["button:RB", "button:RT"] },
  { delay: 200, blank: false, actions: ["stick:L_STICK:LEFT:100", "stick:L_STICK:RIGHT:100"] },
  { delay: 200, blank: false, actions: ["stick:L_STICK:UP:100", "stick:L_STICK:DOWN:100"] },
  { delay: 200, blank: false, actions: ["button:SELECT", "button:START"] },
  { delay: 200, blank: false, actions: ["button:X", "button:A", "button:B", "button:Y"] },
  { delay: 200, blank: false, actions: ["stick:R_STICK:RIGHT:100", "stick:R_STICK:UP:100", "stick:R_STICK:LEFT:100", "stick:R_STICK:DOWN:100"] },
  { delay: 200, blank: false, actions: ["button:D_RIGHT", "button:D_LEFT"] },
  { delay: 200, blank: false, actions: ["button:D_UP", "button:D_DOWN"] },
  { delay: 200, blank: false, actions: ["button:D_UP_LEFT", "button:D_UP_RIGHT"] },
  { delay: 200, blank: false, actions: ["button:D_UP_RIGHT", "button:D_DOWN_RIGHT"] },
  { delay: 200, blank: false, actions: ["button:D_DOWN_LEFT", "button:D_DOWN_RIGHT"] },
  { delay: 200, blank: false, actions: ["button:D_UP_LEFT", "button:D_DOWN_RIGHT", "button:D_UP_RIGHT"] },
  { delay: 200, blank: false, actions: ["button:D_RIGHT", "button:D_UP", "button:Y", "button:X", "button:B"] },
  { delay: 2000, blank: true, actions: [] },
  { delay: 3000, blank: false, actions: ["button:LB"] },
  { delay: 2000, blank: true, actions: [] },
]);

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

export const OFFICIAL_17_STEPS_APG_PROFILE = Object.freeze({
  id: "official-17steps-sample",
  label: "Official.17steps.apg paired sample",
  metadata: Object.freeze({
    marker: 0x02,
    counterStart: 11,
    counterStep: 14,
  }),
  abxyLayout: "SWITCH",
  fillByte: 0xff,
  evidence: Object.freeze({
    apgFile: "verification/apg-sample-validator/Official.17steps.apg",
    jsonFile: "verification/apg-sample-validator/Official.17steps.json",
    recordSize: 18,
    recordCount: 777,
    apgSha256: "4e00caeb6de9ce6cdb30dd667de6af09a27ff619ec888316d3b3f6dc19049373",
    tailLength: 1034590,
    tailFillByte: 0xff,
  }),
});

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

function orderedStepActionSignature(step) {
  return [
    ...(step.buttons ?? []).map(button => `button:${button.id}`),
    ...(step.sticks ?? []).map(stick =>
      `stick:${stick.stick?.id}:${stick.direction}:${stick.value ?? ""}`),
  ];
}

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
  if (!config || !Array.isArray(config.macroList)) return null;

  if (config.macroList.length === OFFICIAL_17_STEPS_ACTIONS.length) {
    const matches17StepSample = config.macroList.every((step, index) => {
      const expected = OFFICIAL_17_STEPS_ACTIONS[index];
      return step && step.delay === expected.delay &&
        step.isBlankDelay === expected.blank &&
        JSON.stringify(orderedStepActionSignature(step)) === JSON.stringify(expected.actions);
    });
    if (matches17StepSample) return OFFICIAL_17_STEPS_APG_PROFILE;
  }

  if (config.macroList.length !== OFFICIAL_29_STEPS_ACTIONS.length) return null;

  for (let index = 0; index < config.macroList.length; index++) {
    const step = config.macroList[index];
    if (!step || step.delay !== 200 || step.isBlankDelay !== false) return null;
    const expected = [OFFICIAL_29_STEPS_ACTIONS[index]];
    const actual = stepActionSignature(step);
    if (actual.length !== expected.length || actual[0] !== expected[0]) return null;
  }

  return OFFICIAL_29_STEPS_APG_PROFILE;
}
