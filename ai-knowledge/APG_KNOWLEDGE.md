# GuliKit APG Editor — 技术知识库（唯一有效版本）

> 用途：让后续开发会话直接依据已验证事实继续工作。本文只保留当前有效规则、证据边界、已知限制和下一步验收事项。旧的编号式追加记录、重复结论、过期 CI 编号和已被推翻的说法已从正文清理；历史变更以 Git commit 为准。

## 0. 先读这里：不可违反的项目规则

1. **JSON → APG 必须通用。** 官方 JSON 有多少步骤就按其步骤顺序、动作状态和每步 delay 生成 APG；不得要求恰好 17/29 步，不得用样本 profile 作为导出门槛。
2. **不要把 APG → JSON 说成无损。** APG 无法完整表达 JSON 的所有同时方向、原始步骤边界和精确毫秒延时。反向导入必须提示有损和推断性质。
3. **保留原始数据。** 对未修改的 APG 来源记录应尽量逐字节保留；未知字段、尾部和不能确认的片段不得擅自清除。无法可靠识别记录范围时要警告，不要猜测。
4. **区分布局。** 官方 JSON 不包含 ABXY 的 PC/Switch 布局设置。当前编辑器默认 Switch（与已配对官方样本相符），但必须保留 PC/Switch 切换；不得声称能从 JSON 自动识别。
5. **证据分级。** 源码分析、配对样本字节比较、Node 测试、浏览器 E2E、官方网页人工验收、Windows 用户电脑验收、控制器硬件回放是不同层级，不得互相替代。
6. 当前程序**不支持通过 USB 或 Bluetooth 将宏写入控制器**，不得暗示已支持。

## 1. 项目范围与文件职责

项目是 Windows 本地离线 GuliKit APG 编辑器，包含网页编辑器与 Electron 桌面封装，支持 JSON/APG 导入、步骤编辑、JSON/APG 导出，以及 APG 来源数据保留和编辑重建。

| 文件 | 职责 |
|---|---|
| `codec/action-model.mjs` | 统一动作模型、JSON normalize/export、步骤与延时处理 |
| `codec/apg-codec.mjs` | APG 低级 encoder/decoder，18-byte 记录与字段编解码 |
| `codec/apg-to-model.mjs` | APG 记录 run 转为可编辑模型；恢复方向/力度并给出有损警告 |
| `codec/apg-range-detect.mjs` | 候选有效记录范围的启发式检测 |
| `codec/apg-rebuild.mjs` | 来源记录区段与生成记录的组合重建 |
| `codec/apg-edit-rebuild.mjs` | 根据 APG provenance/baseline 规划编辑重建 |
| `codec/apg-record-patcher.mjs` | 固定记录布局下修补指定记录，不改变记录数 |
| `codec/apg-metadata-profiles.mjs` | 历史样本签名审计工具；**不是**通用 JSON→APG 导出的条件或门槛 |
| `editor/` | 离线网页编辑器、浏览器 E2E 与 smoke tests |
| `desktop/` | Electron 桌面封装 |
| `verification/apg-sample-validator/` | 官方 JSON/APG 配对样本及审计脚本 |

## 2. 官方 JSON 模型

以下是已审计官方网页版本和配对样本所见结构；遇到新版本字段应保留未知字段并重新核对，不要把此处描述当成所有未来版本的封闭 schema。

- 顶层主要字段：`fileName`、`macroList`、`version`；配对样本中的 version 为字符串 `"1.0"`。
- `macroList` 是有序步骤数组。一个步骤可同时包含多个 buttons 和多个 sticks；不能假定一个按键等于一个步骤。
- 普通步骤包含 `id`、`buttons`、`sticks`、`delay`、`isBlankDelay:false`。
- 空白延时是独立步骤：buttons/sticks 为空，包含 delay 与 `isBlankDelay:true`。
- 按键描述符包含 `id`、`label`、`type`、`position:{row,col}`。
- 摇杆描述符包含 stick 描述、direction 和 value；编辑器中的 value 按 0–100% 力度处理。
- 官方网页 JSON 导入是文本读取后 JSON.parse；官方网页 APG 导出则从内存中的 macroList 直接序列化，不是先下载 JSON 再转码。
- 官方网页普通步骤默认 delay 在已审计版本中为 200 ms；这是网页默认值，不代表每一步必须是 200 ms。

