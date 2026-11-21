# GuliKit APG：唯一技术知识库

> 本文件是项目唯一维护的 APG 知识文件。已确认事实集中在一张总表；样本限定、未解决问题和实施状态另行简要说明。新发现必须合并到总表对应行或修正旧行，不按研究轮次追加章节。

## 1. 项目目标与证据规则

开发 Windows 本地离线 APG 双向编辑器：图形化创建/编辑动作步骤；JSON 导入/导出；动作模型生成 APG；APG 解析回可编辑模型；保留未知字节；自动化验证；最终打包离线 Windows EXE。

证据标记：
- **源码已确认**：从官方网页源码追踪到明确的数据结构、条件或写入表达式。
- **样本已观察**：仅在仓库现有 APG/JSON 样本中观察到，不自动推广为通用格式规则。
- **实现/CI 已验证**：本项目代码已实现，且有自动化测试支持；不等同于官方格式已被完整证明。
- **待验证**：证据不足，不可当成已知规则。

官方源码优先；第三方实现仅作线索。主编辑器 js/script_17.js（blob SHA 60be095e889ef9a248882c2444513c9c74db8dfb，审计时版本）经过字符串表混淆，已解码主要字符串和部分 serializer 分支；不声称所有网页脚本均已审计完毕。源码目录：https://github.com/ankpsx/gulikit-source。

## 2. 已验证事实总表

下表是项目已确认知识的唯一集中索引。后续新增验证结论优先合并到此表，不再在文件末尾追加同类段落。

