# GuliKit APG：唯一技术知识库

> 本文件是项目唯一维护的 APG 知识文件。采用“主题归档”而不是逐轮追加：新发现必须合并进对应章节，修正旧结论，不建立按日期累积的平行章节或副本。

## 1. 项目目标与证据规则

开发 Windows 本地离线 APG 双向编辑器，目标流程：

- 图形化创建/编辑宏步骤：按键、摇杆、扳机、普通延时、空白延时、步骤排序。
- JSON 导入、编辑、导出。
- 动作模型 → APG 二进制生成。
- APG 二进制 → 可编辑动作模型解析。
- APG → 编辑 → APG；APG → JSON；JSON → 编辑 → APG。
- 保留无法解释的字节/字段；不确定时明确警告，不擅自丢弃或猜测。
- 自动化验证，并最终打包 Windows EXE，离线运行。

证据等级：
- **已验证（源码）**：从官方编辑器源码追踪到具体数据处理/写入表达式。
- **样本观察**：只对仓库内现有 APG/JSON 样本成立，不自动推广为通用格式规则。
- **待验证**：源码链或跨样本证据不足，不能作为最终实现假设。

优先证据是官方 GuliKit 网页及其脚本。第三方实现只能作线索，用户提供的样本只能作为独立交叉检查。任何新结论都要注明来源性质，并更新本文件对应主题，不再向文件末尾无限追加研究日志。

## 2. 官方编辑器与 JSON 工作流

### 官方源码位置

- 仓库：<https://github.com/ankpsx/gulikit-source>
- 官方页面快照：`js/index.html`
- 脚本清单：`js/script_list.txt`
- 主编辑器：`js/script_17.js`（官方 URL 映射为 `macroEditor.js`）
- HTTP helper：`js/script_16.js`
- 主编辑器曾审计的 blob SHA：`60be095e889ef9a248882c2444513c9c74db8dfb`（审计时版本；后续应以 main 当前文件为准）

主编辑器代码经过字符串表混淆。已解码其主要字符串查找函数和部分 serializer 分支；其余 16 个脚本没有全部完成严格审计，因此不声称整个网页代码库 17/17 已审完。

### 官方 GUI 的实际操作

1. 左侧控制面板选择按钮、方向或扳机。
2. 选择状态暂存在 selection 中；它本身还不是宏步骤。
3. 点击 **Add To Steps**，将当前选择复制为一个宏步骤，并采用当前普通延时。
4. **Clear Selection** 清除当前选择。
5. **Add Blank Delay** 添加没有任何按钮/摇杆输入的独立空白延时步骤。
6. 右侧步骤列表可拖动排序、修改延时、删除或清空。
7. 文件管理支持 JSON 配置导入、JSON 保存/导出和 APG 二进制导出。
8. PC / Switch ABXY 布局是明确的编辑器设置；serializer 的 ABXY 编码存在布局分支。

**关键区别：官方 Import File 是 JSON 配置导入，不是 APG 二进制导入。** 本地项目必须额外开发 APG 二进制解析器。

### JSON 配置结构（源码确认）

顶层对象：
- `fileName`
- `macroList`
- `version`（官方导出为字符串 `"1.0"`）

普通步骤：
- `id`
- `buttons`：按钮描述对象，含 `id`、`label`、`type`、`position:{row,col}`
- `sticks`：摇杆描述对象，含嵌套 stick 描述、`direction`、`value`
- `delay`
- `isBlankDelay:false`

空白延时步骤：
- `id`
- `buttons:[]`
- `sticks:[]`
- `delay`
- `isBlankDelay:true`

一个步骤可同时包含多个按键和多个摇杆方向。不要将其简化成“一条按键对应一个步骤”。

官方 `importConfig()` 使用 FileReader 读取文本并 JSON.parse，检查 `fileName` 和数组类型的 `macroList` 后恢复状态。官方 `exportConfig()` 输出上述 JSON。官方 `exportAPG()` 则直接对同一内存中的 `macroList` 调用 `generateAPGContent()`，并下载二进制 APG；不是先导出 JSON 再读取 JSON 转 APG。

## 3. APG 二进制记录格式（已验证部分）

### 文件和记录容量

- 官方 serializer 建立 **1,048,576 字节（1 MiB）** 的 `Uint8Array` 缓冲区。
- 每条记录 **18 字节（0x12）**。
- 当前官方 serializer 的每步骤记录数表达式为：

```js
Math.ceil(delay_ms * 79 / 1000)
```

