# Windows 安装程序下载

## 最新 Windows x64 安装包

- 产品：GuliKit APG Editor 0.1.0
- 平台：Windows x64
- 构建工作流：[Windows desktop installer — Run 44942886837](https://github.com/ankpsx/gulikit-source/actions/runs/44942886837)
- Artifact 名称：\`GuliKit-APG-Editor-Windows-x64\`
- Artifact ID：\`14722920216\`
- ZIP 大小：111,388,357 bytes
- ZIP SHA-256：\`7c66fb0294721a4c91afd08a51b24afe0beb0b9c17c4d88240c2cfa131ca747f\`
- Artifact 到期时间：2026-12-05 19:49:55 UTC

### 下载步骤

1. 打开上方 GitHub Actions 运行记录。
2. 登录 GitHub。
3. 在页面底部 **Artifacts** 区域下载 \`GuliKit-APG-Editor-Windows-x64\`。
4. 解压 ZIP。
5. 运行其中的 \`GuliKit-APG-Editor-0.1.0-Windows-x64.exe\` 安装。

### 完整性校验

下载 ZIP 后，可在 PowerShell 执行：

\`\`\`powershell
Get-FileHash .\\GuliKit-APG-Editor-Windows-x64.zip -Algorithm SHA256
\`\`\`

预期 ZIP SHA-256：

\`7c66fb0294721a4c91afd08a51b24afe0beb0b9c17c4d88240c2cfa131ca747f\`

此哈希是 GitHub Actions Artifact ZIP 的哈希，不是解压后 EXE 的哈希。

## 正式 GitHub Release（长期下载）

仓库已配置按版本 Tag 自动发布 Windows 安装程序：

1. 确认 `package.json` 中的版本号。
2. 在该版本对应的最新 main commit 上创建版本 Tag，例如 `v0.1.0`。
3. 推送 Tag：`git push origin v0.1.0`。
4. GitHub Actions 自动在 Windows runner 上执行 `npm run dist`。
5. 构建成功后，自动创建 GitHub Release，并将 `GuliKit-APG-Editor-<version>-Windows-x64.exe` 上传为 Release asset。

正式发布页：[GitHub Releases](https://github.com/ankpsx/gulikit-source/releases/latest)。

注意：仅普通分支构建会生成短期 Actions Artifact；只有推送符合 `v*` 格式的 Tag 才会创建正式 Release。请勿重复使用已发布的版本 Tag。

## 重要说明

- Actions Artifact 有保存期限，不是永久下载地址。到期后需重新运行 Windows installer workflow。
- CI 构建成功不等于已在用户电脑实机安装和验收。
- 本程序目前是 APG/JSON 离线文件编辑器，不支持通过 USB/Bluetooth 写入或回放控制器宏。
- 如需长期发布，应创建 GitHub Release 并上传经过用户验收的安装程序。
