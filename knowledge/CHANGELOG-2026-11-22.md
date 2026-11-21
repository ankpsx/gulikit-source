# GuliKit APG 技术知识库更新记录

> 日期：2026-11-22  
> 范围：官方 29 步样本对照、D-pad 八方向 descriptor 修正，以及相关待验证事项。  
> 本文件是《GuliKit APG：唯一技术知识库》的增量记录；状态严格区分源码已提交、测试已编写、测试已执行和真实设备验收。

## 本次新增知识条目

| 序号 | 知识主题 | 当前结论 / 记录 | 证据与实现位置 | 验证状态 |
|---:|---|---|---|---|
| 1 | 官方 D-pad descriptor 格式 | 官方 JSON 的 D-pad 方向使用 `id`、箭头字符 `label` 和 `position`，不是方向英文/文字标签。 | `Official.29steps.json`；`codec/apg-to-model.mjs` | 已从官方 JSON 样本确认 |
| 2 | D-pad 上下左右坐标 | `D_UP` → `↑` / row 0 col 2；`D_DOWN` → `↓` / row 2 col 2；`D_LEFT` → `←` / row 1 col 0；`D_RIGHT` → `→` / row 1 col 4。 | `DPAD_POSITIONS` in `codec/apg-to-model.mjs` | 已写入源码 |
| 3 | D-pad 四个斜向坐标 | `D_UP_LEFT` → `↖` / row 0 col 0；`D_UP_RIGHT` → `↗` / row 0 col 4；`D_DOWN_LEFT` → `↙` / row 2 col 0；`D_DOWN_RIGHT` → `↘` / row 2 col 4。 | `DPAD_POSITIONS` in `codec/apg-to-model.mjs` | 已写入源码 |
| 4 | D-pad 导出修正 | APG 转可编辑模型时，八方向 descriptor 输出官方箭头 label 和 position；非 D-pad descriptor 不应被此映射改变。 | commit `e929e4f96f3dc16038fa5ffe33148e194dec9714`；[源码](https://github.com/ankpsx/gulikit-source/blob/main/codec/apg-to-model.mjs) | 已提交 GitHub main；官方网页端显示仍待验收 |
| 5 | D-pad 八方向回归测试 | 新增覆盖八个方向的测试，断言 descriptor 的 id、label、type、position 与官方格式一致。 | commit `e9c735a1bf8e969c5ec579c428676bc76a89960d`；[测试](https://github.com/ankpsx/gulikit-source/blob/main/codec/apg-to-model.test.mjs) | 测试代码已提交；尚未执行，不得标记通过 |
| 6 | 官方 29 步 JSON 对照 | 官方 JSON 与本程序导出 JSON 均为 29 步；主要动作 ID、顺序、方向和延时一致；每步 delay 为 200ms；空白步骤为 0；摇杆方向动作 8 项对应。 | `Official.29steps.json` 与 `29steps-imported-by-our-app.json` | JSON 层面对照完成；不等于 APG 二进制逐记录审计 |
| 7 | 摇杆力度异常 | 对照中官方摇杆力度为 100，本程序导出出现 41902.09。当前解码换算疑点为 `Math.abs(delta) * 2047 / 100`；可能需要按满量程 2047 反向归一化，但必须先用 APG 原始字节、中心值和正负满量程样本确认，再同步核对 encoder。 | `codec/apg-to-model.mjs`；`codec/apg-codec.mjs` | 已发现问题；修复公式尚未确认、尚未提交 |
| 8 | APG 原始记录边界 | 当前 `decodeAPGSteps` 会按相邻记录前 15 bytes 相同进行分组，并忽略 marker/counter bytes；相邻同状态记录可能被合并，因此不能保证仅凭该解码结果恢复原始步骤边界。 | `codec/apg-codec.mjs` | 源码行为已识别；需继续验证与设计 |
| 9 | APG 时间精度限制 | 现有样本中 79 records/sec；16 records 对应约 190–202ms，不能据此唯一精确还原 200ms。 | APG 样本分析记录 | 样本观察，不应推广为所有固件/文件的通用规范 |
| 10 | 官方样本与二进制审计边界 | `Official.29steps.json` 的 JSON 对照已完成，但 `Official.29steps.apg` 尚未成功读取并逐条审计 18-byte records；因此不能宣称已完成 29 步 APG 二进制交叉验证。 | `verification/apg-sample-validator/` | 未完成 |
| 11 | 验证器覆盖范围 | 当前验证器仍以旧 `Auto.apg` + `macro.json` 两步样本为默认输入，尚未更新为官方 29 步样本。 | `verification/apg-sample-validator/verify-apg.mjs` 与 README | 待更新 |
| 12 | 最终网页与实机验收 | 尚未在官方网页上传本次导出的 JSON 验收箭头布局；Windows 新版安装包尚未重新构建；用户 Windows 实机验收尚未完成。 | 官方编辑器：https://macro.gulikit.com/?language=1 | 待执行 |

## D-pad 官方 descriptor 对照表

| 序号 | ID | 官方 label | position.row | position.col |
|---:|---|:---:|---:|---:|
| 1 | D_UP | ↑ | 0 | 2 |
| 2 | D_DOWN | ↓ | 2 | 2 |
| 3 | D_LEFT | ← | 1 | 0 |
| 4 | D_RIGHT | → | 1 | 4 |
| 5 | D_UP_LEFT | ↖ | 0 | 0 |
| 6 | D_UP_RIGHT | ↗ | 0 | 4 |
| 7 | D_DOWN_LEFT | ↙ | 2 | 0 |
| 8 | D_DOWN_RIGHT | ↘ | 2 | 4 |

## 后续执行顺序

1. 更新样本验证器，使其能够读取并比较官方 29 步样本；优先解决二进制文件读取方式，完成逐条 18-byte 记录审计。
2. 用原始 APG 字节确认摇杆轴中心、正负方向和满量程，再修复 decoder/encoder 的归一化换算并添加边界测试。
3. 执行完整自动化测试；记录实际 CI run、通过/失败数量，不把“测试代码已编写”写成“测试已通过”。
4. 重新构建 Windows x64 安装包并记录 Artifact / Release 信息。
5. 在官方网页实际导入本程序导出的 JSON，确认 D-pad 八方向显示为箭头且位置正确；再由用户进行 Windows 实机验收。

## 证据分级约定

- **官方样本确认**：只对实际检查过的官方 JSON/APG 文件成立。
- **源码确认**：仅表示当前代码实现如此，不代表官方格式必然如此。
- **自动化测试已编写**：有测试代码，但尚未执行。
- **自动化测试通过**：必须有本地或 CI 实际成功结果。
- **官方网页验收通过**：必须在官方网页实际导入并观察结果。
- **Windows 实机验收通过**：必须由用户在目标 Windows 环境实际运行确认。

任何推断都必须保留样本范围和限制；不得把单一样本中的 marker、counter、记录速率或延时映射写成通用 APG 规范。