- 每个步骤按计算出的记录数重复写入该步骤状态，步骤顺序遵循宏列表顺序。
- 以上是当前审计到的官方网页 serializer 行为，不代表已证明手柄硬件的采样频率或时间单位物理意义。
- 1 MiB 缓冲区理论上可容纳 58,254 条完整 18-byte 记录，末尾剩余 4 bytes；实际循环边界/超容量处理仍需专门验证。不得沿用旧文档中“1,024 bytes、最多 56 条记录”的过时结论。

### 18-byte record offsets

| Offset | 宽度 | 字段 | 当前结论 |
|---:|---:|---|---|
| 0–1 | 2 | Left stick X | 16-bit big-endian |
| 2–3 | 2 | Left stick Y | 16-bit big-endian |
| 4–5 | 2 | Right stick X | 16-bit big-endian |
| 6–7 | 2 | Right stick Y | 16-bit big-endian |
| 8–9 | 2 | LT | 16-bit big-endian |
| 10–11 | 2 | RT | 16-bit big-endian |
| 12 | 1 | First button mask | bit mask |
| 13 | 1 | Second button mask | bit mask |
| 14 | 1 | D-pad | direction code |
| 15 | 1 | Marker | 样本观察为 0x02；源码写入需持续对照 |
| 16–17 | 2 | Counter | 样本观察为 BE 16-bit；递增规则尚不能推广 |

### Button masks

第一组掩码（record byte 12）：

| Control ID | PC layout | Alternate / Switch layout |
|---|---:|---:|
| A | 0x02 | 0x01 |
| B | 0x01 | 0x02 |
| X | 0x08 | 0x04 |
| Y | 0x04 | 0x08 |
| LB | 0x10 | 0x10 |
| RB | 0x20 | 0x20 |
| LT | 0x40 | 0x40 |
| RT | 0x80 | 0x80 |

第二组掩码（record byte 13）：

| Control ID | Mask |
|---|---:|
| R3 | 0x01 |
| L3 | 0x02 |
| START | 0x04 |
| SELECT | 0x08 |
| HOME | 0x10 |

第二组名称来自对官方脚本字符串表和 serializer switch labels 的解码；不是根据样本猜测。

### Trigger fields

- LT / RT 字段各为 16-bit big-endian。
- 普通步骤选择 LT 或 RT 时，对应字段写入 4095（0x0FFF）。
- 空白延时步骤绕过普通按键/摇杆/扳机处理，触发器字段保持 0。

### D-pad byte 14

| Direction ID | Value |
|---|---:|
| Neutral | 0 |
| D_UP | 1 |
| D_UP_RIGHT | 2 |
| D_RIGHT | 3 |
| D_DOWN_RIGHT | 4 |
| D_DOWN | 5 |
| D_DOWN_LEFT | 6 |
| D_LEFT | 7 |
| D_UP_LEFT | 8 |

这些值来自官方 serializer 分支的常量表达式还原，并与现有样本相符。

### Stick axis values

四个轴的 accumulator 初始值均为 2048。官方源码中间量：

```js
m = Math.round(value * 100 / 2047)
```

八个基本方向分支：

| Stick | Direction | Axis assignment |
|---|---|---|
| L_STICK | UP | left Y = 2048 + m |
| L_STICK | DOWN | left Y = 2048 − m |
| L_STICK | LEFT | left X = 2048 − m |
| L_STICK | RIGHT | left X = 2048 + m |
| R_STICK | UP | right Y = 2048 + m |
| R_STICK | DOWN | right Y = 2048 − m |
| R_STICK | LEFT | right X = 2048 − m |
| R_STICK | RIGHT | right X = 2048 + m |

- 最终轴值写入 record offsets 0–7，big-endian。
- `value` 缺失时源码读取默认值 0。
- serializer 按 `selectedSticks` 数组顺序迭代；同一轴出现冲突方向时，后处理的赋值覆盖先前赋值（last matching direction wins）。
- UI 数据模型有四个斜向方向，但当前已解码的 serializer stick switch 只处理四个基本方向；斜向输入如何处理需测试，不能擅自合成两个轴。
- **待验证**：值域、负数、浮点、超范围输入、TypedArray 写入时的截断/转换，以及多方向冲突在实际导出中的结果。

## 4. 样本证据（与通用格式规则分开）

样本目录：<https://github.com/ankpsx/gulikit-source/tree/main/verification/apg-sample-validator>

- `Auto.apg`：1,048,576 bytes。
- `macro.json`：官方编辑器导出的配套 JSON。
- APG SHA-256：`4db8546e0f81620a05c7606888897b4ab46f38823ea809b2c386848c92eaacb2`。
- 样本前 576 bytes 为 32 × 18-byte records；其余 1,048,000 bytes 均为 `0xFF`。
- JSON 包含一个普通 200 ms 步骤和一个空白 200 ms 步骤；每组样本各 16 条记录。
- 每组内前 16 bytes 的控制器状态重复。
- 空白步骤样本轴值为 2048，触发器、按键和 D-pad 为 0。
- 样本 byte 15 为 `0x02`；byte 16–17 为 BE counter，从 11 开始，每条 +14，最后到 445。

