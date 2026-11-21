# GuliKit APG：唯一技术知识库

> 本文件是 GuliKit APG Editor 项目的唯一技术知识库。本文只记录当前有效、可复核的结论；已经证实错误或已被新证据推翻的旧说法不保留为参考规则。知识修订以当前事实为准，历史变更由 Git commit 记录。

## 1. 项目目标与证据规则

项目目标：构建 Windows 本地离线 GuliKit APG 编辑器，支持 JSON/APG 导入、动作步骤编辑、JSON/APG 导出、保留未修改 APG 原始记录，并通过自动化测试和真实环境验收。

证据等级必须严格区分：

- **官方源码确认**：从官方网页脚本定位到明确的结构、字段、条件或运算。
- **官方配对样本确认**：在仓库中配套的官方 JSON 与 APG 二进制文件中交叉核对。
- **本地测试通过**：本地代码在自动化测试中通过；不等于官方网页或真实控制器验收。
- **Chromium 浏览器 E2E 通过**：在本项目本地网页编辑器中通过真实浏览器自动化；不等于官方网页验收。
- **Windows 构建通过**：GitHub Windows runner 成功生成安装包；不等于用户电脑已安装、启动。
- **待验证**：证据不足，不能作为程序默认规则。

不得把单一样本结论推广成所有 APG 文件的通用规则；不得把推断的步骤边界或延时称为无损恢复。

## 2. 已确认技术事实总表

