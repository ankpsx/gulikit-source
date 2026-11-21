import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const app = await readFile(new URL("./app.mjs", import.meta.url), "utf8");
const css = await readFile(new URL("./style.css", import.meta.url), "utf8");

test("editor contains every required application control", () => {
  for (const id of ["apgFile", "jsonFile", "newConfig", "fileName", "layout", "recordCount", "marker", "counterStart", "counterStep", "steps", "addAction", "addBlank", "exportJson", "exportApg", "status", "stepTemplate"]) {
    assert.ok(html.includes(`id="${id}"`), `missing HTML id: ${id}`);
    assert.ok(app.includes(`$("${id}")`) || app.includes(`"${id}"`), `app does not reference: ${id}`);
  }
});

test("step template exposes all controls queried by the editor", () => {
  for (const cls of ["step-title", "delay", "blank-note", "convert-action", "controls", "up", "down", "remove", "button-grid", "stick-grid", "source-meta"]) {
    assert.ok(html.includes(cls), `missing template class: ${cls}`);
    assert.ok(app.includes(`"${cls}"`), `app does not query template class: ${cls}`);
  }
});

test("all imported codec modules exist locally", async () => {
  for (const path of ["../codec/action-model.mjs", "../codec/apg-to-model.mjs", "../codec/apg-edit-rebuild.mjs", "../codec/apg-codec.mjs"]) {
    assert.ok(app.includes(path), `missing import: ${path}`);
    await access(new URL(path, import.meta.url));
  }
});

test("editor is local-first and responsive", () => {
  assert.ok(!html.includes("https://") && !html.includes("http://"), "editor HTML must not load remote resources");
  assert.ok(html.includes('type="module" src="./app.mjs"'));
  assert.ok(css.includes("@media(max-width:900px)"));
  assert.ok(css.includes("@media(max-width:560px)"));
});
