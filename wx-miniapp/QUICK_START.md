# 微信小程序快速开始指南

## 一、环境准备

### 1. 安装微信开发者工具
- 下载：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- 安装后使用微信扫码登录

### 2. 启动后端服务
```bash
# 在项目根目录执行
cd d:\workcode\miniapp
mvn spring-boot:run

# 或使用已编译的 jar
java -jar target/yixinjr-dev.jar
```

确保后端运行在：`http://localhost:8080`

## 二、打开小程序项目

### 1. 导入项目
1. 打开微信开发者工具
2. 点击"导入项目"
3. 选择目录：`d:\workcode\miniapp\wx-miniapp`
4. AppID：选择"测试号"（开发阶段）
5. 项目名称：`loan-miniapp`

### 2. 检查配置
打开 `project.config.json`，确保：
```json
{
  "setting": {
    "urlCheck": false  // 必须为 false，允许访问 localhost
  }
}
```

## 三、调试步骤

### 1. 打开调试器
- 点击底部"调试器"标签
- 或按 `F12` / `Ctrl + Shift + I`

### 2. 查看控制台
- 所有 `console.log` 输出会显示在 Console 标签
- 查看错误信息和警告

### 3. 查看网络请求
- 切换到 Network 标签
- 刷新页面或操作触发请求
- 查看请求详情和响应

### 4. 调试页面
- 在代码中设置断点（点击行号左侧）
- 或使用 `debugger;` 语句
- 程序会在断点处暂停

## 四、测试登录功能

### 1. 进入登录页
- 小程序启动后会自动进入登录页
- 或手动导航到：`pages/login/index`

### 2. 测试登录
- 用户名：`kwsy_zd_admin`
- 密码：`123456`
- 勾选"同意协议"
- 点击"账号登录"

### 3. 查看调试信息
在 Console 中会看到：
```
[REQUEST] { url: 'http://localhost:8080/auth/login', method: 'POST', ... }
[RESPONSE] { url: '...', statusCode: 200, data: {...} }
```

## 五、常见问题

### 问题1：无法连接后端
**现象：** 请求失败，提示网络错误

**解决：**
1. 检查后端是否启动：访问 http://localhost:8080/auth/public-key
2. 检查 `BASE_URL` 是否正确：`utils/request.js`
3. 检查 `urlCheck` 是否为 `false`

### 问题2：页面白屏
**现象：** 打开小程序后显示空白

**解决：**
1. 查看 Console 是否有错误
2. 检查 `app.json` 中的页面路径是否正确
3. 检查页面文件是否存在

### 问题3：数据不显示
**现象：** 页面显示但数据为空

**解决：**
1. 查看 Network 请求是否成功
2. 检查响应数据格式
3. 检查 `setData` 是否正确调用
4. 检查 WXML 数据绑定语法

## 六、调试技巧

### 1. 使用日志工具
```javascript
const logger = require('../../utils/logger');

logger.log('普通日志');
logger.error('错误日志');
logger.debug('调试日志');
logger.table(arrayData); // 表格显示
```

### 2. 在 Console 中执行代码
```javascript
// 查看当前页面数据
getCurrentPages()[getCurrentPages().length - 1].data

// 手动触发方法
getCurrentPages()[getCurrentPages().length - 1].loadOrders()

// 修改数据
getCurrentPages()[getCurrentPages().length - 1].setData({ test: 'value' })
```

### 3. 查看存储数据
- 调试器 → Storage 标签
- 或使用：`wx.getStorageInfoSync()`

## 七、真机调试

### 1. 预览
- 点击工具栏"预览"按钮
- 微信扫码在手机上查看

### 2. 真机调试
- 点击工具栏"真机调试"按钮
- 微信扫码
- 可以在开发者工具查看手机端日志

### 3. 远程调试
- 点击工具栏"远程调试"按钮
- 完全控制手机端小程序

## 八、项目结构

```
wx-miniapp/
├── miniprogram/
│   ├── app.json          # 小程序配置
│   ├── pages/            # 页面目录
│   │   ├── login/        # 登录页
│   │   ├── home/         # 首页
│   │   └── order/        # 订单相关页面
│   └── utils/            # 工具类
│       ├── request.js    # 请求封装
│       └── logger.js     # 日志工具
└── project.config.json   # 项目配置
```

## 九、下一步

1. 阅读 `DEBUG_GUIDE.md` 了解详细调试方法
2. 查看各页面代码了解功能实现
3. 根据需求修改和扩展功能

## 十、获取帮助

- 微信小程序官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
- 查看控制台错误信息
- 查看网络请求详情
- 参考 `DEBUG_GUIDE.md` 排查问题