**限制：** 16 条记录/200 ms、marker 0x02、counter +14、1 MiB 文件和 FF 尾部目前都是样本观察或当前导出版本特征，不能在没有更多官方版本/样本证据时全部当成永恒格式规范。

### 尾部填充差异

官方源码中尾部填充表达式常量折算为 5991，写入 Uint8Array 时按字节截断为 `0x67`；现有 `Auto.apg` 样本未使用区域则全为 `0xFF`。差异未解决。实现时应保留原始尾部数据，不能强行把所有文件统一填成 0x67 或 0xFF。

## 5. 自动验证器现状

验证器：<https://github.com/ankpsx/gulikit-source/blob/main/verification/apg-sample-validator/verify-apg.mjs>

README：<https://github.com/ankpsx/gulikit-source/blob/main/verification/apg-sample-validator/README.md>

目前验证器针对现有双步骤样本，检查文件大小、JSON 步骤结构、记录数、步骤状态重复、空白步骤中性状态、LT/RT 非零字段、按键/D-pad 存在性、marker、counter 序列和尾部一致性。已增加 byte 13 中 R3/L3/START/SELECT/HOME 掩码与 JSON 选择的交叉检查。

GitHub Actions：
- Run #6，ID `44909198922`，针对验证器提交 `d837b8bed88f6949ab9cca9b127372d6cc60929d`，结果 **success**。
- [查看运行记录](https://github.com/ankpsx/gulikit-source/actions/runs/44909198922)

这只是现有样本的交叉验证，不等于完整 APG codec 已实现，也不代表全部字节映射均已通过独立生成样本验证。

## 6. 尚未解决的技术问题

1. **边界值**：delay 为 0、1、非整步、大值、负值时的记录数与容量边界。
2. **摇杆输入**：value 缺失、0、100、负数、浮点、超范围值的精确结果；斜向方向的 serializer 行为。
3. **记录元数据**：marker 与 counter 的完整规则、计数回绕和不同导出文件间是否变化。
4. **尾部数据**：源码 0x67 与样本 0xFF 的差异来源；是否与网页版本、导出路径或样本版本有关。
5. **APG 解码**：记录边界、有效记录终止、尾部填充识别、未知字段保留、损坏文件处理。
6. **ABXY 布局**：PC/alternate 映射已见源码分支；需通过不同布局导出样本交叉验证。
7. **额外官方来源**：尚未发现可确认的官方 APG 二进制导入器；网页 JSON Import 不可当作 APG parser。

## 7. 实施路线与验收要求

### 第一阶段：codec 核心

- 建立共享动作模型与 JSON schema/normalize。
- 实现 18-byte record encoder，先覆盖已验证字段。
- 实现 APG decoder，未识别字段和原始尾部以 opaque/raw data 保留。
- 对未知版本、异常长度、非法记录和不确定尾部发出明确警告。
- 编码器对尚未验证的 metadata 采用保守策略，不伪造已知性。

### 第二阶段：测试

至少覆盖：
- A/B/X/Y 在 PC 与 alternate 布局下的映射。
- LB/RB/LT/RT、L3/R3、START/SELECT/HOME。
- 八个 D-pad 方向。
- 左右摇杆八个基本方向、value 边界、缺失值、冲突方向、斜向输入。
- 普通步骤、空白延时、多步骤、不同 delay。
- 原始未知字节、尾部填充、截断/损坏 APG。
- JSON → APG → 解析模型 → APG 的语义往返，以及对未知数据的保留。

### 第三阶段：Windows GUI 与交付

- 提供可视化步骤编辑器、排序、延时编辑、JSON 导入/导出。
- 支持 APG 导入并恢复可编辑步骤。
- 支持 APG 导出及差异/警告提示。
- 离线运行，不依赖官方网页或网络服务。
- 打包 Windows EXE，验证干净环境安装、启动、导入、编辑、导出。

## 8. 关键项目约束

- 官方网页的 JSON Import 与 APG binary import 必须严格区分。
- APG 样本观察不能冒充通用规范。
- 不得丢弃未知字节或悄悄“修复”不认识的数据。
- 不得声称 parser、serializer、GUI 或 EXE 已完成，除非相应代码和测试确实存在。
- 本文件是唯一知识库；以后更新时重组本文件的主题章节，必要时压缩或替换旧内容，不新增逐轮累积的 Section。