| 序号 | 分类 | 当前有效结论 | 证据与适用范围 |
|---:|---|---|---|
| 1 | 官方 GUI：动作步骤 | 宏由有序步骤列表组成；一个步骤可同时包含多个 buttons 和多个 sticks，不是一条按键必然对应一个步骤。 | 官方源码确认 |
| 2 | 官方 GUI：普通延时 | 普通步骤的 delay 单位为毫秒；当前官方网页默认值为 200 ms。每步延时保存在步骤对象中。 | 官方源码确认；默认值属于当前网页版本 |
| 3 | 官方 GUI：空白延时 | 空白延时是独立步骤，buttons/sticks 为空，isBlankDelay=true；与普通动作步骤分开保存延时。 | 官方源码确认 |
| 4 | 官方 GUI：编辑 | 网页支持选择动作、添加步骤、添加空白延时、清空选择/列表、步骤排序，以及修改每步延时。 | 官方源码确认 |
| 5 | 官方 GUI：布局 | ABXY 有 PC 与 Switch 两种布局；两种布局的 A/B/X/Y 位掩码不同。 | 官方源码确认；29 步配对样本验证 Switch 布局 |
| 6 | 官方 JSON：顶层结构 | 主要字段为 fileName、macroList、version；官方导出 version 为字符串 "1.0"。 | 官方源码与样本确认 |
| 7 | 官方 JSON：普通步骤 | 包含 id、buttons、sticks、delay、isBlankDelay:false。 | 官方源码与样本确认 |
| 8 | 官方 JSON：按键描述符 | 按键描述符包含 id、label、type、position:{row,col}；具体 label/position 依动作类型而定。 | 官方源码与样本确认 |
| 9 | 官方 JSON：摇杆描述符 | 摇杆项包含嵌套 stick 描述、direction、value；本项目界面将 value 作为 0–100 的力度百分比编辑。 | 官方样本及本地编辑模型确认 |
| 10 | 官方 JSON：空白延时 | 空白步骤包含空 buttons/sticks、delay 与 isBlankDelay:true。 | 官方源码与样本确认 |
| 11 | 官方 JSON 导入 | 官方网页 Import File 使用文本读取和 JSON.parse；这是 JSON 导入，不是 APG 二进制解析。 | 官方源码确认 |
| 12 | 官方 APG 导出 | 官方网页从内存中的 macroList 直接生成 APG；不是先下载 JSON 再转换。 | 官方源码确认 |
| 13 | APG 容器 | 当前官方 serializer 输出 1,048,576 bytes（1 MiB）的 Uint8Array。 | 官方源码确认；适用于审计的网页版本 |
| 14 | APG 记录宽度 | 每条 APG 记录为 18 bytes。 | 官方源码及两个仓库样本确认 |
| 15 | APG 每步记录数 | 当前官方 serializer 对每个步骤使用 ceil(delay_ms × 79 / 1000) 计算重复记录数。200 ms 对应 16 条记录。 | 官方源码确认；79 是 serializer 公式中的系数，不应直接解释为硬件物理采样率 |
| 16 | APG 记录顺序 | 记录按 macroList 的步骤顺序写出；每步状态按计算出的记录数量重复。 | 官方源码确认 |
| 17 | APG Offset 0–1 | Left stick X，16-bit big-endian。 | 官方源码确认 |
| 18 | APG Offset 2–3 | Left stick Y，16-bit big-endian。 | 官方源码确认 |
| 19 | APG Offset 4–5 | Right stick X，16-bit big-endian。 | 官方源码确认 |
| 20 | APG Offset 6–7 | Right stick Y，16-bit big-endian。 | 官方源码确认 |
| 21 | APG Offset 8–9 | LT 数值，16-bit big-endian；选中 LT 时写入 4095。 | 官方源码及 29 步样本确认 |
| 22 | APG Offset 10–11 | RT 数值，16-bit big-endian；选中 RT 时写入 4095。 | 官方源码及 29 步样本确认 |
| 23 | APG Offset 12 | 第一组按键位掩码。 | 官方源码及样本确认 |
| 24 | APG Offset 13 | 第二组按键位掩码。 | 官方源码及样本确认 |
| 25 | APG Offset 14 | D-pad 方向码；0 表示 neutral，1–8 表示八方向。 | 官方源码及 29 步样本确认 |
| 26 | APG Offset 15 | Marker 字节；官方 serializer 对每条记录写入 0x02。 | 官方源码确认；17/29 步配对样本均一致 |
| 27 | APG Offset 16–17 | Counter，按 big-endian 16-bit 写入；官方 serializer 从 11 开始，每条记录增加 14，并按 16-bit 回绕。 | 官方源码确认；17/29 步配对样本均一致 |
| 28 | 摇杆编码：输入范围 | JSON/editor 的摇杆 value 是 0–100 百分比，不是 APG 原始轴值，也不是 0–2047 的整数。 | 官方 29 步 JSON 与本地界面确认 |
| 29 | 摇杆编码：百分比转轴偏移 | m = round(value × 2047 / 100)。轴中性值为 2048；RIGHT/UP 使用 2048+m，LEFT/DOWN 使用 2048−m。 | 官方 29 步 APG 满量程值及本地 JSON→APG 字节级对照确认 |
| 30 | 摇杆解码：轴偏移转百分比 | value ≈ abs(axis−2048) × 100 / 2047；结果可按 UI 精度舍入。APG 量化后，非满量程值不保证恢复原始小数。 | 本地解码实现与 25/50/75/100 回归测试确认 |
| 31 | 摇杆满量程样本 | 100% 对应轴端点 4095 或 1；中性值为 2048。29 步样本覆盖左右摇杆四个基本方向。 | 29 步配对 APG 样本确认 |
| 32 | 摇杆方向冲突 | 同一步若包含同一轴的冲突方向，serializer 按 sticks 数组顺序赋值，后处理的方向会覆盖先前赋值。 | 官方源码当前分支确认 |
| 33 | 摇杆斜向 | 当前已审计 serializer 分支明确处理四个基本方向；不得假定斜向会自动拆成两个轴方向。 | 官方源码当前分支确认；斜向实际导出仍待独立样本验证 |
| 34 | ABXY 位掩码 | Byte 12：PC 布局 A=0x02、B=0x01、X=0x08、Y=0x04；Switch 布局 A=0x01、B=0x02、X=0x04、Y=0x08。 | 官方源码确认；29 步样本与 Switch 分支相符 |
| 35 | 其他按键位掩码 | Byte 12：LB=0x10、RB=0x20、LT=0x40、RT=0x80。Byte 13：R3=0x01、L3=0x02、START=0x04、SELECT=0x08、HOME=0x10。 | 官方源码与样本确认 |
| 36 | D-pad APG 编码 | Neutral=0；UP=1、UP_RIGHT=2、RIGHT=3、DOWN_RIGHT=4、DOWN=5、DOWN_LEFT=6、LEFT=7、UP_LEFT=8。 | 官方源码与 29 步样本确认 |
| 37 | D-pad JSON 标签 | UP=↑、DOWN=↓、LEFT=←、RIGHT=→、UP_LEFT=↖、UP_RIGHT=↗、DOWN_LEFT=↙、DOWN_RIGHT=↘。 | 官方 29 步 JSON 样本确认 |
| 38 | D-pad JSON 坐标 | UP=(row 0,col 2)；DOWN=(2,2)；LEFT=(1,0)；RIGHT=(1,4)；UP_LEFT=(0,0)；UP_RIGHT=(0,4)；DOWN_LEFT=(2,0)；DOWN_RIGHT=(2,4)。 | 官方 29 步 JSON 样本确认 |
| 39 | 空白延时的 APG 状态 | 空白延时输出中性摇杆轴 2048、LT/RT=0、按键掩码=0、D-pad=0。 | 官方源码及 Auto.apg 样本确认 |
| 40 | 延时反推限制 | 对 n 条记录，符合 ceil(delay_ms×79/1000)=n 的正整数毫秒范围为 floor((n−1)×1000/79)+1 至 floor(n×1000/79)。16 条记录对应 190–202 ms，不能仅凭 APG 断言原始延时一定是 200 ms。 | 由官方源码公式数学推导 |
| 41 | APG 解码步骤边界 | 本地 decoder 将相邻且控制状态相同的记录合并为候选 run；相邻原始步骤若状态相同，二进制中可能无法区分。 | 本地实现行为确认；不是精确恢复原始宏步骤 |
| 42 | APG 原始字节保留 | 本地 decoder 保留原始 18-byte records、尾部字节及不足 18 bytes 的 fragment；未修改的来源记录在分段重建中可逐字节复制。 | 本地实现与 Chromium E2E 测试确认 |
| 43 | APG 记录范围检测 | 本地自动检测是启发式：要求对齐的均匀 0xFF/0x67 尾部，以及前缀记录 marker 恒定、Counter 固定模 65536 步进；检测不唯一时应要求用户给出 recordCount。 | 本地实现与合成测试确认；不是通用 APG 终止符规范 |
| 44 | APG 未知字段与尾部 | 未确认的字节不得擅自改写或丢弃；无法可靠判断记录边界时应保留原始数据并给出警告。 | 项目数据保全要求 |
| 45 | 29 步配对样本：文件身份 | Official.29steps.apg 大小 1,048,576 bytes；Git blob SHA-1=196a5ca439aab90dc8997721fe4c1e4a26c2280f；SHA-256=c51b5b280ac4ba442b8cd8327c4b2068ed13efbb08a80293c3dc97ae194b5c07。 | GitHub Actions 直接读取二进制并校验 Git blob SHA |
| 46 | 29 步配对样本：有效记录区 | 前 464 条记录为有效连续记录，共 8,352 bytes；其后 1,040,224 bytes 全部为 0xFF。 | 对该文件逐字节扫描；仅对该样本成立 |
| 47 | 29 步配对样本：Marker/Counter | 464 条有效记录的 byte 15 均为 0x02；Counter 从 11 起每条 +14，最后一条为 6493；全部 463 个相邻差值一致。 | 官方 29 步 APG 二进制扫描报告 |
| 48 | 29 步配对样本：步骤与记录数 | JSON 有 29 步，每步 delay=200 ms；按官方公式每步 16 条记录，总计 464 条。 | JSON 与 APG 二进制交叉核对 |
| 49 | 29 步配对样本：控制状态 | 样本覆盖 LT/RT、LB/RB、左右摇杆四个基本方向、L3/R3、SELECT/START/HOME、A/B/X/Y、D-pad 八方向。满量程摇杆值为 4095 或 1。 | 官方 JSON 与 APG 逐步状态报告交叉核对 |
| 50 | 29 步配对样本：ABXY | A/B/X/Y 的 byte 12 值分别为 0x01/0x02/0x04/0x08，与 Switch 布局一致。 | 官方配对样本确认 |
| 51 | APG 容器尾部 | 官方 serializer 将有效记录区之后的全部字节填为 0xFF，直至 1 MiB 容器结束。 | 官方源码确认；17/29 步配对样本均一致 |
| 52 | 样本 profile | 17/29 步精确动作签名 profile 仅保留作历史样本审计测试；正式编辑器导出不再调用 profile 检测，也不以步数或动作签名作为导出条件。 | 当前 app.mjs 不导入 profile 模块；本地代码检查 |
| 53 | JSON→APG 配对导出（本地自动化） | 17/29 步官方 JSON 通过通用 encoder 导出，并与配对官方 APG 做逐字节比较；等待本轮 GitHub Actions 最终结果。 | 新增通用导出 E2E；CI 状态以最新 Run 为准 |
| 54 | 任意步数导出 | JSON 导出路径不检查固定步数、不要求动作签名匹配；每一步直接按自身 delay 和动作状态生成记录。 | editor/app.mjs 与 codec/apg-codec.mjs 当前实现；CI 待确认 |
| 55 | 本地动作模型 | codec/action-model.mjs 统一普通步骤、空白延时、JSON normalize、逐步延时更新和 JSON 导出；默认新步骤 200 ms，导入 delay 不应被静默重置，未知 JSON 字段应保留。 | 本地实现与测试 |
| 56 | APG Encoder/Decoder | codec/apg-codec.mjs 实现 18-byte 编码、1 MiB 容器、摇杆/扳机/按键/D-pad、PC/Switch 布局；默认自动采用官方 Marker=0x02、Counter 起点=11/步进=14、尾部 0xFF，并允许显式覆盖供特殊变体测试。 | 官方 serializer 源码与两组配对样本；本地实现 |
| 57 | APG→编辑模型 | codec/apg-to-model.mjs 将记录 run 转为可编辑 JSON 形状，并保留来源记录范围、原始记录和延时可行区间；这是推断模型，不是精确恢复。 | 本地实现与测试 |
| 58 | APG 重建 | codec/apg-rebuild.mjs 与 codec/apg-edit-rebuild.mjs 支持组合原始记录区段和重新编码步骤；未修改区段可原样复制，修改/新增步骤重新编码，删除步骤不输出。尾部随记录区移动；容量不足时必须报告截断。 | 本地实现与自动化测试；依赖正确来源区段/profile |
| 59 | 固定记录修补 | codec/apg-record-patcher.mjs 可在固定记录布局下修改指定记录；不支持插入/删除记录或改变步骤延时。 | 本地实现与测试 |
| 60 | 离线网页编辑器 | editor/ 支持 APG/JSON 导入、动作/空白延时新增删除、清空、排序、每步延时、按键/D-pad/扳机/四方向摇杆力度编辑、JSON/APG 导出。 | 本地实现；以 browser E2E 和 smoke test 覆盖范围为准 |
| 61 | 摇杆 UI 输入 | 编辑器摇杆力度输入范围为 0–100%，步进 1；标签显示百分比。 | editor/app.mjs 当前实现 |
| 62 | Windows 桌面封装 | Electron + NSIS Windows x64 安装程序；renderer 使用 contextIsolation、sandbox，Node integration 关闭；本地资源服务绑定 127.0.0.1。 | desktop/main.cjs 与 package.json；CI 构建成功不等于用户设备验收 |
| 63 | 设备连接/写入 | 当前程序不支持通过 USB 或 Bluetooth 将宏写入控制器。 | 当前产品范围 |
| 64 | 最新 CI 与 Windows 构建 | 提交 `759d1d98500f2e07132d863198845af3461d03c3` 的 APG codec workflow 通过：Chromium E2E 5/5、Node tests 58/58；Windows x64 NSIS 构建成功并上传 Artifact `GuliKit-APG-Editor-Windows-x64`，Artifact ID `14719135987`，ZIP 大小 111,387,602 bytes，SHA-256 `b308373170a07f4b58e247717bafab687664b9e3eb4e67095237a38cbdc0644f`，有效期至 2026-12-05 18:14:51 UTC。 | Run [44934334389](https://github.com/ankpsx/gulikit-source/actions/runs/44934334389)；Windows 构建 Run [44934334346](https://github.com/ankpsx/gulikit-source/actions/runs/44934334346)。runner 构建成功不等于用户电脑实机安装验收 |
| 65 | 官方网页实际导入验收 | 用户已实际在 GuliKit 官方网页导入本项目导出的 29 步 JSON，并确认导入验收成功；本轮验收目标为摇杆力度与 D-pad 八方向箭头在官方网页中正确显示。 | 用户实际操作反馈；属于官方网页人工验收，尚未包含控制器硬件执行/回放验证 |
| 66 | 官方 JSON→APG 通用导出 | 已实现通用导出路径：不论步骤数量，按每步 ceil(delay_ms×79/1000) 生成 18-byte 记录；自动写入 Marker=0x02、Counter=11/+14/16-bit 回绕、1 MiB 容器与 0xFF 尾部，不再要求用户填写元数据或匹配固定步数 profile。网页 JSON 不含 ABXY 配置，界面默认 Switch（与 17/29 步官方配对样本一致），仍保留 PC/Switch 切换；超出 1 MiB 容量时界面显示截断警告。 | 官方源码确认通用序列化规则；17/29 步配对文件字节级比较通过，37 步任意长度浏览器 E2E 通过；CI Run 44938706631：Chromium E2E 7/7、Node tests 60/60 |
| 67 | 17 步配對樣本 | Official.17steps.json 共 17 步；配对 APG SHA-256=4e00caeb6de9ce6cdb30dd667de6af09a27ff619ec888316d3b3f6dc19049373；有效记录 777 条；尾部 1,034,590 bytes 为 0xFF；与通用 encoder 导出逐字节一致。 | 官方 JSON/APG 配对样本与本地 CI 测试确认；仅作为回归样本，不是固定步数限制 |

## 3. 已确认的摇杆换算规则（重点）

必须区分“JSON 百分比”和“APG 轴值”：

- JSON/editor 的 `value` 是 0–100 的力度百分比。
- 编码时先算 `m = Math.round(value * 2047 / 100)`。
- 中性轴为 2048；RIGHT/UP 为 `2048 + m`，LEFT/DOWN 为 `2048 - m`。
- 解码时按 `Math.abs(axis - 2048) * 100 / 2047` 反算近似百分比。
- 100% 的端点是 4095 或 1；不能把 `2047 / 100` 当作编码乘数的倒数。
- 本规则已用 29 步配对 APG 的四个左摇杆方向和四个右摇杆方向核对；25/50/75/100% 的本地回归测试另行覆盖解码近似值。

## 4. 官方配对样本的审计参数（仅作测试证据，不是导出限制）

| 项目 | 已验证值 |
|---|---:|
| JSON 文件 | `verification/apg-sample-validator/Official.29steps.json` |
| APG 文件 | `verification/apg-sample-validator/Official.29steps.apg` |
| APG 文件大小 | 1,048,576 bytes |
| SHA-256 | `c51b5b280ac4ba442b8cd8327c4b2068ed13efbb08a80293c3dc97ae194b5c07` |
| JSON 步骤数 | 29 |
| 每步 delay | 200 ms |
| 每步 APG 记录数 | 16 |
| 有效 APG 记录总数 | 464 |
| 有效记录区长度 | 8,352 bytes |
| Marker | `0x02` |
| Counter 起始值 | 11 |
| Counter 步进值 | 14 |
| 最后一条 Counter | 6493 |
| ABXY 布局 | Switch |
| 尾部填充 | `0xFF` |
| 尾部长度 | 1,040,224 bytes |

以上数值仅描述 29 步配对样本。17 步配对样本另有 777 条有效记录、Marker=0x02、Counter=11/+14、Switch ABXY 与 0xFF 尾部；这两组样本共同用于回归测试。Marker、Counter 与尾部填充现已由官方 serializer 源码确认是生成器规则，不再视为需要样本 profile 的未知参数。ABXY 配置不在官方 JSON 顶层字段中，因此编辑器采用 Switch 默认值（与两组配对样本一致），并允许用户在需要时切换 PC。

## 5. 通用 JSON→APG 要求与目前未完成的验收

1. **通用官方 JSON→APG 导出**：第一版通用实现已通过 CI：Chromium E2E 7/7、Node tests 60/60；17/29 步配对 APG 均逐字节一致，37 步任意长度 JSON 的浏览器导出通过。导出不匹配固定步数 profile，不要求手动填写 Marker/Counter/尾部填充；超出 1 MiB 时会提示截断。仍需由用户将新程序生成的任意步数 APG 导入官方网页实测。ABXY 是 JSON 未包含的外部配置，当前默认 Switch，PC 可切换；不能声称程序可从 JSON 自动识别该字段。
2. **Windows 用户实机验收**：GitHub Windows runner 构建成功不等于用户电脑安装、启动和导入导出成功；仍需用户实际安装验收。
3. **APG 元数据与尾部通用规则**：官方网页 serializer 源码现已确认 Marker=0x02、Counter 起点 11/每条 +14（16-bit 回绕）、尾部 0xFF；17/29 两组配对样本一致。若未来出现其他网页版本/固件变体，再按新证据扩展，不得覆盖当前已确认规则。
4. **斜向摇杆**：官方 serializer 当前已审计分支没有明确的斜向合成逻辑；需要官方 UI 导出样本。
5. **损坏/未知格式文件**：需继续验证未知 marker、未知 D-pad、截断文件、非对齐尾部、Counter 中断等情况的警告和保留策略。
6. **USB/Bluetooth 写入**：当前不支持，不得在界面或说明中暗示已支持。

## 6. 项目文件索引

- `codec/action-model.mjs`：共享动作模型与 JSON normalize/export。
- `codec/apg-codec.mjs`：APG 18-byte encoder、低级 decoder。
- `codec/apg-to-model.mjs`：APG 记录 run 转可编辑模型、摇杆百分比反推、D-pad descriptor。
- `codec/apg-metadata-profiles.mjs`：历史样本签名审计工具；当前编辑器 JSON→APG 导出不再依赖此模块。
- `codec/apg-range-detect.mjs`：APG 有效记录范围启发式检测。
- `codec/apg-record-patcher.mjs`：固定布局记录修补。
- `codec/apg-rebuild.mjs`：分段重建。
- `codec/apg-edit-rebuild.mjs`：基于 APG provenance/baseline 的编辑重建计划。
- `editor/`：离线网页编辑器与浏览器 E2E。
- `desktop/`：Electron 桌面封装。
- `verification/apg-sample-validator/Official.29steps.json` 与 `Official.29steps.apg`：29 步配对官方样本。
- `verification/apg-sample-validator/inspect-29steps-apg.mjs`：对原始 29 步 APG 做 SHA、记录范围、Marker/Counter、尾部和逐步状态审计。

## 7. 维护规则

- 本文件是唯一技术知识库；结论集中维护在第 2 节总表，不按研究日期不断追加重复章节。
- 新证据推翻旧规则时，直接删除错误规则并更新相关表格、公式、未完成事项和文件索引；不保留会误导下一次开发的旧说法。
- 官方 JSON→APG：通用编码器自动按每步延时与动作状态生成任意步数 APG；禁止将固定步数或单一样本 profile 作为导出门槛。
- 每条结论必须标明证据范围；单样本事实必须写清楚“仅适用于该样本”。
- 源码、单元测试、Chromium E2E、官方网页人工验收、Windows 用户实机验收分别记录，不得混为一谈。
- 修改知识库前核对当前源码、样本和 CI；不得根据历史摘要复制已经过时的测试统计、Artifact 编号或状态。
