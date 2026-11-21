import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const app = await readFile(new URL("./app.mjs", import.meta.url), "utf8");
const css = await readFile(new URL("./style.css", import.meta.url), "utf8");

test("editor contains every required application control", () => {
  for (const id of ["apgFile", "jsonFile", "newConfig", "fileName", "layout", "recordCount", "steps", "addAction", "addBlank", "clearSteps", "exportJson", "exportApg", "status", "stepTemplate"]) {
    assert.ok(html.includes(`id="${id}"`), `missing HTML id: ${id}`);
    assert.ok(app.includes(`$("${id}")`) || app.includes(`"${id}"`), `app does not reference: ${id}`);
  }
  assert.ok(!html.includes('id="marker"') && !html.includes('id="counterStart"') && !html.includes('id="counterStep"'), "metadata must be automatic, not user-entered");
  assert.ok(!app.includes("apg-metadata-profiles.mjs"), "JSON export must not depend on sample profiles");
});

test("step template exposes all controls queried by the editor", () => {
  for (const cls of ["step-title", "delay", "blank-note", "convert-action", "controls", "up", "down", "remove", "button-grid", "stick-grid", "source-meta"]) {
    assert.ok(html.includes(cls), `missing template class: ${cls}`);
    assert.ok(app.includes(`".${cls}"`), `app does not query template class: ${cls}`);
  }
});

test("all imported codec modules exist locally", async () => {
  for (const path of ["../codec/action-model.mjs", "../codec/apg-to-model.mjs", "../codec/apg-edit-rebuild.mjs", "../codec/apg-codec.mjs"]) {
    assert.ok(app.includes(path), `missing import: ${path}`);
    await access(new URL(path, import.meta.url));
  }
});

test("editor is Simplified Chinese, local-first and responsive", () => {
  assert.match(html, /<html lang="zh-CN">/);
  for (const text of ["GuliKit APG 编辑器", "文件与格式设置", "导入 APG", "导入 JSON", "宏步骤", "添加动作步骤", "导出 JSON", "导出 APG"]) assert.ok(html.includes(text), `missing Simplified Chinese UI text: ${text}`);
  assert.ok(!/[匯輸檔設為動驅]/.test(html), "visible interface should not contain common Traditional Chinese characters");
  assert.ok(!html.includes("https://") && !html.includes("http://"), "editor HTML must not load remote resources");
  assert.ok(html.includes('type="module" src="./app.mjs"'));
  assert.ok(css.includes("@media(max-width:900px)"));
  assert.ok(css.includes("@media(max-width:560px)"));
  assert.ok(css.includes("grid-template-columns:minmax(0,1fr)"), "steps must stay in one vertical column");
  assert.ok(css.includes("grid-template-areas:"), "button choices must use a controller-like physical layout");
  assert.ok(html.includes("手柄按键布局") && html.includes("手柄按键选择"), "controller diagram must be clearly labeled");
  assert.ok(app.includes("l.classList.toggle(\"selected\",c.checked)"), "selected controller buttons must be visibly highlighted");
});
