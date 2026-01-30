# 📱 一键打包 APK 指南

## 🎯 目标
从零开始，10 分钟内生成可安装的 APK 文件。

## 📋 准备清单

### 必需软件（按顺序安装）

1. **Node.js** ✅
   - 下载: https://nodejs.org/
   - 选择 LTS 版本
   - 默认安装即可

2. **Java JDK 11** ✅
   - 下载: https://adoptium.net/
   - 选择 JDK 11 (LTS)
   - 记住安装路径

3. **Android Studio** ✅
   - 下载: https://developer.android.com/studio
   - 完整安装（包含 SDK）
   - 打开一次，完成初始化

---

## 🚀 快速打包步骤

### 步骤 1: 配置环境变量

**Windows 用户:**

1. 右键"此电脑" → 属性 → 高级系统设置 → 环境变量
2. 新建系统变量:
   ```
   变量名: ANDROID_HOME
   变量值: C:\Users\你的用户名\AppData\Local\Android\Sdk
   ```
3. 编辑 Path 变量，添加:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   ```

**Mac/Linux 用户:**

在终端执行:
```bash
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc
```

### 步骤 2: 安装项目依赖

打开终端/命令提示符:

```bash
# 进入项目目录
cd match3-android-app

# 安装依赖（首次需要 5-10 分钟）
npm install
```

### 步骤 3: 修改服务器地址

1. 打开文件: `src/context/WebSocketContext.js`
2. 找到第 28 行左右:
   ```javascript
   const WS_URL = 'ws://192.168.1.100:3000';
   ```
3. 改为你的服务器地址（保持引号）

💡 如何找服务器 IP？
- Windows: 打开 cmd，输入 `ipconfig`
- Mac/Linux: 打开终端，输入 `ifconfig`

### 步骤 4: 打包 APK

```bash
# 进入 android 目录
cd android

# Windows 用户
gradlew assembleDebug

# Mac/Linux 用户
./gradlew assembleDebug
```

⏳ 首次打包需要下载依赖，约 5-10 分钟。请耐心等待...

### 步骤 5: 找到你的 APK

打包完成后，APK 文件位于:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

🎉 **恭喜！** 这就是你的 Android 应用！

---

## 📲 安装 APK

### 方法 1: USB 安装

1. 手机连接电脑（USB）
2. 手机开启 USB 调试
3. 终端执行:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### 方法 2: 直接传输

1. 将 `app-debug.apk` 复制到手机
2. 手机上找到文件
3. 点击安装（需允许未知来源）

---

## 🔧 常见错误解决

### 错误 1: "ANDROID_HOME 未设置"
**解决**: 重新配置环境变量（见步骤 1），然后**重启终端**

### 错误 2: "SDK location not found"
**解决**: 
```bash
# 创建 local.properties 文件
# Windows
echo sdk.dir=C:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk > android/local.properties

# Mac/Linux
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

### 错误 3: "License not accepted"
**解决**:
```bash
cd android
sdkmanager --licenses
# 一路输入 'y' 接受许可
```

### 错误 4: 打包很慢
**正常现象**: 首次打包需下载 Gradle 和依赖，约 5-10 分钟。
**加速**: 配置国内镜像（可选）

---

## 🎨 生成正式版 APK（发布用）

### 1. 生成签名密钥

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

按提示输入信息，**记住密码**！

### 2. 配置签名

在 `android/gradle.properties` 添加:

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=你的密码
MYAPP_RELEASE_KEY_PASSWORD=你的密码
```

### 3. 打包 Release APK

```bash
cd android
./gradlew assembleRelease
```

生成的 APK:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📊 APK 大小优化

Release 版本会自动压缩，通常比 Debug 小 30-50%。

**典型大小:**
- Debug APK: ~30-40 MB
- Release APK: ~20-25 MB

---

## 🆘 需要帮助？

1. 查看完整文档: `README.md`
2. 检查错误日志
3. Google 搜索错误信息
4. GitHub Issues

---

## ✅ 打包成功检查清单

- [ ] Node.js 已安装（`node --version`）
- [ ] JDK 已安装（`java -version`）
- [ ] Android SDK 已安装
- [ ] ANDROID_HOME 已配置
- [ ] npm install 成功
- [ ] gradlew assembleDebug 成功
- [ ] APK 文件存在
- [ ] APK 可以安装

---

**Happy Coding!** 🎉
