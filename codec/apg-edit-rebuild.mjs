import { rebuildAPGFromSegments } from "./apg-rebuild.mjs";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function editableSnapshot(step) {
  return {
    buttons: clone(step.buttons ?? []),
    sticks: clone(step.sticks ?? []),
    delay: step.delay,
    isBlankDelay: Boolean(step.isBlankDelay),
  };
}

function inferMetadata(input, recordCount, supplied) {
  if (supplied) return supplied;
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (recordCount < 2) {
    throw new Error("Cannot infer counterStep from fewer than two source records; supply metadata explicitly");
  }
  const marker = bytes[15];
  const counterStart = (bytes[16] << 8) | bytes[17];
  let counterStep = null;
  for (let i = 1; i < recordCount; i++) {
    const offset = i * 18;
    if (bytes[offset + 15] !== marker) {
      throw new Error("Source marker changes within the file; supply an explicit metadata profile");
    }
    const previousOffset = (i - 1) * 18 + 16;
    const previous = (bytes[previousOffset] << 8) | bytes[previousOffset + 1];
    const current = (bytes[offset + 16] << 8) | bytes[offset + 17];
    const delta = (current - previous + 65536) & 0xffff;
    if (counterStep === null) counterStep = delta;
    else if (delta !== counterStep) {
      throw new Error("Source counter is not a constant modulo-65536 sequence; supply metadata explicitly");
    }
  }
  return { marker, counterStart, counterStep };
}

/**
 * Imported steps are preserved only if their editable fields still match the
 * exact imported snapshot. Edited/new steps are regenerated from the model.
 */
export function buildAPGRebuildPlan(input, importedModel, editedConfig, options = {}) {
  if (!importedModel?.config?.macroList || !Array.isArray(editedConfig?.macroList)) {
    throw new TypeError("importedModel.config and editedConfig.macroList are required");
  }
  const sourceCount = importedModel.source?.recordCount;
  if (!Number.isInteger(sourceCount)) throw new TypeError("importedModel.source.recordCount is required");

  const originalById = new Map(importedModel.config.macroList.map(step => [step.id, step]));
  const segments = [];
  const preservedStepIds = [];
  const regeneratedStepIds = [];
  const removedStepIds = [];

  const editedIds = new Set(editedConfig.macroList.map(step => step.id));
  for (const original of importedModel.config.macroList) {
    if (!editedIds.has(original.id)) removedStepIds.push(original.id);
  }

  for (const step of editedConfig.macroList) {
    const original = originalById.get(step.id);
    const source = original?.apgSource;
    const baseline = source?.baseline;
    const unchanged = Boolean(
      original && source && baseline &&
      sameJson(editableSnapshot(step), baseline)
    );

    if (unchanged) {
      if (!Number.isInteger(source.recordStart) || !Number.isInteger(source.recordCount) ||
          source.recordCount < 1 || source.recordStart < 0 ||
          source.recordStart + source.recordCount > sourceCount) {
        throw new Error(`Step ${step.id} has invalid APG source range metadata`);
      }
      segments.push({ sourceStart: source.recordStart, sourceCount: source.recordCount });
      preservedStepIds.push(step.id);
    } else {
      const cleanStep = {
        ...step,
        buttons: clone(step.buttons ?? []),
        sticks: clone(step.sticks ?? []),
      };
      delete cleanStep.apgSource;
      segments.push({ step: cleanStep });
      regeneratedStepIds.push(step.id);
    }
  }

  const metadata = inferMetadata(input, sourceCount, options.metadata);
  return {
    segments,
    metadata,
    abxyLayout: options.abxyLayout,
    preservedStepIds,
    regeneratedStepIds,
    removedStepIds,
    warnings: [
      "Only unchanged imported steps with a stored baseline snapshot are copied byte-for-byte.",
      "Edited and newly added steps are regenerated; original step boundaries may already be ambiguous because equal adjacent APG states collapse during import.",
      "Counter profile is inferred from source records only when marker is constant and every counter delta matches; supply metadata explicitly otherwise.",
      "Reordering copied steps may create counter discontinuities; the rebuild result reports them.",
    ],
  };
}

export function rebuildAPGFromEditableModel(input, importedModel, editedConfig, options = {}) {
  const plan = buildAPGRebuildPlan(input, importedModel, editedConfig, options);
  const rebuilt = rebuildAPGFromSegments(input, {
    recordCount: importedModel.source.recordCount,
    segments: plan.segments,
    metadata: plan.metadata,
    abxyLayout: plan.abxyLayout,
    fillByte: options.fillByte,
  });
  return { ...rebuilt, plan };
}
