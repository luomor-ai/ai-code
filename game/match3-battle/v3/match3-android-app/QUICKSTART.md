# 🚀 Android App 快速开始指南

## 最快 5 步开始开发

### 1️⃣ 安装必需软件

- **Node.js**: https://nodejs.org/ (LTS 版本)
- **JDK 11**: https://adoptium.net/
- **Android Studio**: https://developer.android.com/studio

### 2️⃣ 配置 Android 环境

安装 Android Studio 后，打开 SDK Manager 确保安装：
- ✅ Android SDK Platform 30+
- ✅ Android SDK Build-Tools
- ✅ Android Emulator

### 3️⃣ 安装项目依赖

```bash
cd match3-android-app
npm install
```

### 4️⃣ 配置服务器地址

编辑 `src/context/WebSocketContext.js`：

```javascript
// 改为你的服务器地址
const WS_URL = 'ws://192.168.1.100:3000';
```

💡 提示：使用 `ipconfig`(Windows) 或 `ifconfig`(Mac/Linux) 查看 IP

### 5️⃣ 运行应用

**使用真机：**
```bash
# 1. 手机开启 USB 调试
# 2. USB 连接手机
# 3. 运行
npm run android
```

**使用模拟器：**
```bash
# 1. Android Studio → AVD Manager → 启动模拟器
# 2. 运行
npm run android
```

## 🎯 完成！

应用将自动安装到设备并启动。

---

## 📦 打包 APK (可选)

```bash
cd android
./gradlew assembleDebug
```

APK 位置: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## ❓ 遇到问题？

### Metro 缓存问题
```bash
npm start -- --reset-cache
```

### Android 构建问题
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 无法连接设备
```bash
adb devices          # 查看设备
adb kill-server      # 重启 ADB
adb start-server
```

---

## 📚 更多信息

查看完整文档：`README.md`

---

**祝开发愉快！** 🎉