| 类别 | 项目 / 字段 | 已验证结论 | 证据等级与边界 |
|---|---|---|---|
| 官方 GUI | 控制面板 | 左侧控制面板可选择按键、摇杆方向和扳机；当前选择先保存在 selection 状态中。 | 源码已确认 |
| 官方 GUI | Add To Steps | 将当前选择复制成一个宏步骤，并使用当前普通延时；添加后清空当前选择。 | 源码已确认 |
| 官方 GUI | Clear Selection | 清除当前选择状态，不等于清空整个宏列表。 | 源码已确认 |
| 官方 GUI | Add Blank Delay | 创建独立空白延时步骤；buttons 和 sticks 为空，isBlankDelay=true。 | 源码已确认 |
| 官方 GUI | 步骤列表 | 右侧步骤列表支持拖动排序；支持清空列表。 | 源码已确认 |
| 官方 GUI | 延时 | 普通步骤使用 Delay(ms)，默认 200 ms；空白延时有独立输入，默认 200 ms。两者均可在网页图形界面修改，添加时把当时输入值保存到该步骤。 | 源码已确认；默认值属于当前网页实现 |
| 官方 GUI | 文件操作 | 支持 JSON 配置导入/保存/导出，以及 Export APG File。 | 源码已确认 |
| 官方 GUI | ABXY 布局 | 提供 PC / Switch 布局选项；serializer 对 ABXY 有布局分支。 | 源码已确认；仍需独立导出样本交叉验证 |
| 官方 GUI | JSON 与 APG 的关系 | JSON 导入后恢复内存中的动作模型；JSON 导出和 APG 导出都使用同一 appState.macroList。APG 导出直接调用 generateAPGContent()，不是先下载 JSON 再转换。 | 源码已确认 |
| 官方 GUI | APG 导入 | 官方 Import File 使用 FileReader 读取文本并 JSON.parse；它是 JSON 导入，不是 APG 二进制导入。 | 源码已确认；本地软件必须另做 APG parser |
| JSON | 顶层结构 | fileName、macroList、version；官方导出 version 为字符串 "1.0"。 | 源码已确认 |
| JSON | 普通步骤 | 含 id、buttons、sticks、delay、isBlankDelay:false。 | 源码已确认 |
| JSON | button descriptor | 含 id、label、type、position:{row,col}。 | 源码已确认 |
| JSON | stick descriptor | 含嵌套 stick 描述、direction、value。 | 源码已确认 |
| JSON | 空白延时步骤 | 含 id、buttons:[]、sticks:[]、delay、isBlankDelay:true。 | 源码已确认 |
| JSON | 一步中的输入数量 | 一个步骤可以同时包含多个按键和多个摇杆方向；不能简化为“一条按键对应一个步骤”。 | 源码已确认 |
| JSON | 导入校验 | importConfig() 检查 fileName truthy 且 macroList 为数组，然后恢复应用状态并刷新 UI。 | 源码已确认 |
| JSON | 导出 | exportConfig() 输出 {fileName,macroList,version:"1.0"} 格式化 JSON。 | 源码已确认 |
| APG 文件 | 缓冲区 | 官方 serializer 建立 1,048,576 bytes（1 MiB）的 Uint8Array 缓冲区。 | 源码已确认；当前网页版本 |
| APG 记录 | 记录宽度 | 每条记录为 18 bytes（0x12）。 | 源码已确认 |
| APG 记录 | 每步记录数 | 当前 serializer 使用 Math.ceil(delay_ms * 79 / 1000) 计算每一步输出记录数；每步状态按该数量重复写入。 | 源码已确认；不代表硬件物理采样率 |
| APG 记录 | 顺序 | 步骤按宏列表顺序编码。 | 源码已确认 |
| APG 记录 | 延时反推 | 对 n 条连续记录，符合 ceil(delay_ms × 79 / 1000)=n 的正整数毫秒范围为 floor((n−1)×1000/79)+1 至 floor(n×1000/79)。例如 16 条对应 190–202 ms，不能唯一恢复 200 ms。 | 由源码公式数学推导；不是原始 delay 的恢复值 |
| APG 字段 | Offset 0–1 | Left stick X，16-bit big-endian。 | 源码已确认 |
| APG 字段 | Offset 2–3 | Left stick Y，16-bit big-endian。 | 源码已确认 |
| APG 字段 | Offset 4–5 | Right stick X，16-bit big-endian。 | 源码已确认 |
| APG 字段 | Offset 6–7 | Right stick Y，16-bit big-endian。 | 源码已确认 |
| APG 字段 | Offset 8–9 | LT，16-bit big-endian。普通步骤选中 LT 时写入 4095（0x0FFF）。 | 源码已确认 |
| APG 字段 | Offset 10–11 | RT，16-bit big-endian。普通步骤选中 RT 时写入 4095（0x0FFF）。 | 源码已确认 |
| APG 字段 | Offset 12 | 第一组按键掩码（1 byte）。 | 源码已确认 |
| APG 字段 | Offset 13 | 第二组按键掩码（1 byte）。 | 源码已确认 |
| APG 字段 | Offset 14 | D-pad 方向码（1 byte）。 | 源码已确认 |
| APG 字段 | Offset 15 | Marker 字节；现有样本值为 0x02。 | 样本已观察；通用值仍待跨版本验证 |
| APG 字段 | Offset 16–17 | Counter，样本按 BE 16-bit 解释。 | 样本已观察；通用递增规则仍待验证 |
| 按键映射 | Byte 12：A | PC=0x02；Switch/alternate=0x01。 | 源码已确认 |
| 按键映射 | Byte 12：B | PC=0x01；Switch/alternate=0x02。 | 源码已确认 |
| 按键映射 | Byte 12：X | PC=0x08；Switch/alternate=0x04。 | 源码已确认 |
| 按键映射 | Byte 12：Y | PC=0x04；Switch/alternate=0x08。 | 源码已确认 |
| 按键映射 | Byte 12：LB / RB | LB=0x10；RB=0x20；两种布局相同。 | 源码已确认 |
| 按键映射 | Byte 12：LT / RT | LT=0x40；RT=0x80；两种布局相同。 | 源码已确认 |
| 按键映射 | Byte 13：R3 / L3 | R3=0x01；L3=0x02。 | 源码已确认 |
| 按键映射 | Byte 13：START / SELECT / HOME | START=0x04；SELECT=0x08；HOME=0x10。 | 源码已确认；来自 serializer 分支解码 |
| Trigger | 空白延时 | 空白延时绕过普通按键/摇杆/扳机处理，LT/RT 字段保持 0。 | 源码已确认 |
| D-pad | Neutral | 0。 | 源码已确认 |
| D-pad | D_UP / D_UP_RIGHT | 1 / 2。 | 源码已确认 |
| D-pad | D_RIGHT / D_DOWN_RIGHT | 3 / 4。 | 源码已确认 |
| D-pad | D_DOWN / D_DOWN_LEFT | 5 / 6。 | 源码已确认 |
| D-pad | D_LEFT / D_UP_LEFT | 7 / 8。 | 源码已确认 |
| 摇杆 | 轴中性值 | 四个轴 accumulator 初始值均为 2048。 | 源码已确认 |
| 摇杆 | 幅度换算 | m = Math.round(value * 100 / 2047)。 | 源码已确认 |
| 摇杆 | L_STICK UP / DOWN | left Y = 2048 + m / 2048 − m。 | 源码已确认 |
| 摇杆 | L_STICK LEFT / RIGHT | left X = 2048 − m / 2048 + m。 | 源码已确认 |
| 摇杆 | R_STICK UP / DOWN | right Y = 2048 + m / 2048 − m。 | 源码已确认 |
| 摇杆 | R_STICK LEFT / RIGHT | right X = 2048 − m / 2048 + m。 | 源码已确认 |
| 摇杆 | value 缺失 | 源码读取默认值 0。 | 源码已确认 |
| 摇杆 | 冲突方向 | 按 selectedSticks 数组顺序迭代；同轴后处理的赋值覆盖先前赋值。 | 源码已确认 |
| 摇杆 | 斜向 | UI 模型有斜向方向，但已解码 serializer switch 只处理四个基本方向；不能假设斜向会自动合成双轴。 | 源码已确认当前分支范围；实际行为仍需导出测试 |
| 样本 | 样本文件 | Auto.apg 为 1,048,576 bytes；配套 macro.json。样本 SHA-256：4db8546e0f81620a05c7606888897b4ab46f38823ea809b2c386848c92eaacb2。 | 样本已观察；https://github.com/ankpsx/gulikit-source/tree/main/verification/apg-sample-validator |
| 样本 | 有效记录区 | 前 576 bytes = 32 × 18-byte records；其余 1,048,000 bytes 均为 0xFF。 | 样本已观察 |
| 样本 | 样本步骤 | JSON 含普通 200 ms 步骤和空白 200 ms 步骤；各对应 16 条记录。 | 样本已观察；与当前 79/s 公式相符 |
| 样本 | 状态重复 | 每组内控制器状态字段重复；样本空白步骤轴值 2048，trigger/button/D-pad 为 0。 | 样本已观察 |
| 样本 | Marker / Counter | byte 15=0x02；byte 16–17 为 BE counter，从 11 起每条 +14，最后 445。 | 样本已观察；不可推广为通用规则 |
| 样本 | 尾部填充差异 | 当前审计源码尾部表达式折算为 5991，写入 Uint8Array 截断为 0x67；样本未使用区为 0xFF。 | 源码表达式已确认、样本值已观察；两者差异原因待验证 |
| 本地实现 | 共享动作模型 | codec/action-model.mjs 提供普通步骤/空白延时创建、JSON normalize、逐步骤延时更新和 JSON 导出；新步骤默认 200 ms，导入步骤不自动重置 delay，未知 JSON 字段保留。 | 实现已提交；https://github.com/ankpsx/gulikit-source/blob/main/codec/action-model.mjs |\n| 本地实现 | Encoder | codec/apg-codec.mjs 已实现 18-byte record encoder、1 MiB 输出、79/s 记录数表达式、轴/trigger/button/D-pad、PC/Switch ABXY 和 blank delay。 | 实现已提交；https://github.com/ankpsx/gulikit-source/blob/main/codec/apg-codec.mjs |
| 本地实现 | Decoder 第一层 | decodeAPGRecords() 要求显式传入 recordCount；解析 axes/triggers/masks/D-pad/marker/counter，保留每条原始记录、原始尾部和不足 18 bytes 的 fragment。 | 实现已提交；不是高层宏步骤 decoder |
| 本地实现 | Decoder 状态分组 | decodeAPGSteps() 将相邻且前 15 bytes 控制状态完全相同的记录合并为候选 run；排除 marker/counter，保留原始记录。相同状态的相邻原始步骤无法区分。 | 实现已提交；仅推断状态 run，不声称精确恢复步骤边界 |\n| 本地实现 | APG → 动作模型适配 | codec/apg-to-model.mjs 将解码 run 转为 JSON 形状的可编辑 macroList；需要显式指定 recordCount 与 PC/SWITCH 布局；每步附加 apgSource，保留记录范围、原始记录 hex、marker/counter 与可行 delay 范围。 | 已提交；推断模型，不是无损恢复 |\n| 本地实现 | APG 延时推断 | 若延时范围唯一则采用唯一值；若范围有多个整数值，默认优先选范围内 200 ms，否则选最小值；允许 preferredDelayMs 覆盖。原始可能范围始终保存在 apgSource.possibleDelayMs。 | 已提交；UI 必须明确显示“推断值” |\n| 本地实现 | APG 摇杆反推 | 从 2048 中性轴值推断基本方向；通过已知 round(value×100/2047) 公式反算近似 value，并保留 rawRecordsHex。原始 UI value 不能保证精确恢复。 | 已提交；近似反推，需 UI 警告 |
| 本地实现 | ABXY 未指定 | 未指定布局时不猜测，返回 face-button 候选解释。 | 实现已提交 |
| 本地实现 | Metadata 策略 | Encoder 要求调用者显式传入 marker/counter profile，避免把单一样本规律伪装成通用规则。 | 实现策略已提交 |
| 本地测试 | 测试覆盖 | APG codec Node 测试覆盖 200 ms→16 records、blank neutral、ABXY、trigger/second mask、D-pad/摇杆基本方向、零延时、参数校验、raw record/tail 保留、ABXY 未指定、metadata、状态分组及延时范围反推。 | CI 已验证 14 pass / 0 fail |\n| 本地测试 | 动作模型与 JSON | 新增测试覆盖普通/空白步骤默认 200 ms、逐步骤修改延时、导入描述符和未知字段保留、JSON 导出 version=1.0、无效 delay/descriptor 拒绝。 | CI Run 44911340732；19 pass / 0 fail |\n| 本地测试 | APG → 动作模型 | 新增测试覆盖普通动作恢复、空白延时恢复、原始记录保留、200 ms 延时范围和布局必填、用户覆盖推断延时。与既有测试合并共 22 项通过。 | CI Run 44911554127；22 pass / 0 fail |
| 本地测试 | 摇杆边界测试 | 新增缺失值、null、负数、小数、正向值及超 16-bit 轴值测试；这些测试验证本地 encoder 的 JS 算术/字节写入行为，不等于已取得官方硬件边界样本。 | 本地实现/CI 已验证 |
| 本地测试 | 延时与容量边界 | 新增负延时无记录、超出小型测试缓冲区时记录截断并返回 truncated 标志的测试。 | 本地实现/CI 已验证 |
| 本地测试 | 最新 CI | Run ID 44910981951，14 项测试全部通过。 | https://github.com/ankpsx/gulikit-source/actions/runs/44910883435 |
| 样本验证器 | 当前覆盖 | 检查文件大小、JSON 结构、记录数、步骤状态重复、blank neutral、LT/RT、按键/D-pad、marker/counter、尾部，并交叉检查 byte 13 的 R3/L3/START/SELECT/HOME。 | 实现已提交；仅针对现有样本 |
| 样本验证器 | CI | Run ID 44909198922 成功。 | https://github.com/ankpsx/gulikit-source/actions/runs/44909198922 |

