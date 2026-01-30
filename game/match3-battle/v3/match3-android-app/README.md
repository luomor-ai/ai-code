# 消消乐对战 - Android App

基于 React Native 开发的多人实时对战消消乐 Android 应用。

## 📱 应用特性

### 核心功能
- ✅ **完整三消游戏**：8x8 棋盘，6 种宝石颜色
- ✅ **实时对战**：WebSocket 实时同步游戏状态
- ✅ **房间系统**：创建/加入/随机匹配
- ✅ **即时聊天**：房间内实时文字和表情交流
- ✅ **原生体验**：流畅的原生 Android 应用体验

### 技术栈
- **React Native 0.72.6**
- **React Navigation**：页面导航
- **WebSocket**：实时通信
- **React Native Linear Gradient**：渐变效果
- **React Native Vector Icons**：图标库

## 🚀 开发环境配置

### 系统要求

#### Windows
- Windows 10 或更高版本
- Node.js 14 或更高版本
- JDK 11 (推荐 OpenJDK 11)
- Android Studio
- Android SDK (API Level 21+)

#### macOS
- macOS 10.13 或更高版本
- Node.js 14 或更高版本
- Xcode 12 或更高版本
- Android Studio (用于 Android 开发)
- JDK 11

#### Linux
- Ubuntu 18.04+ / Debian 10+
- Node.js 14 或更高版本
- JDK 11
- Android Studio
- Android SDK

### 安装步骤

#### 1. 安装 Node.js

访问 https://nodejs.org/ 下载并安装 LTS 版本。

验证安装：
```bash
node --version
npm --version
```

#### 2. 安装 JDK 11

**Windows/macOS:**
下载并安装 OpenJDK 11: https://adoptium.net/

**Linux:**
```bash
sudo apt update
sudo apt install openjdk-11-jdk
```

验证安装：
```bash
java -version
```

#### 3. 安装 Android Studio

1. 下载 Android Studio: https://developer.android.com/studio
2. 安装并打开 Android Studio
3. 选择 "Standard" 安装类型
4. 确保以下组件已安装：
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device

#### 4. 配置环境变量

**Windows:**
```
ANDROID_HOME = C:\Users\你的用户名\AppData\Local\Android\Sdk
PATH 添加: %ANDROID_HOME%\platform-tools
PATH 添加: %ANDROID_HOME%\emulator
PATH 添加: %ANDROID_HOME%\tools
PATH 添加: %ANDROID_HOME%\tools\bin
```

**macOS/Linux:**
在 `~/.bash_profile` 或 `~/.zshrc` 中添加：
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

重新加载配置：
```bash
source ~/.bash_profile  # 或 source ~/.zshrc
```

验证配置：
```bash
adb --version
```

#### 5. 安装项目依赖

```bash
# 进入项目目录
cd match3-android-app

# 安装 npm 依赖
npm install

# 安装 iOS 依赖 (仅 macOS)
cd ios && pod install && cd ..
```

## 📲 运行应用

### 使用真机调试

#### Android
1. 在手机上启用开发者选项和 USB 调试
2. 用 USB 连接手机到电脑
3. 运行以下命令：

```bash
# 检查设备连接
adb devices

# 运行应用
npm run android
```

#### iOS (仅 macOS)
1. 用 USB 连接 iPhone 到 Mac
2. 在 Xcode 中信任设备
3. 运行以下命令：

```bash
npm run ios
```

### 使用模拟器

#### Android 模拟器
1. 打开 Android Studio
2. AVD Manager → Create Virtual Device
3. 选择设备型号 (推荐 Pixel 4)
4. 选择系统镜像 (API Level 30+)
5. 启动模拟器
6. 运行应用：

```bash
npm run android
```

#### iOS 模拟器 (仅 macOS)
```bash
npm run ios
```

## 🔧 配置 WebSocket 服务器地址

在 `src/context/WebSocketContext.js` 中修改服务器地址：

```javascript
// 本地测试
const WS_URL = 'ws://localhost:3000';

// 局域网测试（使用电脑 IP）
const WS_URL = 'ws://192.168.1.100:3000';

// 生产环境
const WS_URL = 'wss://your-domain.com';
```

**如何查找电脑 IP 地址：**

**Windows:**
```cmd
ipconfig
```

**macOS/Linux:**
```bash
ifconfig
# 或
ip addr show
```

## 📦 打包 APK

### Debug 版本

```bash
cd android
./gradlew assembleDebug
```

生成的 APK 位于：
`android/app/build/outputs/apk/debug/app-debug.apk`

### Release 版本

1. 生成签名密钥：

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. 在 `android/gradle.properties` 中添加：

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=你的密码
MYAPP_RELEASE_KEY_PASSWORD=你的密码
```

3. 打包：

```bash
cd android
./gradlew assembleRelease
```

生成的 APK 位于：
`android/app/build/outputs/apk/release/app-release.apk`

## 🎮 使用说明

### 游戏模式

1. **创建房间**
   - 输入昵称
   - 获取 6 位房间号
   - 分享给朋友

2. **加入房间**
   - 输入房间号
   - 输入昵称
   - 等待开始

3. **随机匹配**
   - 自动生成昵称
   - 系统匹配对手

### 游戏规则

- 点击宝石选择
- 点击相邻宝石交换
- 横向/纵向 3 个相同即消除
- 每个宝石 10 分
- 60 秒限时对战
- 分高者获胜

## 🔍 常见问题

### Q: Metro bundler 启动失败？
```bash
# 清理缓存
npm start -- --reset-cache

# 或
npx react-native start --reset-cache
```

### Q: Android 构建失败？
```bash
# 清理 Android 构建
cd android
./gradlew clean
cd ..

# 重新构建
npm run android
```

### Q: 真机无法连接？
```bash
# 检查 ADB 连接
adb devices

# 重启 ADB
adb kill-server
adb start-server
```

### Q: WebSocket 无法连接？
1. 确保服务器已启动
2. 确认 IP 地址正确
3. 检查防火墙设置
4. Android 9+ 需要允许明文流量（已在 AndroidManifest.xml 中配置）

### Q: 应用闪退？
```bash
# 查看日志
adb logcat | grep ReactNative

# 或在 Chrome 开发者工具中查看
# 手机摇晃 → Debug → 打开 Chrome DevTools
```

## 📝 项目结构

```
match3-android-app/
├── android/                  # Android 原生代码
│   └── app/
│       ├── build.gradle
│       └── src/main/
│           ├── AndroidManifest.xml
│           └── res/
├── ios/                      # iOS 原生代码 (可选)
├── src/
│   ├── context/
│   │   └── WebSocketContext.js  # WebSocket 管理
│   └── screens/
│       ├── MenuScreen.js        # 主菜单
│       ├── RoomScreen.js        # 房间页面
│       ├── GameScreen.js        # 游戏页面
│       └── ResultScreen.js      # 结果页面
├── App.js                    # 应用入口
├── index.js                  # 注册入口
├── package.json              # 依赖配置
└── README.md                 # 本文档
```

## 🚢 发布到 Google Play

1. 打包 Release APK (见上文)
2. 创建 Google Play 开发者账号
3. 创建应用
4. 上传 APK
5. 填写应用信息
6. 提交审核

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题请通过 GitHub Issues 联系。
