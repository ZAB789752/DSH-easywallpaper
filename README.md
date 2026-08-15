# dsh-wallpaper · DeepSeek Harness 壁纸插件（v1.0）

把任意图片或视频设为 DeepSeek Harness 页面的背景，支持裁剪、遮罩、字幕块与全套文字样式调节，并本地持久化。

> ⚠️ 非官方项目，与 DeepSeek 公司无关联。依赖 DeepSeek Harness Web 客户端运行时。

## 功能

- 🖼️ **上传背景（图片 / 视频）**：图片立即铺满页面（GIF 可动）；视频循环铺满（`object-fit: cover`），默认静音、可勾选「声音」开启，均可作为垫底层、不拦截点击
- ✂️ **裁剪适配页面（图片 / 视频）**：裁剪框锁定当前页面宽高比，可拖动、四角缩放；图片为 canvas 输出，视频为画面区域裁剪（不重编码）；遮罩只覆盖图片区域
- 🎚️ **遮罩滑块**：控制壁纸透出程度
- 🔤 **背景文字分区**（独立设置页）：
  - 字体（默认跟随 DSH / 方正粗体 / 黑体 / 微软雅黑 / 思源黑体 / 系统无衬线）
  - 字号（10–40px）、字间距（−2~12px）、行间距（1.0–2.5）
  - 描边：颜色 + 粗细（0–4px）+ 不透明度（0–100%）
  - 字色、底色（颜色选择器）、底色不透明度（0–100%，0% 即透明）
  - 未自定义的项自动跟随外观（浅色 = 白底黑字，深色 = 黑底白字）
- 🎛️ **两个「恢复默认」按钮**：背景分区整页还原；背景文字分区只还原文字样式
- 🎨 **面板灰度统一**：深色下侧边栏、输入栏、气泡、代码块、按钮、菜单统一深灰 `rgb(21,21,23)`；浅色统一白；字幕块与面板同色系、8px 倒角、表格无缝且有格线与外倒角
- 💾 **本地持久化**：图片/视频与全部设置存入浏览器 IndexedDB，刷新/重启自动恢复

## 环境要求

- DeepSeek Harness **Web 界面**（`dsh --profile web` 等 bundle 形态）
- 现代浏览器（需支持 CSS `:has()` 选择器：Chrome/Edge 105+、Safari 15.4+、Firefox 121+）

## 安装（三步）

1. **复制插件包**：把本仓库的 `package.json`、`index.js`、`client.js` 整体复制到

   ```
   <你的部署>\.dsh\profiles\web\node_modules\dsh-wallpaper\
   ```

   （目录不存在则新建；路径以你的 DSH 安装为准）

2. **追加组合补丁**：在 `<你的部署>\.dsh\profiles\web\cordis.patch.yml` 末尾加入（内容即 `cordis.patch.example.yml`）：

   ```yaml
   # dsh-wallpaper: 上传图片作为页面背景（持久客户端插件，浏览器启动即加载）。
   - insert:
       - id: dsh-wallpaper
         name: dsh-wallpaper
   ```

3. **重启应用**：重新启动 DeepSeek Harness，浏览器刷新后生效。

## 使用

打开 **设置 → 背景**（上传/裁剪/遮罩/恢复默认）与 **设置 → 背景文字**（字体/字号/间距/描边/颜色）。

## 卸载 / 回滚

1. 删除 `cordis.patch.yml` 中的 `dsh-wallpaper` insert 段
2. 删除 `node_modules\dsh-wallpaper` 目录
3. 重启应用

## 校验

```bash
node verify-wallpaper.mjs
```

检查 `dsh.client` 契约、host 半边加载、浏览器 bundle 注册与插件导出。

## 工作原理（简要）

- 浏览器端插件 = 宿主组合中的 loader 行，包声明 `dsh.client: { platform: 'web' }` 并导出 `./client` bundle；宿主把 bundle 注入 `window.__DSH_BOOT__`，浏览器启动即加载
- 壁纸层：图片用 `body::before` 固定层、视频用全屏 `<video>`，均 `z-index:-1` 垫在内容之下且不拦截点击
- 字幕块：只垫在含文字的叶子元素与文字容器上（`*:not(:has(*)):not(:empty)` 等），容器不遮挡、壁纸保持可见；表格无缝（`border-collapse:separate` + 表格本体承载底色与圆角）
- 主题：`theme.overrideTokens` 统一面板灰度；字幕样式随 `active.colorScheme` 单一切换

## License

MIT（见 `LICENSE`）。方正字体为商业字体，仓库仅按字体名引用，未打包字体文件。