## 3. 尚未解决的问题

1. **摇杆边界值**：本地测试已覆盖缺失、null、负数、小数、较大正值及 16-bit 写入回绕；仍需独立官方导出样本确认官方网页对极端输入是否允许、是否有 UI 限制。
2. **delay 与容量**：delay=0、1、负值、非整步、大值、总记录超过 1 MiB 时的官方行为；1 MiB 理论上可放 58,254 条完整记录，余 4 bytes，实际循环边界尚需验证。
3. **Marker / Counter**：不同 APG 文件是否固定 marker=0x02、counter 起点 11、步进 14；计数回绕和版本差异未确认。
4. **尾部**：源码 0x67 与样本 0xFF 差异原因未解决；解析器必须保留原始尾部，不应仅凭填充值猜测有效记录结束。
5. **高层 APG decoder**：自动识别有效记录范围、按连续状态分组、恢复宏步骤及 delay、生成可编辑 JSON 模型尚未完成。
6. **斜向摇杆**：serializer 已解码分支没有 cardinal 以外的处理；需用官方 UI 导出文件验证斜向输入最终编码结果。
7. **跨布局验证**：PC / Switch ABXY 源码分支已确认，但需要两种布局的独立 APG 导出样本交叉验证。
8. **未知字段与损坏文件**：必须保留未知字节；对异常长度、未知 marker、未知 D-pad、截断文件明确警告，不静默修复。