## 3. 官方 APG 编码规则（JSON → APG）

### 3.1 容器与记录

- 审计的官方网页 serializer 生成固定 **1,048,576 bytes（1 MiB）** 的 Uint8Array。
- 每条记录 **18 bytes**，记录按 macroList 顺序排列。
- 每个步骤生成的重复记录数：

  `recordCount = ceil(delay_ms × 79 / 1000)`

  例如 200 ms → 16 条记录。79 是已审计 serializer 使用的公式系数；不要把它直接解释成控制器硬件的物理采样率。
- 当前已审计官方 serializer 的每条记录 Marker 为 `0x02`。
- Counter 为 16-bit big-endian：第一条从 11 开始，每条记录增加 14，按 16-bit 回绕。
- 有效记录之后填充 `0xFF`，直到 1 MiB 容器结束。
- 若生成记录超出 1 MiB 可容纳范围，编辑器必须明确警告截断；不能静默声称完整导出。

### 3.2 18-byte 记录字段

| Byte offset | 字段 | 编码 |
|---:|---|---|
| 0–1 | Left stick X | 16-bit big-endian |
| 2–3 | Left stick Y | 16-bit big-endian |
| 4–5 | Right stick X | 16-bit big-endian |
| 6–7 | Right stick Y | 16-bit big-endian |
| 8–9 | LT | 16-bit big-endian；按下时 4095 |
| 10–11 | RT | 16-bit big-endian；按下时 4095 |
| 12 | 第一组按键位掩码 | 8-bit |
| 13 | 第二组按键位掩码 | 8-bit |
| 14 | D-pad 方向码 | 0 neutral；1–8 八方向 |
| 15 | Marker | 官方 serializer 写入 `0x02` |
| 16–17 | Counter | 16-bit big-endian；11 起始、每条 +14、溢出回绕 |

### 3.3 摇杆力度

必须区分 JSON/editor 的百分比与 APG 原始轴值：

- 输入 value 是 0–100%，不是 APG 轴值。
- `m = round(value × 2047 / 100)`。
- 轴中性值为 2048。
- RIGHT/UP：`2048 + m`；LEFT/DOWN：`2048 - m`。
- 满量程 100% 对应 4095 或 1。
- 解码近似反算：`abs(axis - 2048) × 100 / 2047`。由于量化，非满量程值不保证恢复原始小数。
- 若同一步的 sticks 数组在同一轴上包含冲突方向，官方 serializer 按数组顺序赋值，后处理的值覆盖先前值。
- 当前已审计 serializer 的分支明确处理四个基本方向；不要推断斜向会自动拆成两个轴方向。斜向仍需独立官方样本验证。

### 3.4 按键位掩码与 D-pad

Byte 12：
- PC 布局：A=`0x02`、B=`0x01`、X=`0x08`、Y=`0x04`。
- Switch 布局：A=`0x01`、B=`0x02`、X=`0x04`、Y=`0x08`。
- LB=`0x10`、RB=`0x20`、LT=`0x40`、RT=`0x80`。

Byte 13：
- R3=`0x01`、L3=`0x02`、START=`0x04`、SELECT=`0x08`、HOME=`0x10`。
- 未确认的其他位应保留，不得自行解释或清零。

Byte 14 D-pad：
- Neutral=0
- UP=1、UP_RIGHT=2、RIGHT=3、DOWN_RIGHT=4
- DOWN=5、DOWN_LEFT=6、LEFT=7、UP_LEFT=8

官方 JSON 八方向标签/坐标（已审计 29 步样本）：
- UP ↑=(row 0,col 2)；DOWN ↓=(2,2)；LEFT ←=(1,0)；RIGHT →=(1,4)
- UP_LEFT ↖=(0,0)；UP_RIGHT ↗=(0,4)；DOWN_LEFT ↙=(2,0)；DOWN_RIGHT ↘=(2,4)

空白延时编码为中性摇杆轴 2048、LT/RT=0、按键掩码=0、D-pad=0。

## 4. 通用导出要求与已验证结果

### 4.1 通用 JSON → APG 行为

