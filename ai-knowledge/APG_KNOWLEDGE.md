# GuliKit APG Editor — AI 软件复现与开发规格（唯一权威知识文件）

> **本文件的目标不是只解释 APG，而是让一个没有本次对话上下文的 AI，单独阅读本文件并检查仓库后，就能复现、继续开发、测试和打包本软件。**
>
> 产品名称：GuliKit APG Editor  
> 产品形态：离线网页编辑器 + Windows x64 Electron/NSIS 安装程序  
> 核心用途：编辑 GuliKit 宏步骤，在官方 JSON 与 APG 二进制之间导入、编辑、导出  
> 当前实现基线：Git commit \`88a4c4a7f4d1dbffed8266a99d6950a63dabd1d8\`（代码基线；本知识文件后续可独立更新）

---

# A. 给接手开发的 AI：执行说明

## A1. 任务目标

当用户要求复现或继续开发时，目标是交付一个真正可运行的软件，而不是只给伪代码、设计建议或孤立算法。

软件必须做到：

1. 能在浏览器本地离线运行。
2. 能导入官方 JSON 宏文件并显示全部步骤。
3. 能创建、编辑、删除、排序宏步骤。
4. 能编辑每一步延时、按键、方向键、扳机、左右摇杆方向及力度。
5. 能导出官方 JSON。
6. 能将**任意步骤数量**的 JSON/编辑模型生成 APG；不能限制 17 步、29 步或其他固定步数。
7. 能导入 APG，推断可编辑步骤，并清楚提示反向解析的不确定性。
8. 对 APG 来源文件，未修改的来源记录应尽可能逐字节保留；修改过的步骤才重新编码。
9. 能打包成 Windows x64 NSIS 安装程序。
10. 通过 Node 单元测试、Chromium 浏览器 E2E 和 Windows 构建检查。

## A2. 接手时必须先做的事

不要只读本文件就盲目重写。按顺序：

1. 阅读本文件，理解产品需求、格式规则、限制和验收标准。
2. 检查仓库当前分支、最新 commit、文件树和工作区状态。
3. 对照本文件检查当前代码；若代码与文档不一致，先找出原因，不能假设文档或代码必然正确。
4. 优先保留已通过字节级官方样本验证的代码，不要为了“重构整洁”破坏兼容性。
5. 修改后运行本文件“测试与打包命令”中的全部适用测试。
6. 需要 Windows 安装包时运行 \`npm run dist\` 或使用 Windows CI。
7. 只有实际执行成功才能报告通过；源码阅读、Node 测试、浏览器测试、CI 构建、用户 Windows 实机、控制器硬件验证是不同证据等级。

## A3. 不可违反的项目原则

- **任意步数 JSON → APG。** 不允许通过样本签名、文件名、固定步数或 profile 来决定是否允许导出。
- **APG → JSON 是推断且有损。** 不允许承诺恢复原始 JSON 的所有方向组合、原始步骤边界或精确毫秒延时。
- **保留未知数据。** 不得无证据清除未知字段、未知 bit、APG 原始记录、尾部或 fragment。
- **不能猜记录边界。** 自动检测不唯一时要求用户提供记录数；不要擅自将整份 APG 都当作有效记录。
- **不能混淆 ABXY 布局。** JSON 没有 PC/Switch 布局字段。界面默认 Switch；低级 encoder API 的默认值与界面默认值不同，见第 D 节。
- **不能把软件文件编辑说成硬件写入。** 当前没有 USB/Bluetooth 控制器写入或宏回放功能。
- **唯一技术知识文件是本文件**：\`ai-knowledge/APG_KNOWLEDGE.md\`。新增知识应整合进相应章节，不要再创建重复的 APG 知识文档或编号式追加记录。

---

# B. 产品需求规格（必须复现的行为）

## B1. 产品定位

这是一个 local-first、offline-capable 的 GuliKit APG/JSON 宏文件编辑器。用户在自己的电脑上选择文件，所有解析、编辑、转换和下载均在本地完成；不需要登录、云端 API、CDN 或远程服务。

当前有两个运行形态：

- 浏览器版：通过本地 HTTP 静态服务器打开 \`editor/\`。
- Windows 桌面版：Electron 启动本机 loopback HTTP server，加载同一套 \`editor/\` 与 \`codec/\` 代码。

两个形态共用同一套动作模型和 APG codec，不能各自实现一套不一致的转换逻辑。

## B2. 页面结构和控件

页面文件：\`editor/index.html\`、\`editor/style.css\`、\`editor/app.mjs\`。

界面为深色响应式布局，默认且当前唯一提供的界面语言为简体中文（HTML `lang="zh-CN"`）。所有静态控件、步骤卡片、动态状态、错误提示及 APG 导入警告均须使用简体中文。主要区域：

### 1. 文件与格式设置面板

必须有：

- **导入 APG**：接受 \`.apg\`、\`.bin\`。
- **导入 JSON**：接受 \`.json\`。
- **建立新宏**：清除当前导入来源并建立空宏。
- **文件名**：用于 JSON/APG 下载文件名。
- **ABXY 配置**：PC 或 Switch；UI 初始值为 Switch。
- **APG 记录数**：留空时尝试保守自动检测；用户可手动输入 recordCount。
- 来源说明区域：显示当前导入类型、记录数、推断步骤数、警告和导出规则提示。

### 2. 宏步骤面板

必须有：

- 新增动作步骤。
- 新增空白延时。
- 清空列表。
- 每个步骤显示连续序号、步骤类型和独立延时（ms）。
- 每步可向上/向下移动，也支持拖放排序。
- 每步可删除。
- 空白延时显示专属说明，并允许“转为动作步骤”。
- 动作步骤可以同时选择多个按钮、D-pad 方向和摇杆方向。
- 左摇杆、右摇杆分别提供 UP/DOWN/LEFT/RIGHT 四个基本方向的勾选和力度输入。
- 力度输入为 0–100%，步进 1；默认新增方向的力度 100%。
- 每个新建动作步骤和空白延时默认 200 ms。
- 每步有来源信息折叠区，显示原始 APG recordStart、recordCount、可能延时范围等（如果是 APG 导入步骤）。

### 3. 导出与状态面板

必须有：

- 导出 JSON。
- 导出 APG。
- 状态区域显示成功、失败、警告、保留/重新编码/删除步骤数量、Counter 不连续、尾部保留或截断信息。
- 导出失败必须显示错误，不得静默下载错误文件。
- APG 容量不足必须明确提示，不得把截断文件说成完整成功。

## B2.1. DOM 契约与界面视觉规格

复现现有 UI 时，以下 DOM ID/class 是 \`editor/app.mjs\` 与 Playwright E2E 使用的契约。修改 ID 时必须同步修改 app 和测试。

顶层 ID：

| ID | 用途 |
|---|---|
| \`apgFile\` | APG 文件 input |
| \`jsonFile\` | JSON 文件 input |
| \`newConfig\` | 建立新宏 |
| \`fileName\` | 文件名 input |
| \`layout\` | PC/SWITCH select |
| \`recordCount\` | APG 有效记录数输入 |
| \`sourceInfo\` | 当前文件来源和解析警告 |
| \`addAction\` | 新增动作步骤 |
| \`addBlank\` | 新增空白延时 |
| \`clearSteps\` | 清空步骤 |
| \`steps\` | 步骤卡片容器 |
| \`exportJson\` | 导出 JSON |
| \`exportApg\` | 导出 APG |
| \`status\` | 成功/失败/警告状态 |
| \`stepTemplate\` | 单步卡片 HTML template |

每个 step template 的关键 class：

- \`.step\`：步骤卡片。
- \`.step-title\`：显示序号和类型。
- \`.delay\`：当前步骤 delay 输入。
- \`.blank-note\`：空白延时提示。
- \`.convert-action\`：空白步骤转普通动作。
- \`.controls\`：动作编辑区。
- \`.button-grid\`：按键/D-pad/trigger 选择区。
- \`.stick-grid\`：左右摇杆选择区。
- \`.up\`、\`.down\`、\`.remove\`：移动/删除。
- \`.source-meta\`：APG provenance 详情。

视觉基线（来自当前 CSS）：

- 页面背景 \`#0b1220\`；面板 \`#131e30\`；次级面板 \`#1a2940\`。
- 边线 \`#2b3b53\`；主文字 \`#e8eef8\`；次文字 \`#9eacc1\`；强调色 \`#4de0c1\`。
- 系统 sans-serif 字体，基础字号 15px，行高 1.5。
- 主内容最大宽度 1480px，深色卡片式面板、圆角边框。
- 桌面端 settings 六列；宽度不超过 900px 时三列、不超过 560px 时两列。
- 不超过 900px 时左右摇杆编辑区改为单列；不超过 560px 时 stick cards 改为单列。
- 页面使用简体中文 UI 文案；`editor/index.html` 必须设置 `lang="zh-CN"`。新增界面文案、动态提示和错误消息必须使用简体中文。按键 ID、协议字段名、PC/SWITCH、APG、JSON、Marker、Counter 等技术标识保持原样，不翻译。

## B3. 按键与方向列表

编辑器当前支持的按钮 ID：

\`A, B, X, Y, LB, RB, LT, RT, L3, R3, START, SELECT, HOME\`

D-pad：

\`D_UP, D_DOWN, D_LEFT, D_RIGHT, D_UP_LEFT, D_UP_RIGHT, D_DOWN_LEFT, D_DOWN_RIGHT\`

摇杆：

- \`L_STICK\`
- \`R_STICK\`

每个摇杆支持基本方向：

\`UP, DOWN, LEFT, RIGHT\`

注意：当前已审计官方 serializer 对摇杆只处理上述四个基本方向。斜向 stick 不能假设会被自动拆成两个轴；UI 不得把未经验证的斜向编码能力描述为已支持。

## B4. 用户交互规则

- 导入 JSON 后显示 JSON 的全部 macroList 步骤；不得自动合并或改变原始步骤。
- 导入 JSON 不得静默改写原始 delay、descriptor label、position、未知字段或其他 JSON 属性。
- 导入 APG 后显示的是推断出来的 run/步骤，不是原始 JSON 步骤；必须提示可能的延时范围和信息损失。
- 新建宏、导入 JSON 后，ABXY UI 选择 Switch。
- 新增步骤 delay 默认 200 ms。
- 编辑某一步 delay 不得改变其他步骤 delay。
- 清空列表后可以继续添加步骤。
- 空白延时步骤不得包含 buttons 或 sticks。
- 导出 JSON 时必须移除内部 \`apgSource\` provenance 元数据，避免把项目内部结构泄漏到官方 JSON。
- 导出 JSON 时保留官方 JSON 及步骤/descriptor 中未知但合法的属性。
- 导入 APG 时必须要求 PC 或 Switch 解释；不能从 APG bitmask 自动断言唯一 ABXY 语义。
- 用户未修改的 APG 来源 run，应原样复制来源记录；被修改或新增的步骤重新编码。
- 重排来源 run 时可能产生 Counter 不连续，必须报告；不得悄悄改写已复制的来源记录。

---

# C. 官方 JSON 数据模型

## C1. 顶层结构

已审计官方样本主要结构：

\`\`\`json
{
  "fileName": "macro",
  "version": "1.0",
  "macroList": [
    {
      "id": "step-id",
      "buttons": [],
      "sticks": [],
      "delay": 200,
      "isBlankDelay": false
    }
  ]
}
\`\`\`

- \`fileName\`：非空字符串。
- \`version\`：字符串；当前导出版本为 \`"1.0"\`。
- \`macroList\`：有序数组，长度不设固定上限（受 APG 1 MiB 容量限制的是二进制输出，不是 JSON 步数）。
- 普通步骤：\`id\`、\`buttons[]\`、\`sticks[]\`、\`delay\`、\`isBlankDelay:false\`。
- 空白延时：buttons/sticks 必须为空，\`isBlankDelay:true\`。
- \`delay\` 单位毫秒，必须是有限非负数。
- 一个步骤可包含多个 buttons 和多个 sticks。

## C2. Button descriptor

最小有效形状：

\`\`\`json
{ "id": "A", "label": "A", "type": "button" }
\`\`\`

D-pad descriptor 还可有：

\`\`\`json
{ "id": "D_UP", "label": "↑", "type": "button", "position": { "row": 0, "col": 2 } }
\`\`\`

LT/RT 的 type 为 \`trigger\`。导入时应保留官方 descriptor 的 label、type、position 及未知字段；不能只保留 id 后丢弃其他属性。

## C3. Stick descriptor

\`\`\`json
{
  "stick": { "id": "L_STICK", "label": "Left Stick", "type": "stick" },
  "direction": "RIGHT",
  "value": 100
}
\`\`\`

- \`stick.id\`：\`L_STICK\` 或 \`R_STICK\`。
- \`direction\`：当前已支持的四个基本方向之一。
- \`value\`：0–100 的力度百分比。缺省值在低级编码中按 0 处理；UI 新增方向时默认 100。
- 官方 JSON 中 value 是 UI 力度，不是 APG 的 16-bit 轴值。

## C4. Action model API

实现文件：\`codec/action-model.mjs\`。

必须提供并维持以下导出 API：

- \`MACRO_JSON_VERSION = "1.0"\`
- \`DEFAULT_DELAY_MS = 200\`
- \`normalizeMacroConfig(input)\`
  - 验证顶层对象、fileName、macroList、version。
  - 验证每个 step 的 id、buttons、sticks、delay、isBlankDelay。
  - 空白延时不允许包含按键/摇杆。
  - 深拷贝 JSON 数据。
  - 保留 config、step、button、stick descriptor 上所有未知属性。
  - 不得为导入步骤静默补写或重置 delay。
- \`createActionStep({id, buttons=[], sticks=[], delay=200})\`
- \`createBlankDelayStep({id, delay=200})\`
- \`updateStepDelay(configInput, stepId, delay)\`
- \`exportMacroJson(configInput)\`
  - 规范化并输出 pretty JSON。
  - version 固定输出为 \`"1.0"\`。

---

# D. APG 二进制格式与编码算法（JSON → APG）

## D1. 容器规则

已审计官方网页 serializer：

- 固定文件长度：1,048,576 bytes（1 MiB）。
- 每条记录：18 bytes。
- 有效记录之后填充 \`0xFF\` 至 1 MiB。
- 每一步生成记录数：

\`\`\`js
recordCountForStep = Math.ceil(delayMs * 79 / 1000);
\`\`\`

例如 200 ms → 16 条记录。79 是官方网页 serializer 代码中的公式系数；不得将其未经证据解释成硬件物理采样率。

- 所有步骤依 macroList 原顺序写入。
- 同一步骤状态在该步记录数范围内重复。
- 延时为 0 ms 时生成 0 条记录。
- 导出超过容器容量时，encoder 返回 truncated 标记并由 UI 警告；不得静默忽略。

## D2. 每条 18-byte 记录

| Offset | Bytes | 内容 |
|---:|---:|---|
| 0 | 0–1 | Left stick X，16-bit big-endian |
| 2 | 2–3 | Left stick Y，16-bit big-endian |
| 4 | 4–5 | Right stick X，16-bit big-endian |
| 6 | 6–7 | Right stick Y，16-bit big-endian |
| 8 | 8–9 | LT，16-bit big-endian |
| 10 | 10–11 | RT，16-bit big-endian |
| 12 | 12 | 第一组按键 mask |
| 13 | 13 | 第二组按键 mask |
| 14 | 14 | D-pad 方向码 |
| 15 | 15 | Marker |
| 16 | 16–17 | Counter，16-bit big-endian |

APG 轴中性值为 2048；空白延时状态：

- 四个摇杆轴均为 2048。
- LT/RT 均为 0。
- 两组按键 mask 均为 0。
- D-pad=0。

## D3. Marker、Counter、填充

已审计官方网页 serializer 的默认值：

- Marker：\`0x02\`。
- Counter 起点：11。
- Counter 步进：14。
- Counter：16-bit big-endian，按 \`(counter + 14) & 0xffff\` 回绕。
- 尾部填充：\`0xFF\`。

**重要 API 差异：**

- UI 在导出时显式将当前布局传给 encoder。
- UI 新建宏和导入 JSON 后的布局默认是 \`SWITCH\`。
- \`encodeAPG(config, options)\` 低级 API 的默认 \`abxyLayout\` 是 \`"PC"\`。
- 因此不能把“UI 默认 Switch”写成“底层 encoder 默认 Switch”。测试直接调用 encoder 时必须显式指定布局，除非该测试就是在验证 API 默认值。

\`encodeAPG\` 当前选项：

- \`abxyLayout: "PC" | "SWITCH"\`，低级 API 默认 PC。
- \`metadata\` 可选覆盖 marker/counterStart/counterStep；只用于有证据的其他变体。
- \`fillByte\` 默认 0xFF。
- \`fileSize\` 默认 1 MiB，仅可用于测试/特殊调用，最大 1 MiB。

返回对象至少包括：

- \`data\`：输出 Uint8Array。
- \`recordCount\`：实际写入记录数。
- \`requestedRecordCount\`：理论需要记录数。
- \`truncated\`：是否超出容量。
- \`warnings\`：编码警告。

## D4. 摇杆百分比编码

\`\`\`js
magnitude = Math.round(value * 2047 / 100);
center = 2048;
\`\`\`

- RIGHT / UP：\`center + magnitude\`。
- LEFT / DOWN：\`center - magnitude\`。
- 100% 对应 4095 或 1。
- 0% 对应中性值 2048。
- 量化会造成反算值与原始小数略有差异。
- 同轴方向冲突时，serializer 按 sticks 数组顺序赋值，后一个方向覆盖前一个方向。
- 当前官方 serializer switch 只处理 UP/DOWN/LEFT/RIGHT；斜向条目不产生斜向轴编码。保留这一行为，除非有新的官方源码或配对 APG 样本证明官方实现已改变。

## D5. 按键 mask

Byte 12（ABXY 受布局影响）：

| Button | PC | SWITCH |
|---|---:|---:|
| A | 0x02 | 0x01 |
| B | 0x01 | 0x02 |
| X | 0x08 | 0x04 |
| Y | 0x04 | 0x08 |
| LB | 0x10 | 0x10 |
| RB | 0x20 | 0x20 |
| LT | 0x40 | 0x40 |
| RT | 0x80 | 0x80 |

Byte 13：

| Button | Mask |
|---|---:|
| R3 | 0x01 |
| L3 | 0x02 |
| START | 0x04 |
| SELECT | 0x08 |
| HOME | 0x10 |

未知 bit 必须保留为 opaque data，不可自行赋予含义。

## D6. D-pad 方向码

Byte 14：

| ID | 方向 | 值 |
|---|---|---:|
| neutral | 无方向 | 0 |
| D_UP | ↑ | 1 |
| D_UP_RIGHT | ↗ | 2 |
| D_RIGHT | → | 3 |
| D_DOWN_RIGHT | ↘ | 4 |
| D_DOWN | ↓ | 5 |
| D_DOWN_LEFT | ↙ | 6 |
| D_LEFT | ← | 7 |
| D_UP_LEFT | ↖ | 8 |

APG 每条记录只能存一个 D-pad 方向码。同一时间多个 D-pad 方向无法完整表达；serializer 的后续方向可能覆盖先前方向。

---

# E. APG 解析、编辑模型和重建

## E1. 低级解析 API

文件：\`codec/apg-codec.mjs\`。

主要 API：

- \`decodeAPGRecords(input, options)\`
  - 必须提供 \`recordCount\`，或显式启用 \`autoDetectRecordCount:true\`。
  - 必须提供 \`abxyLayout:"PC" | "SWITCH"\` 才能明确解释 ABXY。
  - 返回逐条记录解析结果、每条 18-byte raw、尾部 tail、trailingFragment、warnings。
  - fidelity 是 record-level，不代表已恢复原始宏步骤。
- \`decodeAPGSteps(input, options)\`
  - 将相邻状态相同的 records 合并成推断 run。
  - 状态比较不包含 marker/counter（比较前 15 bytes）。
  - 返回每个 run 的 recordStart/end/count 和 delayMsRange。
  - 结果是 inferred runs，不是原始 JSON step 的精确还原。

## E2. 记录范围自动检测

文件：\`codec/apg-range-detect.mjs\`。

自动检测只是一种保守启发式：

1. 文件末尾必须存在连续同值填充尾部（当前识别 0xFF 或 0x67）。
2. 尾部起点必须落在 18-byte 记录边界。
3. 尾部前至少有 3 条完整记录。
4. 前缀 Marker 必须一致。
5. Counter 必须按固定的 16-bit 模数步进。
6. 必须只有一个候选解释。

若不满足，返回 ambiguous，并要求用户手动输入 recordCount。不能仅凭“看起来像 0xFF”就认定记录结束，因为合法数据也可能碰巧出现相同字节模式。

注意：官方 serializer 已确认的填充是 0xFF；0x67 是 detector 的兼容性启发式候选，不代表已证明它是官方 serializer 的另一种正式填充规则。

## E3. APG → 可编辑模型

文件：\`codec/apg-to-model.mjs\`。

API：

\`apgToEditableModel(input, { recordCount, abxyLayout, fileName, preferredDelayMs, autoDetectRecordCount })\`

- \`abxyLayout\` 必须明确为 PC 或 SWITCH。
- 提供 recordCount 或选择自动检测。
- 每个推断步骤附带 \`apgSource\`：
  - recordStart / recordEnd / recordCount
  - possibleDelayMs
  - rawRecordsHex
  - markerValues
  - counterStart / counterEnd
  - baseline（用于判断用户是否修改了该步骤）
- 返回 source 中保留 recordCount、recordRangeDetection、tailHex、trailingFragmentHex。
- 返回 warnings，明确说明方向、步骤边界和 delay 的有损限制。

延时选择策略：

- 若用户传 preferredDelayMs，使用该值（调用者仍需确保业务合理）。
- 否则若范围唯一，使用唯一值。
- 否则若 200 ms 在可行范围内，优先选择 200 ms。
- 否则选择可行范围最小值。
- 仍需在 UI 显示 possibleDelayMs，不能把推断值伪装成原始精确值。

## E4. APG 来源数据的编辑重建

文件：\`codec/apg-edit-rebuild.mjs\`、\`codec/apg-rebuild.mjs\`。

核心行为：

- 导入时为每个推断步骤保存 baseline。
- 导出时比较当前按钮、摇杆、delay、blank 标记与 baseline。
- 未改变且 provenance 有效的步骤：复制原始 APG 记录区段，逐字节保留。
- 修改过或新增步骤：使用当前动作模型重新编码。
- 删除步骤：不输出该来源区段。
- 按编辑器顺序输出 segments。
- 原始 suffix/tail 移动到新记录区之后；新记录区域变大时，suffix 可能因固定文件长度不足而被截断，必须报告。
- 来源记录被复制时保留原始 Counter；新生成记录按 metadata 继续计数。
- 如果重排来源区段导致 Counter 不连续，返回 counterDiscontinuities 并显示警告，不得偷偷修改已复制记录。
- 来源记录区段不能重叠；越界、容量溢出必须报错。

固定记录 patcher：\`codec/apg-record-patcher.mjs\`。它适用于记录数不变的指定记录状态修补；不支持插入/删除记录或改变步骤延时。

---

# F. 项目文件结构与模块职责

| 路径 | 职责 | 复现时要求 |
|---|---|---|
| \`editor/index.html\` | 页面结构、输入控件和 step template | 保持 UI 控件与 app.mjs 选择器一致 |
| \`editor/style.css\` | 深色响应式界面 | 不依赖 CDN 字体/框架 |
| \`editor/app.mjs\` | 文件导入、状态、渲染、编辑事件、下载 | 不重复实现 codec |
| \`editor/browser-e2e.test.mjs\` | Playwright 真浏览器端到端测试 | 覆盖用户可见流程 |
| \`editor/editor-smoke.test.mjs\` | 编辑器静态/本地资源 smoke tests | 与 E2E 配套 |
| \`codec/action-model.mjs\` | JSON 动作模型与校验 | 保留未知字段 |
| \`codec/apg-codec.mjs\` | APG encoder/decoder | 唯一底层格式实现 |
| \`codec/apg-to-model.mjs\` | APG runs 转编辑模型 | 必须报告有损推断 |
| \`codec/apg-range-detect.mjs\` | 有效记录范围启发式检测 | ambiguous 时不猜测 |
| \`codec/apg-edit-rebuild.mjs\` | 编辑前后 provenance 比较和重建计划 | 未修改步骤原样保留 |
| \`codec/apg-rebuild.mjs\` | segments 重建与 suffix relocation | 检查容量与 Counter discontinuity |
| \`codec/apg-record-patcher.mjs\` | 固定记录布局 patch | 不得误用来做延时/步骤数量变化 |
| \`codec/apg-metadata-profiles.mjs\` | 历史样本 profile 审计 | 不可作为任意 JSON 导出 gate |
| \`verification/apg-sample-validator/\` | 官方 JSON/APG 样本与验证脚本 | 回归测试的权威样本 |
| \`desktop/main.cjs\` | Electron 主进程和本地静态服务器 | 安全边界见第 G 节 |
| \`package.json\` | Electron、electron-builder、打包配置 | 保持安装包输出配置一致 |
| \`.github/workflows/test-apg-codec.yml\` | Node + Chromium 测试 CI | 修改 codec/editor 时必须通过 |
| \`.github/workflows/build-windows.yml\` | Windows x64 安装包 CI | 发布安装包前必须通过 |

---

# G. Windows 桌面封装与安全要求

## G1. 构建配置

当前 \`package.json\`：

- main：\`desktop/main.cjs\`
- Electron：44.4.5
- electron-builder：26.15.3
- appId：\`org.gulikit.apg-editor\`
- productName：\`GuliKit APG Editor\`
- asar：true
- NSIS：x64
- 输出目录：\`release/\`
- Artifact 文件名模板：\`GuliKit-APG-Editor-\${version}-Windows-\${arch}.\${ext}\`
- 当前 package version：\`0.1.0\`

## G2. Electron 主进程要求

\`desktop/main.cjs\`：

- 本地 HTTP server 只监听 \`127.0.0.1\`，使用系统分配的随机端口。
- 页面从本地 server 加载，不依赖 file:// 下的 ES module 行为。
- 必须防止路径穿越：解析后的文件路径必须位于 APP_ROOT 内。
- 必须设置 MIME type 和 Content-Security-Policy。
- \`nodeIntegration:false\`
- \`contextIsolation:true\`
- \`sandbox:true\`
- \`webSecurity:true\`
- 禁止外部 popup 与非本地导航。
- 单实例锁。
- 退出时关闭本地 HTTP server。
- 不要把本地服务器监听地址改成 0.0.0.0 或局域网地址。

当前桌面版只是离线文件编辑器，不实现 USB/Bluetooth 写控制器。

---

# H. 官方样本与必须通过的验收

## H1. 配对样本

### Official.17steps

- \`verification/apg-sample-validator/Official.17steps.json\`
- \`verification/apg-sample-validator/Official.17steps.apg\`
- 17 步。
- 有效记录 777 条。
- 尾部 1,034,590 bytes 为 0xFF。
- APG SHA-256：\`4e00caeb6de9ce6cdb30dd667de6af09a27ff619ec888316d3b3f6dc19049373\`。
- 通用 encoder 输出必须与配对 APG 逐字节一致。

### Official.29steps

- \`verification/apg-sample-validator/Official.29steps.json\`
- \`verification/apg-sample-validator/Official.29steps.apg\`
- 29 步，每步 200 ms。
- 每步 16 条记录，总计 464 条（8,352 bytes）。
- 尾部 1,040,224 bytes 为 0xFF。
- APG SHA-256：\`c51b5b280ac4ba442b8cd8327c4b2068ed13efbb08a80293c3dc97ae194b5c07\`。
- Marker 全部为 0x02。
- Counter 从 11 开始，每条 +14，最后一条 6493。
- ABXY 位掩码与 Switch 布局一致。
- 通用 encoder 输出必须与配对 APG 逐字节一致。

## H2. 任意步数测试

至少有一个不在官方配对样本中的任意长度 JSON 测试。现有 Chromium E2E 使用 37 步配置：

- 每步独立 delay（200/213/226ms 循环）。
- 所有步骤都必须显示。
- 输出长度 1 MiB。
- Marker、Counter 起点/步进、0xFF 尾部正确。
- 不依赖 profile。
- 不得把 37 写成新的固定步数门槛。

## H3. UI 行为测试

必须覆盖：

- JSON 导入并保留未知字段。
- 修改一个步骤 delay，不影响其他步骤。
- 同一步添加按键。
- 新建宏、默认 200 ms。
- 新增动作步骤和空白延时。
- 空白延时转为动作步骤。
- 删除步骤、上下移动、拖放排序。
- 清空步骤列表。
- 导出 JSON，确认内部 apgSource 不泄漏。
- 导出 APG 并检查 1 MiB、Marker、Counter、按键 mask、填充。
- APG 未修改导入再导出，原始 bytes 完全一致。
- 修改某个 APG run 后，未修改 run 的记录仍 byte-identical。
- 增长记录区域后 suffix relocation 正确；固定文件容量不足必须明确处理。
- 页面没有 JavaScript runtime error。

## H4. APG 反向导入测试

必须覆盖：

- 同一状态的相邻记录合并为 run。
- 两个相邻相同状态的源步骤无法恢复原始边界。
- delayMsRange 按官方 ceil 公式正确计算。
- 多个 D-pad 方向无法在单个 APG 记录中同时保存。
- 同一摇杆轴相反方向无法同时保存。
- decoder warnings 清楚表达上述损失。
- ABXY layout 必须明确选择。
- 自动范围检测不明确时拒绝猜测。
- 未知 marker / D-pad 值产生 warning，并保留 raw bytes。
- trailing fragment 和 tail 保留。

---

# I. 已知有损边界（不可错误承诺）

APG 不是官方 JSON 的无损容器。

1. 一个 APG 记录只有一个 D-pad 方向码；JSON 中同一时刻多个 D-pad 方向会丢失。
2. 每个摇杆轴只有一个有符号数值；同一轴上相反方向无法同时保存。
3. APG 不保存原始 JSON step ID 或边界；相邻相同状态会合并成一个 run。
4. APG 只保存记录数量，不保存原始毫秒 delay；只能反推可行范围。
5. APG 的轴量化意味着反算百分比不一定等于原始 UI 小数。
6. JSON 不携带 ABXY PC/Switch 布局，必须由用户选择/使用 UI 默认值。
7. 当前 serializer 只编码摇杆四个基本方向；不要假设斜向支持。
8. APG 记录边界自动检测是启发式，不是通用文件终止符规范。
9. 重新排序来源记录可能破坏 Counter 连续性；当前程序报告 discontinuity，不会悄悄改写来源 records。
10. 重新编码导致有效记录区域变大时，固定长度文件尾部可能被截断。

## I1. 延时反推公式

若一个 run 有 n 条记录，正整数毫秒 delay 的可行范围为：

\`\`\`
min = floor(((n - 1) * 1000) / 79) + 1
max = floor((n * 1000) / 79)
\`\`\`

例如：

- 16 条记录 → 190–202 ms，不能断言原值为 200 ms。
- 32 条记录 → 393–405 ms。
- 158 条记录 → 1988–2000 ms。
- 237 条记录 → 2988–3000 ms。

decoder 默认优先选择范围内的 200 ms；若 200 不在范围内，选择最小值。UI 必须显示可行范围。

## I2. 17 步反向导入案例

- 官方输入 JSON：17 步。
- \`NoOfficial.17steps-02.json\`：用户上传的配对 APG 经本程序反向导入后得到的 JSON，只有 16 步。
- 这是 APG 信息表达能力造成的有损反向转换，不是通用 JSON→APG 导出器按 16 步生成。
- 同一轴多方向和多个 D-pad 方向不能完整保存。
- 两个相邻不同 JSON 步骤最终状态相同，编码后连续 32 条记录；decoder 合并为一个 run，delay 推断为 393 ms。
- 2000/3000ms 的记录数量反推下界分别是 1988/2988ms。
- 若 APG 未编辑，程序仍应使用 provenance 原样保留记录，不可将反向 JSON 的差异误认为原始 APG 已被改写。

---

# J. 开发环境、运行、测试与打包（可直接执行）

## J1. 环境

- Node.js：22（CI 使用 Node 22）。
- Windows 构建：Windows x64 runner 或 Windows x64 开发机。
- 浏览器测试：Playwright + Chromium。
- 不需要外部 API key、账号、数据库或 CDN。

## J2. 浏览器版运行

仓库根目录：

\`\`\`bash
python -m http.server 8000
\`\`\`

浏览器打开：

\`\`\`
http://localhost:8000/editor/
\`\`\`

必须保留仓库中的 \`codec/\` 与 \`editor/\` 目录相邻。

## J3. 安装与桌面开发

\`\`\`bash
npm install
npm start
\`\`\`

## J4. 完整自动化测试

Playwright 不是 package.json 的固定依赖；CI 通过临时安装方式安装，避免改变正式桌面依赖：

\`\`\`bash
npm install --no-save --no-package-lock playwright
npx playwright install chromium
node --check editor/app.mjs
node --check desktop/main.cjs
node --test editor/browser-e2e.test.mjs
node --test codec/*.test.mjs editor/editor-smoke.test.mjs
\`\`\`

CI workflow：\`.github/workflows/test-apg-codec.yml\`。
CI 会安装 Chromium OS dependencies，并分别运行浏览器 E2E 与 Node tests。

注意：当前 package.json 没有定义 \`npm test\` script。不要告诉用户 \`npm test\` 是项目正式测试命令，除非未来明确添加并验证。

## J5. Windows 安装包构建

\`\`\`bash
npm install
npm run dist
\`\`\`

输出目录：\`release/\`。目标：Windows x64 NSIS installer。当前版本 0.1.0，预期文件名：

\`GuliKit-APG-Editor-0.1.0-Windows-x64.exe\`

CI workflow：\`.github/workflows/build-windows.yml\`。
CI Artifact 名称：\`GuliKit-APG-Editor-Windows-x64\`，保留 14 天。

---

# K. 当前实现状态与证据分级

## K1. 已实现且有自动化测试覆盖

- 离线网页 UI。
- JSON/APG 文件导入。
- 新建宏、动作步骤、空白延时。
- 步骤编辑、排序、删除、清空。
- 每步 delay 编辑。
- 按键、D-pad、trigger 和四方向摇杆力度编辑。
- JSON 导出。
- 任意步数 JSON → APG。
- APG 记录解析和推断步骤。
- APG 来源数据 provenance。
- 未修改 run 原始记录保留。
- 修改/新增 run 重新编码。
- 容量溢出和 Counter discontinuity 警告。
- Electron Windows x64 NSIS 构建。

## K2. 最新已核实自动化证据（复现规格文档与 README 更新后的代码树）

- APG codec workflow Run [44942886884](https://github.com/ankpsx/gulikit-source/actions/runs/44942886884)：成功，Node tests **61/61 通过**，Chromium E2E **7/7 通过**，0 failed；同时 `node --check editor/app.mjs` 与 `node --check desktop/main.cjs` 成功。
- Windows installer Run [44942886837](https://github.com/ankpsx/gulikit-source/actions/runs/44942886837)：成功；`npm run dist` 与 artifact 上传成功。
- 两个 workflow 对应代码树 commit：`8774a5d7e0fe6f84627cc528105204310047aca0`。随后仅更新了审计状态说明文件；没有修改应用源代码。
- Artifact：`GuliKit-APG-Editor-Windows-x64`，ID `14722920216`，ZIP 111,388,357 bytes，SHA-256 `7c66fb0294721a4c91afd08a51b24afe0beb0b9c17c4d88240c2cfa131ca747f`，过期时间 2026-12-05 19:49:55 UTC。
- CI 成功只证明自动化测试与 Windows runner 构建成功；不证明用户 Windows 电脑已安装启动，也不证明控制器硬件回放成功。

## K3. 用户实际反馈（人工验收）

- 用户确认官方 29 步 JSON 导入 GuliKit 官方网页后，摇杆力度和 D-pad 八方向箭头显示正确。
- 用户确认 Official.17steps.json 现在可以由本程序正确生成对应 APG。
- 这些是用户操作反馈；不能推导为控制器硬件回放成功。

## K4. 尚未完成

- 最新 Windows 安装包在用户实际 Windows 电脑安装、启动和完整操作验收。
- 控制器 USB/Bluetooth 写入与宏回放（当前不支持）。
- 摇杆斜向的官方源码/配对 APG 样本验证。
- 更多真实设备 APG 变体、未知 marker、未知字段、异常尾部和截断文件的测试。
- 官方网页对更多步数/动作组合/边界 delay 的人工回归。

---

# L. 修改、发布与知识维护规程

每次开发必须：

1. 先确定用户实际要求，不擅自删除既有功能。
2. 检查相关模块和现有测试，优先做最小范围修改。
3. 对每个 bug 新增可复现回归测试。
4. JSON→APG 变更必须跑 17 步、29 步逐字节配对测试和任意步数测试。
5. APG→JSON 变更必须验证 warning、provenance、raw record、tail、fragment。
6. UI 变更必须跑 Chromium E2E。
7. 桌面代码变更必须跑 Windows 构建。
8. 更新本文件中对应章节和证据状态，不另起重复知识文档。
9. 不保留已经被证据推翻的旧说法；直接修订或删除。
10. 最终报告列出实际修改文件、commit、测试结果、未完成验收；没有跑过的测试明确写“未验证”。

**后续 AI 的最终交付标准：用户拿到可运行的网页/Windows 安装包，能导入、编辑、导出，并且所有声称支持的行为都有可重复测试证明。**