## 4. 实施状态与下一步

- **已完成第一版**：APG encoder、低级 18-byte record parser、Node 单元测试、GitHub Actions。
- **已完成初步状态分组**：decodeAPGSteps() 输出相邻同状态 run，并给出可成立的整数毫秒延时范围；相邻同状态步骤仍不可区分。
- **已完成第一版**：JSON normalize、APG → 可编辑动作模型适配（带原始记录和推断警告）。\n- **正在推进**：记录终止范围识别、真实 APG 样本自动识别、编辑后 APG 重编码与字节保留策略。
- **后续**：完整 JSON ↔ APG 语义往返；GUI 步骤编辑、拖动排序、延时编辑；离线 Windows EXE。
- **验收原则**：必须用独立 APG 样本验证映射；完成 APG → 编辑 → APG 往返；未知字节/尾部不得丢失；所有尚未证明的元数据均应提示用户或保留原值。

## 5. 关键项目约束

- 官方网页 JSON Import 与 APG binary import 必须严格区分。
- 样本观察不得冒充通用规范。
- 不得丢弃未知字节或悄悄“修复”不认识的数据。
- 不得声称 parser、serializer、GUI 或 EXE 已完成，除非相应代码和测试确实存在。
- 本文件是唯一知识库；后续只更新本表或修正现有主题，不按研究轮次增加章节。