- 导出必须直接遍历任意长度 macroList，不按 17/29 步等固定步数分流。
- 每步按其 delay 和动作状态生成记录；空白延时按中性状态生成记录。
- Marker、Counter 和 0xFF 填充使用已确认的官方 serializer 规则，不要求用户手动填写。
- JSON 本身不包含 ABXY 布局，因此默认 Switch，并允许切换 PC/Switch。
- `apg-metadata-profiles.mjs` 中的历史样本 profile 只能用于审计/回归，不能成为导出前置条件。
- 超出容器容量必须提示截断。

### 4.2 配对官方样本

**17 步样本**
- JSON：`verification/apg-sample-validator/Official.17steps.json`
- APG：`verification/apg-sample-validator/Official.17steps.apg`
- 17 步对应 777 条有效记录；1 MiB 文件中剩余 1,034,590 bytes 为 `0xFF`。
- APG SHA-256：`4e00caeb6de9ce6cdb30dd667de6af09a27ff619ec888316d3b3f6dc19049373`。
- 通用 encoder 输出与该配对 APG 逐字节一致。该样本是回归测试，不是 17 步限制。

**29 步样本**
- JSON：`verification/apg-sample-validator/Official.29steps.json`
- APG：`verification/apg-sample-validator/Official.29steps.apg`
- APG 大小 1,048,576 bytes；SHA-256：`c51b5b280ac4ba442b8cd8327c4b2068ed13efbb08a80293c3dc97ae194b5c07`。
- 29 步均为 200 ms，每步 16 条记录，共 464 条（8,352 bytes）；其后 1,040,224 bytes 为 `0xFF`。
- 464 条记录 Marker 均为 `0x02`；Counter 从 11 起每条 +14，最后为 6493。
- 样本的 ABXY 位掩码为 Switch 布局；样本覆盖 LT/RT、LB/RB、左右摇杆四个基本方向、L3/R3、SELECT/START/HOME、A/B/X/Y 和 D-pad 八方向。

这两组配对样本与官方 serializer 源码共同支持当前通用编码规则。样本参数只描述对应样本；通用规则来自 serializer 源码与多组交叉验证，不是由某一个步数模板推断。

### 4.3 用户验收记录

- 用户已反馈：将 29 步 JSON 导入 GuliKit 官方网页后，摇杆力度和 D-pad 八方向箭头显示正确。
- 用户已反馈：`Official.17steps.json` 现在可以在本程序中正确生成对应 APG。
- 上述是用户实际操作反馈；不等于控制器硬件执行/回放验证。未来有新验收时，应注明具体文件、操作路径和观察结果。

## 5. APG → JSON：必须明确的有损限制

APG 是定长记录流，不包含原始 JSON 的完整语义。不得承诺 APG → JSON 与原始 JSON 完全一致。

1. **摇杆同轴方向冲突丢失：** APG 每个摇杆轴只有一个有符号数值。同一步同一轴同时存在相反方向（例如 LEFT+RIGHT）时，不能在 APG 中保留两个方向；反向导入只能恢复编码后的轴值方向。
2. **D-pad 多方向丢失：** APG 每条记录只有一个 D-pad 方向码，不能表示同一时刻多个 D-pad 方向的组合。
3. **原始步骤边界丢失：** APG 不存 JSON step ID 或步骤边界。相邻 JSON 步骤若最终编码成相同控制状态，解码器会将连续记录合并为一个 run，无法判断原先有几步。
4. **精确 delay 丢失：** APG 只保存重复记录数量，无法唯一反推出原始毫秒数。若记录数为 n，符合官方公式的整数毫秒范围为：

   `floor((n−1) × 1000 / 79) + 1` 至 `floor(n × 1000 / 79)`。

   例如 16 条记录只说明 delay 在 190–202 ms，不足以证明原始值恰好是 200 ms。当前 decoder 在范围内选取下界作为推断值，并保留可行范围。

### 5.1 17 步反向导入样本的实际差异

- `Official.17steps.json` 是 17 步官方 JSON。
- `NoOfficial.17steps-02.json` 是本程序将配对 APG 反向导入后得到的 JSON，只有 16 步；它不是另一个官方 JSON。
- 原始 JSON 中同轴多方向、多个 D-pad 方向不能完整写入 APG，反向导入只能恢复 APG 实际保存的状态。
- 原始两个相邻步骤虽不同，但最终 APG 状态相同；两步各 200 ms 合并为连续 32 条记录，反向解码为一个 run，当前推断 delay 为 393 ms（该记录数可行范围为 393–405 ms）。
- 2000 ms 与 3000 ms 分别生成 158 与 237 条记录；反向解码当前选择可行范围下界 1988 ms 与 2988 ms。
- 因此 17 → 16 是 APG 表达能力造成的反向信息损失，不代表通用 JSON → APG 导出器按 16 步生成，也不代表未编辑的原始 APG 记录被破坏。

