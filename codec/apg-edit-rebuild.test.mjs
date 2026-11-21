import test from "node:test";
import assert from "node:assert/strict";
import { encodeAPG } from "./apg-codec.mjs";
import { apgToEditableModel } from "./apg-to-model.mjs";
import { buildAPGRebuildPlan, rebuildAPGFromEditableModel } from "./apg-edit-rebuild.mjs";

const metadata = { marker: 2, counterStart: 11, counterStep: 14 };
const button = id => ({ id, label: id, type: "button" });
const step = (id, delay = 200) => ({ id, buttons: [button(id)], sticks: [], delay, isBlankDelay: false });

function fixture() {
  const encoded = encodeAPG({ macroList: [step("A"), step("B")] }, {
    metadata, abxyLayout: "PC", fileSize: 1024, fillByte: 0xff,
  });
  const imported = apgToEditableModel(encoded.data, {
    recordCount: 32, abxyLayout: "PC",
  });
  return { encoded, imported };
}

test("planner preserves an unchanged imported step and regenerates only edited step", () => {
  const { encoded, imported } = fixture();
  const edited = structuredClone(imported.config);
  edited.macroList[1].buttons = [button("X")];
  const plan = buildAPGRebuildPlan(encoded.data, imported, edited, { abxyLayout: "PC" });
  assert.deepEqual(plan.preservedStepIds, ["apg-step-1"]);
  assert.deepEqual(plan.regeneratedStepIds, ["apg-step-2"]);
  assert.equal(plan.segments[0].sourceStart, 0);
  assert.equal(plan.segments[1].step.buttons[0].id, "X");
});

test("planner marks newly inserted steps for generation and omitted steps as removed", () => {
  const { encoded, imported } = fixture();
  const edited = structuredClone(imported.config);
  edited.macroList.splice(1, 0, step("new-step", 100));
  edited.macroList.pop();
  const plan = buildAPGRebuildPlan(encoded.data, imported, edited, { abxyLayout: "PC" });
  assert.deepEqual(plan.regeneratedStepIds, ["new-step"]);
  assert.deepEqual(plan.removedStepIds, ["apg-step-2"]);
});

test("delay edit regenerates the changed source step", () => {
  const { encoded, imported } = fixture();
  const edited = structuredClone(imported.config);
  edited.macroList[0].delay = 300;
  const plan = buildAPGRebuildPlan(encoded.data, imported, edited, { abxyLayout: "PC" });
  assert.deepEqual(plan.regeneratedStepIds, ["apg-step-1"]);
  assert.deepEqual(plan.preservedStepIds, ["apg-step-2"]);
});

test("end-to-end adapter rebuild preserves untouched record bytes", () => {
  const { encoded, imported } = fixture();
  const edited = structuredClone(imported.config);
  edited.macroList[1].buttons = [button("X")];
  const result = rebuildAPGFromEditableModel(encoded.data, imported, edited, {
    abxyLayout: "PC", fillByte: 0xff,
  });
  assert.equal(result.recordCount, 32);
  assert.deepEqual(result.data.slice(0, 16 * 18), encoded.data.slice(0, 16 * 18));
  assert.equal(result.data[16 * 18 + 12], 0x08);
  assert.deepEqual(result.preservedStepIds, undefined);
  assert.deepEqual(result.plan.preservedStepIds, ["apg-step-1"]);
});

test("rejects automatic counter inference when profile is inconsistent", () => {
  const { encoded, imported } = fixture();
  const damaged = new Uint8Array(encoded.data);
  damaged[18 + 17] = 0x44;
  assert.throws(() => buildAPGRebuildPlan(damaged, imported, imported.config, {
    abxyLayout: "PC",
  }), /counter is not a constant/);
});
