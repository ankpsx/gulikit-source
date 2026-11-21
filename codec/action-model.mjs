/**
 * Shared, loss-aware macro action model for the GuliKit editor.
 *
 * Imported official JSON descriptors are retained (including labels,
 * positions and unknown properties). Defaults are applied only when creating
 * new UI steps, never silently to imported steps.
 */

export const MACRO_JSON_VERSION = "1.0";
export const DEFAULT_DELAY_MS = 200;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneJsonValue(value) {
  // JSON configuration is JSON data; this also prevents callers mutating the
  // normalized model through nested references.
  return JSON.parse(JSON.stringify(value));
}

function validateDelay(delay, path) {
  if (typeof delay !== "number" || !Number.isFinite(delay) || delay < 0) {
    throw new TypeError(`${path} must be a finite, non-negative number`);
  }
}

function validateButton(button, path) {
  if (!isObject(button) || typeof button.id !== "string" || !button.id) {
    throw new TypeError(`${path}.id must be a non-empty string`);
  }
}

function validateStick(stickEntry, path) {
  if (!isObject(stickEntry) || !isObject(stickEntry.stick) ||
      typeof stickEntry.stick.id !== "string" || !stickEntry.stick.id) {
    throw new TypeError(`${path}.stick.id must be a non-empty string`);
  }
  if (typeof stickEntry.direction !== "string" || !stickEntry.direction) {
    throw new TypeError(`${path}.direction must be a non-empty string`);
  }
  if (stickEntry.value !== undefined &&
      (typeof stickEntry.value !== "number" || !Number.isFinite(stickEntry.value))) {
    throw new TypeError(`${path}.value must be a finite number when supplied`);
  }
}

/**
 * Validate and normalize the official JSON shape without discarding fields.
 * Unknown properties at config, step and descriptor level are preserved.
 */
export function normalizeMacroConfig(input) {
  if (!isObject(input)) throw new TypeError("config must be an object");
  if (typeof input.fileName !== "string" || !input.fileName.trim()) {
    throw new TypeError("config.fileName must be a non-empty string");
  }
  if (!Array.isArray(input.macroList)) {
    throw new TypeError("config.macroList must be an array");
  }
  if (input.version !== undefined && typeof input.version !== "string") {
    throw new TypeError("config.version must be a string when supplied");
  }

  const config = cloneJsonValue(input);
  config.version ??= MACRO_JSON_VERSION;

  config.macroList.forEach((step, index) => {
    const path = `config.macroList[${index}]`;
    if (!isObject(step)) throw new TypeError(`${path} must be an object`);
    if (step.id === undefined || step.id === null || !["string", "number"].includes(typeof step.id)) {
      throw new TypeError(`${path}.id must be a string or number`);
    }
    validateDelay(step.delay, `${path}.delay`);
    if (!Array.isArray(step.buttons)) throw new TypeError(`${path}.buttons must be an array`);
    if (!Array.isArray(step.sticks)) throw new TypeError(`${path}.sticks must be an array`);
    if (step.isBlankDelay !== true && step.isBlankDelay !== false) {
      throw new TypeError(`${path}.isBlankDelay must be a boolean`);
    }
    step.buttons.forEach((button, buttonIndex) => validateButton(button, `${path}.buttons[${buttonIndex}]`));
    step.sticks.forEach((stick, stickIndex) => validateStick(stick, `${path}.sticks[${stickIndex}]`));

    if (step.isBlankDelay && (step.buttons.length !== 0 || step.sticks.length !== 0)) {
      throw new TypeError(`${path} is a blank delay and must not contain buttons or sticks`);
    }
  });

  return config;
}

/** Create a normal action step using the official editor's default delay. */
export function createActionStep({ id, buttons = [], sticks = [], delay = DEFAULT_DELAY_MS }) {
  if (id === undefined || id === null || !["string", "number"].includes(typeof id)) {
    throw new TypeError("step id must be a string or number");
  }
  validateDelay(delay, "step.delay");
  if (!Array.isArray(buttons) || !Array.isArray(sticks)) {
    throw new TypeError("buttons and sticks must be arrays");
  }
  const step = {
    id,
    buttons: cloneJsonValue(buttons),
    sticks: cloneJsonValue(sticks),
    delay,
    isBlankDelay: false,
  };
  // Validate descriptor shape by validating a one-step config.
  normalizeMacroConfig({ fileName: "macro", macroList: [step] });
  return step;
}

/** Create an independently timed blank-delay step (default 200 ms). */
export function createBlankDelayStep({ id, delay = DEFAULT_DELAY_MS }) {
  if (id === undefined || id === null || !["string", "number"].includes(typeof id)) {
    throw new TypeError("step id must be a string or number");
  }
  validateDelay(delay, "step.delay");
  return { id, buttons: [], sticks: [], delay, isBlankDelay: true };
}

/** Return a new config with exactly one step's delay changed. */
export function updateStepDelay(configInput, stepId, delay) {
  validateDelay(delay, "delay");
  const config = normalizeMacroConfig(configInput);
  const index = config.macroList.findIndex(step => step.id === stepId);
  if (index < 0) throw new RangeError(`step not found: ${String(stepId)}`);
  config.macroList[index] = { ...config.macroList[index], delay };
  return config;
}

/** Export the normalized model in the official JSON envelope. */
export function exportMacroJson(configInput) {
  const config = normalizeMacroConfig(configInput);
  return JSON.stringify({
    ...config,
    version: MACRO_JSON_VERSION,
  }, null, 2);
}
