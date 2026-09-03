<p align="center">
  <a href="https://text-to-image-template.templates.workers.dev/" target="_blank" rel="noopener">
    <img alt="text-to-image" src="public/cat0.png" width="120" height="120" />
  </a>
</p>

<div align="center"></br></div>

<div align="center">
  <h1>
    ✨ 基于 Cloudflare AI & Workers 的免费在线文生图服务 </br>
  </h1>
</div>

<div align="center">

[项目简介](#📚-项目简介) |
[主要特性](#✨-主要特性) |
[快速开始](#🚀-快速开始) |
[使用指南](#📝-使用指南) |
[配置选项](#⚙️-配置选项) |
[模型限制](#📊-模型限制) |
[原理文档](免费文生图.md) |
[项目示例](https://text2img.huarzone.com/)

</div>

<div align="center"></br></div>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/top-dark.png">
  <img alt="应用截图" src="public/top.png">
</picture>

<div align="center"></br></div>

## 

Text2img-Cloudflare-Workers 是基于 Cloudflare Workers AI 服务搭建的在线文本生成图像可视化网页，完全构建在 Cloudflare Workers 上。该项目为通过简单调用 Cloudflare 官方提供的 [文生图 - Text-to-Image](https://developers.cloudflare.com/workers-ai/models/) 模型，可以快速实现随时随地无需登录的图像生成需求。

> 📖 想了解「免费」从何而来、扩散模型如何把文字变成图片、本项目如何在无服务器环境下运行？请阅读原理文档 **[免费文生图.md](免费文生图.md)**。

### 体验地址：[https://text2img.huarzone.com/](https://text2img.huarzone.com/)

## ✨ 主要特性

- 🚀 完全基于 Cloudflare Workers，无需服务器部署
- 🎨 利用 Cloudflare AI 免费额度提供高质量文生图（每日神经元额度自动重置）
- 🐳 内置 9 个文生图模型：FLUX.2 系列 / FLUX.1 [schnell] / Leonardo Lucid·Phoenix / SDXL 系列等
- 🧠 模型能力自描述：切换模型时 UI 自动显隐对应参数控件并调整取值范围（服务端同步校验钳制）
- ⌨️ 支持 Ctrl/⌘ + Enter 快捷生成、生成期间防重复提交、参数本地记忆
- 📦 页面零外部依赖（无 CDN 引用），加载快且无单点故障
- 🤗 支持设置访问密码，私有化部署友好
- ⚡ 响应速度快，全球边缘网络加速
- 🌓 支持深色和浅色模式（跟随系统 + 手动切换，无闪烁）
- 📱 移动端友好，支持各种设备访问

## 🚀 快速开始

### 部署你自己的文生图实例

1. **创建新的 Worker**：在 Cloudflare 控制面板中找到 "Workers 和 Pages" 菜单，点击 "创建应用程序"，选择 "创建 Worker"，输入标识名称后点击 "部署"。

![创建项目](public/create.png)

2. **编辑并部署代码**（二选一）：

   - **单文件方式（推荐，最简）**：点击 "编辑代码"，将 `src/worker.bundle.js`（已内联页面，自动生成）的内容全部复制到代码框，点击 "保存并部署" 即可。
   - **双文件方式**：将 `src/worker.js` 内容复制到代码框，再**新建模块文件** `index.html` 并复制 `src/index.html` 内容（注意需作为代码模块添加，若被当作静态资源会导致 `MIME type is not executable` 报错），点击 "保存并部署"。

![编辑代码](public/edit.png)

3. **添加 Workers AI 绑定**：返回 Worker 项目面板页，进入 "设置" -> "绑定"，点击 "添加绑定"，选择 `Workers AI` 类型，变量名称填写 `AI`，保存并部署。

![添加绑定](public/ai.png)

4. **配置自定义域名（可选）**：在 Worker 的 "设置"-> "域和路由" 中选择 "添加自定义域"，输入你的域名并完成 DNS 配置。

🎉 部署完成后，即可通过 Cloudflare 分配的域名或自定义域名访问你的文生图服务！

## 📝 使用指南

1. 访问应用网址，默认分配的域名为 `https://<your-worker-name>.<your-subdomain>.workers.dev/`。

2. **输入访问密码**：如果设置密码，则需要在页面顶部"访问密码"区域输入访问密码。

2. **填写提示词**：在 "正向提示词" 文本框中描述你想要生成的图像内容，可使用 "随机提示词" 按钮获取灵感；在 "反向提示词" 中添加你想避免的元素。

3. **选择模型**：从下拉菜单中选择想要使用的文生图模型。模型下方会显示该模型支持的能力（尺寸范围、步数、引导系数、随机种子、画面比例等），标注"付费 Partner 模型"的选项需要账户启用付款方式。

4. **调整参数**（可选）：展开"高级选项"可以调整图像尺寸、迭代步数、引导系数和随机种子等参数；不支持的参数会自动隐藏，取值范围随模型自动适配（FLUX.2 [dev] 使用画面比例替代像素尺寸）。

5. **生成图像**：点击"生成图像"按钮或按 `Ctrl/⌘ + Enter`，等待几秒至几十秒不等，系统会在右侧展示生成结果。生成期间按钮自动禁用，防止重复提交。

6. **管理结果**：图像生成后，可以使用"复制参数"保存当前设置，或点击"下载图像"保存生成的图片（文件扩展名自动匹配 PNG/JPEG）。

7. **切换主题**：通过页面右上角的月亮/太阳图标按钮在深色和浅色模式之间切换，页面默认跟随系统主题，设置会被记住。

## ⚙️ 配置选项

1. **模型设置**：在 `src/worker.js` 的 `AVAILABLE_MODELS` 中可添加、删除或修改模型。每个模型除了基本信息外，还通过 `capabilities` 描述其能力——这是**唯一事实来源**，服务端据此校验钳制入参，前端（`/api/models` 下发后）据此显隐控件、调整滑块范围：

   ```js
   {
     id: 'flux-1-schnell',            // 前端回传的模型标识
     name: 'FLUX.1 [schnell]',         // 显示名称
     description: '…',                 // 模型介绍（显示在模型下方）
     key: '@cf/black-forest-labs/flux-1-schnell',  // Workers AI 模型 key
     default: true,                    // 页面默认选中的模型（仅标记一个）
     capabilities: {
       transport: 'json',              // 'json' 直传参数 | 'multipart' FormData 传输（FLUX.2 系列）
       response: 'base64',             // 'base64' 返回 JSON | 'stream' 返回图像流
       mime: 'image/jpeg',             // 响应类型与下载扩展名
       negativePrompt: false,          // 是否支持反向提示词
       size: false,                    // 或 { min, max, step, defaultWidth, defaultHeight }
       steps: { param: 'steps', min: 1, max: 8, default: 4 },  // 或 false
       guidance: false,                // 或 { min, max, default }
       seed: true,                     // 是否支持随机种子
       aspectRatio: false,             // 或比例数组，如 ['1:1', '16:9', '9:16']
       promptMaxLen: 2048              // 提示词长度上限，null 为不限制
     }
   }
   ```

   新增模型时只需照抄 Cloudflare [模型详情页](https://developers.cloudflare.com/workers-ai/models/) 的参数范围填写 capabilities，前后端即可自动适配，无需改动页面代码。

2. **随机提示词**：编辑 `src/worker.js` 中的 `RANDOM_PROMPTS` 数组可自定义随机出现的创意提示词库。

3. **访问权限控制**：通过在 `src/worker.js` 的 `PASSWORDS` 数组中添加密码来启用访问保护，支持多密码并行，留空则允许无密码访问。

> **注意**：所有配置修改都需要重新部署应用后才能生效。控制台部署请使用自动生成的一体化文件 `src/worker.bundle.js`；修改 `src/worker.js` 或 `src/index.html` 后，用以下命令重新生成 bundle：
>
> ```bash
> node -e 'const fs=require("fs");const w=fs.readFileSync("src/worker.js","utf8");const h=fs.readFileSync("src/index.html","utf8");fs.writeFileSync("src/worker.bundle.js",w.replace("import HTML from \x27./index.html\x27;","const HTML = "+JSON.stringify(h)+";"))'
> ```

## 📊 模型限制

- Workers AI 免费额度为每日 10,000 神经元（自动重置），日常使用建议私有化部署并设置访问密码，避免额度被他人消耗。
- 标注"付费 Partner 模型"的选项（FLUX.2 系列、Leonardo 系列）按用量以美元计费，需要账户启用付款方式，详见各 [模型详情页](https://developers.cloudflare.com/workers-ai/models/) 与 [定价页](https://developers.cloudflare.com/workers-ai/platform/pricing/)。
- 图像生成通常需要 3-20 秒左右，与模型选择、迭代步数和图像分辨率有关。
- 不同文生图模型参数的限制存在差异，本项目已按官方文档在服务端统一校验钳制，超范围参数会自动收敛到合法区间。


## 🙏 致谢

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Cloudflare AI](https://developers.cloudflare.com/workers-ai/)