### 5.2 原始记录保留与重建

- APG decoder/model 保留来源记录范围、原始 18-byte records、尾部及不足 18 bytes 的 fragment（具体能否完整重建取决于输入范围识别与容量）。
- 对未修改的来源记录区段，重建器可逐字节复制；修改/新增步骤重新编码；删除步骤不输出对应来源区段。
- 固定记录 patcher 只修改指定记录状态并保留其他字节和文件长度；它不支持插入/删除记录或改变步骤延时。
- 自动记录范围检测是启发式，不是 APG 官方终止符规范。当前检测依赖候选尾部填充对齐、前缀 Marker 一致及 Counter 规律；若文件全填充、Marker 改变、Counter 不连续、尾部不对齐或输入过短，结果可能 ambiguous。此时应要求明确 recordCount 或保留原始文件，不得强行猜测。
- 已审计样本的官方尾部为 `0xFF`。代码中对其他填充值（例如 `0x67`）的检测属于兼容性启发式，不得据此宣称官方 APG 通用尾部也可能是 0x67。
- 不认识的字节、位或尾部数据应作为 opaque data 保留；只有有明确证据时才解释或改写。

## 6. 当前自动化验证与构建状态

最新已核实提交：`7dd2f90f49e09cd2a6096361d08fc5ce5dfe86d6`。

- APG codec workflow：Run [44940695471](https://github.com/ankpsx/gulikit-source/actions/runs/44940695471)，成功。Node tests **61/61 通过**，其中包括 APG 反向导入有损警告回归测试；浏览器 E2E workflow step 成功。
- Windows installer workflow：Run [44940695474](https://github.com/ankpsx/gulikit-source/actions/runs/44940695474)，成功；Windows x64 NSIS 安装包已构建并上传 artifact。
- Artifact：`GuliKit-APG-Editor-Windows-x64`，ID `14721965696`，ZIP 111,388,250 bytes，SHA-256 `4eb19013d38ecfc0193f9e925cb6a2caccb627ae4aea216feb12f32621f6965e`，过期时间 2026-12-05 19:25:13 UTC。
- CI 成功只证明对应自动化任务/runner 构建成功，不证明用户 Windows 电脑已安装启动，也不证明控制器硬件回放成功。

## 7. 尚未完成的验证

1. **Windows 用户电脑验收：** 实际安装最新 NSIS 包，验证启动、离线运行、JSON/APG 导入导出及桌面行为。
2. **控制器硬件验收：** 目前没有 USB/Bluetooth 写入或硬件回放能力；若未来实现，需单独设计协议并实际测试。
3. **摇杆斜向：** 取得官方网页斜向输入及导出 APG 配对样本后再确定编码行为。
4. **异常 APG：** 持续补充未知 Marker、未知位、Counter 中断、截断文件、非对齐尾部、全填充文件及不同填充值的保留/警告测试。
5. **官方网页回归：** 在官方网页上实际导入不同步数、不同动作组合和边界延时的 JSON，确认其 UI 与导出行为；每次记录网页版本/日期和样本身份。

## 8. 知识库维护规则

- 本文件是项目唯一技术知识库。不要新建第二份重复的 APG 规则文档，也不要用“第 N 条”方式不断追加重复记录。
- 新证据与现有规则冲突时，先核对当前源码、样本和测试；然后直接修订对应章节，删除错误旧说法，不保留两套互相矛盾的结论。
- 每个结论必须标明证据类别与适用范围；单一样本事实必须明确限定为该样本。
- 更新 CI 状态时必须使用最新 commit 对应的 run、实际测试数量和 artifact 元数据；不得复用旧 run ID、旧测试计数或已过期 artifact。
- 任何助手都不得把“代码已实现”“CI 通过”“官方网页人工验收”“Windows 用户实机验收”“控制器硬件验收”混为一谈。
