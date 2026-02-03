# 在 HBuilderX 中创建新项目并迁移代码

## 🎯 为什么要这样做

当前项目是 CLI 项目，npm 依赖安装一直失败。
创建 HBuilderX 原生项目可以避免所有 npm 依赖问题。

---

## 📋 详细步骤

### 第一步：在 HBuilderX 中创建新项目

1. **打开 HBuilderX**

2. **点击菜单**：文件 -> 新建 -> 项目

3. **选择项目类型**：
   - 选择：**uni-app**
   - 项目名称：`yixinjr-h5`
   - 项目位置：`d:\workcode\miniapp\`
   - 模板：**默认模板**（或 Hello uni-app）

4. **点击"创建"**

5. **等待项目创建完成**

---

### 第二步：复制现有代码

#### 1. 复制页面文件

```powershell
# 复制 pages 目录
Copy-Item "d:\workcode\miniapp\uniapp-h5\pages\*" "d:\workcode\miniapp\yixinjr-h5\pages\" -Recurse -Force
```

#### 2. 复制组件

```powershell
# 复制 components 目录
Copy-Item "d:\workcode\miniapp\uniapp-h5\components\*" "d:\workcode\miniapp\yixinjr-h5\components\" -Recurse -Force
```

#### 3. 复制工具类

```powershell
# 复制 utils 目录
Copy-Item "d:\workcode\miniapp\uniapp-h5\utils\*" "d:\workcode\miniapp\yixinjr-h5\utils\" -Recurse -Force
```

#### 4. 复制静态资源

```powershell
# 复制 static 目录
Copy-Item "d:\workcode\miniapp\uniapp-h5\static\*" "d:\workcode\miniapp\yixinjr-h5\static\" -Recurse -Force
```

#### 5. 复制配置文件

手动复制以下文件的内容：

**pages.json**：
- 从：`d:\workcode\miniapp\uniapp-h5\pages.json`
- 到：`d:\workcode\miniapp\yixinjr-h5\pages.json`

**manifest.json**：
- 从：`d:\workcode\miniapp\uniapp-h5\manifest.json`
- 到：`d:\workcode\miniapp\yixinjr-h5\manifest.json`
- 只复制 `h5` 配置部分

**App.vue**：
- 从：`d:\workcode\miniapp\uniapp-h5\App.vue`
- 到：`d:\workcode\miniapp\yixinjr-h5\App.vue`

**main.js**：
- 从：`d:\workcode\miniapp\uniapp-h5\main.js`
- 到：`d:\workcode\miniapp\yixinjr-h5\main.js`

---

### 第三步：在 HBuilderX 中构建

1. **在 HBuilderX 中打开新项目**：`yixinjr-h5`

2. **点击菜单**：发行 -> 网站-H5手机版

3. **等待构建完成**（应该很快，1-2 分钟）

4. **查看构建产物**：
   ```
   d:\workcode\miniapp\yixinjr-h5\unpackage\dist\build\h5\
   ```

---

### 第四步：复制到后端项目

```powershell
# 清空旧的 static 目录
Remove-Item "d:\workcode\miniapp\src\main\resources\static\*" -Recurse -Force

# 复制新的前端文件
Copy-Item "d:\workcode\miniapp\yixinjr-h5\unpackage\dist\build\h5\*" "d:\workcode\miniapp\src\main\resources\static\" -Recurse -Force
```

---

### 第五步：打包后端

```bash
cd d:\workcode\miniapp
mvn clean package -DskipTests
```

---

### 第六步：启动并访问

```bash
java -jar target\yixinjr-dev.jar
```

访问：`http://localhost:8081/`

---

## 🎉 优势

### HBuilderX 原生项目 vs CLI 项目

| 特性 | HBuilderX 项目 | CLI 项目 |
|------|---------------|----------|
| 需要 Node.js | ❌ 不需要 | ✅ 需要 |
| 需要 npm install | ❌ 不需要 | ✅ 需要 |
| node_modules | ❌ 没有 | ✅ 有（1000+ 包）|
| 构建速度 | ✅ 快 | ⚠️ 慢 |
| 依赖问题 | ✅ 无 | ❌ 经常有 |
| HBuilderX 支持 | ✅ 完美 | ⚠️ 需要配置 |

---

## 💡 为什么之前说不需要 npm

我之前说的是 **HBuilderX 原生项目** 不需要 npm，但您的项目是 **CLI 项目**，所以需要。

现在创建新的 HBuilderX 原生项目，就真的不需要 npm 了！

---

## 📝 总结

1. ❌ 当前 CLI 项目的 npm 依赖无法正确安装
2. ✅ 创建 HBuilderX 原生项目可以避免所有依赖问题
3. ✅ 只需要复制代码文件，不需要 node_modules
4. ✅ 构建速度更快，更稳定

**这是真正一次性解决所有问题的方案！** 🎉

