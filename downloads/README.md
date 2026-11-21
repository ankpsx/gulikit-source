# Windows 安装程序下载

本目录专门存放 GuliKit APG Editor 的 Windows 安装程序下载说明。

## 最新 Windows x64 安装包

**版本：** GuliKit APG Editor 0.1.0  
**文件：** `GuliKit-APG-Editor-0.1.0-Windows-x64.exe`  
**平台：** Windows 10/11 x64

### 下载

1. 打开本次构建的 [GitHub Actions 运行记录](https://github.com/ankpsx/gulikit-source/actions/runs/44916214821)。
2. 登录 GitHub。
3. 在页面底部的 **Artifacts** 区域，点击 `GuliKit-APG-Editor-Windows-x64` 下载 ZIP。
4. 解压 ZIP，运行其中的 `.exe` 安装程序。

> 注意：Actions Artifact 有保存期限，并非永久下载地址。该构建 Artifact 当前记录的到期时间为 2026-12-05。后续版本应优先发布到 GitHub Releases，以提供长期、稳定的安装包下载入口。

## 文件完整性

- 安装程序大小：111,387,232 bytes
- SHA-256：`bef6af99fecc88559c0329d871b4a35fe1a78709b617b1de6c4a59fa607dc0ec`
- Artifact ZIP 大小：111,385,141 bytes
- Artifact ZIP SHA-256：`f80a87623e645c5dacce5a26cb7a2e92ab8e13693d112ec2fe0451824e0b20ca`

下载后可在 PowerShell 中校验安装程序：

```powershell
Get-FileHash .\GuliKit-APG-Editor-0.1.0-Windows-x64.exe -Algorithm SHA256
```

## 说明

安装包体积约 106 MiB，超过 GitHub 普通 Git 仓库单文件 100 MiB 限制，因此不把二进制安装程序直接提交到 Git 历史中。本目录作为独立下载入口和校验信息页；安装包通过 GitHub Actions Artifact 提供。
