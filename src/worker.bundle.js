/**
 * foxai Text2img — 基于 Cloudflare Workers AI 的在线文生图服务
 *
 * @author: kared / foxai
 * @create_date: 2025-05-10
 * @last_edit_time: 2026-09-03
 * @description: Cloudflare Worker：模型能力清单 / 输入校验 / 图像生成 API + 页面托管
 */

// import html template
// [自动生成] index.html 已内联为字符串常量，控制台粘贴部署无需再建 index.html 文件
// 修改 UI 请编辑 src/index.html 后重新生成 bundle（见 README 配置选项）
const HTML = "<!DOCTYPE html>\n<html lang=\"zh\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<meta name=\"app-version\" content=\"2026.09.03-3\">\n<title>foxai · 免费在线文生图</title>\n<script>\n/* 主题初始化：必须在样式表加载前执行，避免深色用户看到亮色闪烁 */\n(function () {\n  try {\n    if (localStorage.theme === 'dark' ||\n        (!('theme' in localStorage) && matchMedia('(prefers-color-scheme: dark)').matches)) {\n      document.documentElement.classList.add('dark');\n    }\n  } catch (e) { /* 隐私模式下 localStorage 可能不可用 */ }\n})();\n</script>\n<!-- foxai Tile favicon（LOGO 规范：固定 Light Ember 底 + 反白 Mark） -->\n<link rel=\"icon\" type=\"image/svg+xml\" href=\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2064%2064'%3E%3Crect%20width='64'%20height='64'%20rx='14'%20fill='%23E2571F'/%3E%3Cg%20fill='none'%20stroke='%23FFFFFF'%20stroke-width='7.5'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M23%2055V22c0-7.2%205.8-13%2013-13h2'/%3E%3Cpath%20d='M12.5%2031h21'/%3E%3C/g%3E%3Ccircle%20cx='49'%20cy='9'%20r='5.5'%20fill='%23FFFFFF'/%3E%3C/svg%3E\">\n<style>\n/* ===================== 设计令牌（foxai 品牌规范，Light/Dark 双值） ===================== */\n:root {\n  --brand: #E2571F;                       /* Ember (light) */\n  --brand-foreground: #FFFFFF;\n  --brand-muted: rgba(226, 87, 31, 0.12);\n  --brand-ring: rgba(226, 87, 31, 0.35);\n\n  --bg: #F6F7F8;\n  --surface: #FFFFFF;\n  --surface-2: #F1F2F4;\n  --border: #E3E5E9;\n  --text: #1A1D21;\n  --text-soft: #5C636B;\n\n  --success: #0E9F6E;\n  --error: #DC2626;\n  --warning: #B45309;\n  --info: #2563EB;\n  --success-bg: rgba(14, 159, 110, 0.14);\n  --error-bg: rgba(220, 38, 38, 0.12);\n  --warning-bg: rgba(180, 83, 9, 0.14);\n  --info-bg: rgba(37, 99, 235, 0.12);\n\n  --shadow: 0 1px 2px rgba(16, 24, 40, 0.05);\n  --shadow-lg: 0 12px 32px -12px rgba(16, 24, 40, 0.18);\n  --radius: 12px;\n}\n.dark {\n  --brand: #FF7A4D;                       /* Ember (dark, lifted) */\n  --brand-foreground: #1A1A1A;\n  --brand-muted: rgba(255, 122, 77, 0.16);\n  --brand-ring: rgba(255, 122, 77, 0.45);\n\n  --bg: #101214;\n  --surface: #191C1F;\n  --surface-2: #22262A;\n  --border: #2C3136;\n  --text: #EFF1F2;\n  --text-soft: #9AA1A9;\n\n  --success: #3DD68C;\n  --error: #F28B82;\n  --warning: #FBBF24;\n  --info: #7EB3FF;\n  --success-bg: rgba(61, 214, 140, 0.14);\n  --error-bg: rgba(242, 139, 130, 0.14);\n  --warning-bg: rgba(251, 191, 36, 0.14);\n  --info-bg: rgba(126, 179, 255, 0.14);\n\n  --shadow: 0 1px 2px rgba(0, 0, 0, 0.4);\n  --shadow-lg: 0 12px 32px -12px rgba(0, 0, 0, 0.6);\n}\n\n/* ===================== 基础 ===================== */\n* { box-sizing: border-box; }\nhtml { -webkit-text-size-adjust: 100%; }\nbody {\n  margin: 0;\n  background: var(--bg);\n  color: var(--text);\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\",\n    \"Hiragino Sans GB\", \"Microsoft YaHei\", Roboto, Helvetica, Arial, sans-serif;\n  font-size: 14px;\n  line-height: 1.55;\n  transition: background-color 0.25s ease, color 0.25s ease;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n}\n.icon { width: 16px; height: 16px; stroke: currentColor; stroke-width: 2; fill: none;\n  stroke-linecap: round; stroke-linejoin: round; vertical-align: -3px; flex-shrink: 0; }\n.hidden { display: none !important; }\na { color: var(--brand); text-decoration: none; }\n\n/* ===================== 顶栏 ===================== */\n.topbar {\n  position: sticky; top: 0; z-index: 50;\n  background: var(--surface);\n  border-bottom: 1px solid var(--border);\n  height: 56px;\n  display: flex; align-items: center; justify-content: space-between;\n  padding: 0 20px;\n}\n/* foxai Lockup（LOGO 规范 §2.3：Mark 与 \"ai\" 同用品牌色，\"fox\" 中性墨色，600 字重，-0.01em） */\n.lockup { display: inline-flex; align-items: center; gap: 8px; }\n.lockup svg { width: 26px; height: 26px; }\n.lockup .word { font-weight: 600; letter-spacing: -0.01em; font-size: 16px; line-height: 1; color: var(--text); }\n.lockup .word .ai { color: var(--brand); }\n.topbar-sub { color: var(--text-soft); font-size: 13px; margin-left: 10px; padding-left: 12px;\n  border-left: 1px solid var(--border); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.topbar-actions { display: flex; align-items: center; gap: 8px; }\n\n/* ===================== 布局 ===================== */\n.layout {\n  flex: 1; width: 100%; max-width: 1400px;\n  margin: 0 auto; padding: 20px;\n  display: flex; gap: 20px; align-items: flex-start;\n}\n.composer { width: 400px; flex-shrink: 0; display: flex; flex-direction: column; gap: 14px; }\n.stage-col { flex: 1; min-width: 0; }\n\n.card {\n  background: var(--surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius);\n  box-shadow: var(--shadow);\n  padding: 16px;\n}\n.card-title {\n  display: flex; align-items: center; gap: 6px;\n  font-size: 13px; font-weight: 600; color: var(--text-soft);\n  text-transform: uppercase; letter-spacing: 0.03em;\n  margin: 0 0 10px;\n}\n.card-title .icon { width: 14px; height: 14px; color: var(--brand); }\n.card-title .spacer { flex: 1; }\n\n/* ===================== 表单控件 ===================== */\ntextarea, select, input {\n  width: 100%;\n  background: var(--surface);\n  color: var(--text);\n  border: 1px solid var(--border);\n  border-radius: 8px;\n  padding: 9px 12px;\n  font: inherit;\n  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.25s ease;\n}\ntextarea { resize: vertical; min-height: 96px; }\ntextarea:focus, select:focus, input:focus {\n  outline: none;\n  border-color: var(--brand);\n  box-shadow: 0 0 0 3px var(--brand-ring);\n}\n.field { margin-bottom: 14px; }\n.field:last-child { margin-bottom: 0; }\n.field-label {\n  display: flex; align-items: center; justify-content: space-between;\n  font-size: 13px; font-weight: 600; margin-bottom: 6px;\n}\n.field-label .icon { width: 13px; height: 13px; margin-right: 4px; color: var(--text-soft); }\n.hint { font-size: 12px; color: var(--text-soft); margin-top: 4px; }\n\n/* 滑块 */\n.slider-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }\n.slider-value { font-variant-numeric: tabular-nums; font-size: 13px; color: var(--text-soft);\n  background: var(--surface-2); border-radius: 6px; padding: 1px 8px; }\n.slider {\n  -webkit-appearance: none; appearance: none;\n  width: 100%; height: 5px; border-radius: 5px;\n  background: var(--border); outline: none; margin: 10px 0;\n}\n.slider::-webkit-slider-thumb {\n  -webkit-appearance: none; appearance: none;\n  width: 16px; height: 16px; border-radius: 50%;\n  background: var(--brand); cursor: pointer; border: none;\n  transition: transform 0.15s ease, box-shadow 0.15s ease;\n}\n.slider::-webkit-slider-thumb:hover { transform: scale(1.2); box-shadow: 0 0 0 4px var(--brand-ring); }\n.slider::-moz-range-thumb {\n  width: 16px; height: 16px; border-radius: 50%;\n  background: var(--brand); cursor: pointer; border: none;\n}\n.slider::-moz-range-thumb:hover { transform: scale(1.2); box-shadow: 0 0 0 4px var(--brand-ring); }\n\n/* 按钮 */\n.btn {\n  display: inline-flex; align-items: center; justify-content: center; gap: 6px;\n  border: 1px solid var(--border); border-radius: 8px;\n  background: var(--surface); color: var(--text);\n  font: inherit; font-weight: 500;\n  padding: 7px 12px; cursor: pointer;\n  transition: all 0.2s ease;\n}\n.btn:hover { background: var(--surface-2); }\n.btn:focus-visible { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-ring); }\n.btn-icon { width: 34px; height: 34px; padding: 0; }\n.btn-soft { background: var(--brand-muted); color: var(--brand); border-color: transparent; }\n.btn-soft:hover { background: var(--brand-muted); filter: brightness(1.08); }\n/* 主按钮（LOGO 规范：底 --brand 字 --brand-foreground，hover brightness(1.1)，无渐变） */\n.btn-primary {\n  background: var(--brand); color: var(--brand-foreground);\n  border: none; border-radius: 10px;\n  font-size: 15px; font-weight: 600;\n  padding: 13px 20px; width: 100%;\n  box-shadow: 0 4px 14px -4px var(--brand-ring);\n}\n.btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }\n.btn-primary:active:not(:disabled) { transform: translateY(0); filter: brightness(0.98); }\n.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }\n.btn-primary:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--brand-ring); }\n\n/* 模型信息与能力标签 */\n.model-info { margin-top: 8px; font-size: 12.5px; color: var(--text-soft); }\n.cap-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }\n.cap-chip {\n  font-size: 11.5px; color: var(--text-soft);\n  background: var(--surface-2); border-radius: 999px; padding: 2px 9px;\n}\n.cap-chip.brand { color: var(--brand); background: var(--brand-muted); }\n\n/* 画面比例选择（FLUX.2 [dev]） */\n.ratio-row { display: flex; flex-wrap: wrap; gap: 6px; }\n.ratio-btn {\n  border: 1px solid var(--border); background: var(--surface); color: var(--text-soft);\n  border-radius: 8px; padding: 5px 12px; font: inherit; font-size: 13px;\n  cursor: pointer; transition: all 0.15s ease;\n}\n.ratio-btn:hover { border-color: var(--brand); color: var(--brand); }\n.ratio-btn.active { background: var(--brand); border-color: var(--brand); color: var(--brand-foreground); font-weight: 600; }\n\n/* 高级选项折叠 */\n.adv-toggle { width: 100%; justify-content: space-between; }\n.adv-toggle .icon.chevron { transition: transform 0.2s ease; }\n.adv-toggle.open .icon.chevron { transform: rotate(180deg); }\n.adv-body { margin-top: 14px; border-top: 1px dashed var(--border); padding-top: 14px; }\n\n/* 生成快捷键提示 */\n.kbd-hint { text-align: center; font-size: 12px; color: var(--text-soft); margin-top: 8px; }\n.kbd-hint kbd {\n  background: var(--surface-2); border: 1px solid var(--border); border-bottom-width: 2px;\n  border-radius: 5px; padding: 0 5px; font-size: 11px; font-family: inherit;\n}\n\n/* ===================== 结果画布 ===================== */\n.stage-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }\n.stage-actions { display: flex; gap: 8px; }\n.stage {\n  position: relative;\n  background: var(--surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius);\n  box-shadow: var(--shadow);\n  min-height: 480px;\n  display: flex; align-items: center; justify-content: center;\n  overflow: hidden;\n  padding: 16px;\n}\n.stage-empty { text-align: center; color: var(--text-soft); user-select: none; }\n.stage-empty svg.mark { width: 88px; height: 88px; opacity: 0.22; margin-bottom: 12px; }\n.stage-empty p { margin: 4px 0; font-size: 13.5px; }\n#aiImage { max-width: 100%; max-height: 100%; border-radius: 8px; box-shadow: var(--shadow-lg); }\n\n/* 加载遮罩 */\n.loading-mask {\n  position: absolute; inset: 0; z-index: 10;\n  display: flex; align-items: center; justify-content: center;\n  background: color-mix(in srgb, var(--surface) 72%, transparent);\n  backdrop-filter: blur(5px);\n}\n.spinner {\n  width: 34px; height: 34px; border-radius: 50%;\n  border: 3px solid var(--brand-muted); border-top-color: var(--brand);\n  animation: spin 0.8s linear infinite; margin: 0 auto 12px;\n}\n@keyframes spin { to { transform: rotate(360deg); } }\n.loading-text { text-align: center; font-weight: 500; }\n.loading-text .elapsed { font-size: 12.5px; color: var(--text-soft); margin-top: 2px;\n  font-variant-numeric: tabular-nums; }\n\n/* 状态徽章（半透明底色，双主题自适应） */\n#imageStatus {\n  position: absolute; bottom: 14px; left: 14px; z-index: 20;\n  padding: 4px 12px; border-radius: 999px;\n  font-size: 12.5px; font-weight: 500;\n  box-shadow: var(--shadow);\n  transition: all 0.3s ease;\n}\n.status-success { background: var(--success-bg); color: var(--success); }\n.status-error   { background: var(--error-bg);   color: var(--error); }\n.status-warning { background: var(--warning-bg); color: var(--warning); }\n.status-info    { background: var(--info-bg);    color: var(--info); }\n\n/* 结果元信息 */\n.meta-row {\n  display: flex; flex-wrap: wrap; gap: 8px 24px;\n  margin-top: 14px; font-size: 13px; color: var(--text-soft);\n}\n.meta-row .icon { width: 13px; height: 13px; margin-right: 4px; }\n.meta-row b { color: var(--text); font-weight: 600; }\n\n/* 参数徽章 */\n.param-badge {\n  background: var(--surface); border: 1px solid var(--border);\n  color: var(--text);\n  padding: 3px 10px; border-radius: 6px;\n  font-size: 12px; display: inline-block;\n}\n.param-badge b { font-weight: 600; color: var(--text-soft); margin-right: 2px; }\n\n/* ===================== 页脚 ===================== */\n.footer {\n  text-align: center; color: var(--text-soft); font-size: 12.5px;\n  padding: 18px 20px 22px;\n}\n.footer a { color: inherit; text-decoration: underline; text-underline-offset: 3px; }\n.footer a:hover { color: var(--brand); }\n\n/* ===================== 响应式 ===================== */\n@media (max-width: 960px) {\n  .layout { flex-direction: column; padding: 14px; }\n  .composer { width: 100%; }\n  .stage { min-height: 360px; }\n  .topbar { padding: 0 14px; }\n  .topbar-sub { display: none; }\n}\n</style>\n</head>\n<body>\n\n<!-- 内联 SVG 图标库（Feather 风格，MIT License） -->\n<svg xmlns=\"http://www.w3.org/2000/svg\" style=\"display:none\" aria-hidden=\"true\">\n  <symbol id=\"i-moon\" viewBox=\"0 0 24 24\"><path d=\"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\"/></symbol>\n  <symbol id=\"i-sun\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"5\"/><path d=\"M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42\"/></symbol>\n  <symbol id=\"i-github\" viewBox=\"0 0 24 24\"><path d=\"M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22\"/></symbol>\n  <symbol id=\"i-shuffle\" viewBox=\"0 0 24 24\"><path d=\"M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5\"/></symbol>\n  <symbol id=\"i-copy\" viewBox=\"0 0 24 24\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\"/><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"/></symbol>\n  <symbol id=\"i-download\" viewBox=\"0 0 24 24\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3\"/></symbol>\n  <symbol id=\"i-chevron\" viewBox=\"0 0 24 24\"><path d=\"M6 9l6 6 6-6\"/></symbol>\n  <symbol id=\"i-zap\" viewBox=\"0 0 24 24\"><path d=\"M13 2 3 14h9l-1 8 10-12h-9l1-8z\"/></symbol>\n  <symbol id=\"i-clock\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 6v6l4 2\"/></symbol>\n  <symbol id=\"i-cpu\" viewBox=\"0 0 24 24\"><rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2\"/><rect x=\"9\" y=\"9\" width=\"6\" height=\"6\"/><path d=\"M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3\"/></symbol>\n  <symbol id=\"i-refresh\" viewBox=\"0 0 24 24\"><path d=\"M23 4v6h-6M1 20v-6h6\"/><path d=\"M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15\"/></symbol>\n  <symbol id=\"i-image\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><circle cx=\"8.5\" cy=\"8.5\" r=\"1.5\"/><path d=\"M21 15l-5-5L5 21\"/></symbol>\n  <symbol id=\"i-lock\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/></symbol>\n  <symbol id=\"i-sliders\" viewBox=\"0 0 24 24\"><path d=\"M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6\"/></symbol>\n  <symbol id=\"i-ban\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M4.93 4.93l14.14 14.14\"/></symbol>\n  <symbol id=\"i-seed\" viewBox=\"0 0 24 24\"><path d=\"M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></symbol>\n  <symbol id=\"i-edit\" viewBox=\"0 0 24 24\"><path d=\"M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z\"/></symbol>\n</svg>\n\n<!-- 顶栏 -->\n<header class=\"topbar\">\n  <div style=\"display:flex;align-items:center;min-width:0;\">\n    <!-- foxai Lockup（严格遵循 LOGO.html §2.3 定稿） -->\n    <span class=\"lockup\" aria-label=\"foxai\">\n      <svg viewBox=\"0 0 64 64\" role=\"img\" aria-hidden=\"true\">\n        <g fill=\"none\" stroke=\"var(--brand)\" stroke-width=\"7.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n          <path d=\"M23 55V22c0-7.2 5.8-13 13-13h2\"/>\n          <path d=\"M12.5 31h21\"/>\n        </g>\n        <circle cx=\"49\" cy=\"9\" r=\"5.5\" fill=\"var(--brand)\"/>\n      </svg>\n      <span class=\"word\">fox<span class=\"ai\">ai</span></span>\n    </span>\n    <span class=\"topbar-sub\">免费在线文生图 · Cloudflare Workers AI</span>\n  </div>\n  <div class=\"topbar-actions\">\n    <button id=\"themeToggle\" class=\"btn btn-icon\" aria-label=\"切换暗色主题\" title=\"切换主题\">\n      <svg class=\"icon\" id=\"themeIcon\"><use href=\"#i-moon\"/></svg>\n    </button>\n    <button id=\"githubBtn\" class=\"btn btn-icon\" aria-label=\"项目地址\" title=\"GitHub 项目\"\n            onclick=\"window.open('https://github.com/LisaPullman/foxai-Text2img-Cloudflare-Workers', '_blank')\">\n      <svg class=\"icon\"><use href=\"#i-github\"/></svg>\n    </button>\n  </div>\n</header>\n\n<div class=\"layout\">\n  <!-- 左侧：创作面板 -->\n  <div class=\"composer\">\n    <section class=\"card\">\n      <h2 class=\"card-title\"><svg class=\"icon\"><use href=\"#i-cpu\"/></svg>模型</h2>\n      <select id=\"model\" aria-label=\"选择文生图模型\">\n        <option value=\"\" disabled selected>加载中…</option>\n      </select>\n      <div class=\"model-info\" id=\"modelInfo\"></div>\n      <div class=\"cap-chips\" id=\"capChips\"></div>\n    </section>\n\n    <section class=\"card\">\n      <h2 class=\"card-title\"><svg class=\"icon\"><use href=\"#i-zap\"/></svg>提示词</h2>\n\n      <div class=\"field\">\n        <div class=\"field-label\">\n          <label for=\"prompt\" style=\"display:flex;align-items:center;\">\n            <svg class=\"icon\"><use href=\"#i-edit\"/></svg>正向提示词\n          </label>\n          <button id=\"randomButton\" class=\"btn btn-soft\" style=\"font-size:12px;padding:3px 10px;\">\n            <svg class=\"icon\" style=\"width:12px;height:12px;\"><use href=\"#i-shuffle\"/></svg> 随机灵感\n          </button>\n        </div>\n        <textarea id=\"prompt\" rows=\"4\" placeholder=\"描述你想要生成的图像内容及风格，支持中英文…\"></textarea>\n      </div>\n\n      <div class=\"field\" id=\"negativePromptGroup\">\n        <div class=\"field-label\">\n          <label for=\"negative_prompt\" style=\"display:flex;align-items:center;\">\n            <svg class=\"icon\"><use href=\"#i-ban\"/></svg>反向提示词\n          </label>\n        </div>\n        <textarea id=\"negative_prompt\" rows=\"2\" placeholder=\"不想出现在图像中的元素（该模型不支持时隐藏）\"></textarea>\n      </div>\n    </section>\n\n    <section class=\"card\">\n      <button id=\"toggleAdvanced\" class=\"btn adv-toggle\" aria-expanded=\"false\">\n        <span style=\"display:flex;align-items:center;gap:6px;\">\n          <svg class=\"icon\"><use href=\"#i-sliders\"/></svg>高级选项\n        </span>\n        <svg class=\"icon chevron\"><use href=\"#i-chevron\"/></svg>\n      </button>\n\n      <div id=\"advancedOptions\" class=\"adv-body hidden\">\n        <div class=\"field\" id=\"passwordGroup\">\n          <div class=\"field-label\">\n            <label for=\"password\" style=\"display:flex;align-items:center;\">\n              <svg class=\"icon\"><use href=\"#i-lock\"/></svg>访问密码\n            </label>\n          </div>\n          <input type=\"password\" id=\"password\" placeholder=\"私有部署时填写，留空则无需密码\">\n        </div>\n\n        <div class=\"field\" id=\"widthGroup\">\n          <div class=\"slider-row\">\n            <label for=\"width\" style=\"display:flex;align-items:center;\">\n              <svg class=\"icon\"><use href=\"#i-image\"/></svg>图像宽度\n            </label>\n            <span class=\"slider-value\" id=\"widthValue\">1024px</span>\n          </div>\n          <input type=\"range\" id=\"width\" min=\"256\" max=\"2048\" step=\"64\" value=\"1024\" class=\"slider\">\n        </div>\n\n        <div class=\"field\" id=\"heightGroup\">\n          <div class=\"slider-row\">\n            <label for=\"height\" style=\"display:flex;align-items:center;\">\n              <svg class=\"icon\"><use href=\"#i-image\"/></svg>图像高度\n            </label>\n            <span class=\"slider-value\" id=\"heightValue\">1024px</span>\n          </div>\n          <input type=\"range\" id=\"height\" min=\"256\" max=\"2048\" step=\"64\" value=\"1024\" class=\"slider\">\n        </div>\n\n        <div class=\"field\" id=\"aspectGroup\">\n          <div class=\"field-label\"><span>画面比例</span></div>\n          <div class=\"ratio-row\" id=\"ratioRow\"></div>\n          <p class=\"hint\">该模型按比例出图，不支持自定义像素尺寸</p>\n        </div>\n\n        <div class=\"field\" id=\"stepsGroup\">\n          <div class=\"slider-row\">\n            <label for=\"num_steps\" style=\"display:flex;align-items:center;\">\n              <svg class=\"icon\"><use href=\"#i-refresh\"/></svg>迭代步数\n            </label>\n            <span class=\"slider-value\" id=\"num_stepsValue\">20</span>\n          </div>\n          <input type=\"range\" id=\"num_steps\" min=\"1\" max=\"20\" step=\"1\" value=\"20\" class=\"slider\">\n          <p class=\"hint\">步数越高细节越丰富，但耗时更长</p>\n        </div>\n\n        <div class=\"field\" id=\"guidanceGroup\">\n          <div class=\"slider-row\">\n            <label for=\"guidance\" style=\"display:flex;align-items:center;\">\n              <svg class=\"icon\"><use href=\"#i-edit\"/></svg>引导系数\n            </label>\n            <span class=\"slider-value\" id=\"guidanceValue\">7.5</span>\n          </div>\n          <input type=\"range\" id=\"guidance\" min=\"0\" max=\"30\" step=\"0.5\" value=\"7.5\" class=\"slider\">\n          <p class=\"hint\">越高越严格遵循提示词，过高可能画面失真</p>\n        </div>\n\n        <div class=\"field\" id=\"seedGroup\">\n          <div class=\"field-label\">\n            <label for=\"seed\" style=\"display:flex;align-items:center;\">\n              <svg class=\"icon\"><use href=\"#i-seed\"/></svg>随机种子\n            </label>\n            <button id=\"randomSeed\" class=\"btn btn-soft\" style=\"font-size:12px;padding:3px 10px;\" title=\"生成随机种子\">\n              <svg class=\"icon\" style=\"width:12px;height:12px;\"><use href=\"#i-refresh\"/></svg> 随机\n            </button>\n          </div>\n          <input type=\"number\" id=\"seed\" placeholder=\"留空则每次随机\" min=\"0\" step=\"1\">\n          <p class=\"hint\">相同种子 + 相同参数可复现相似图像</p>\n        </div>\n      </div>\n    </section>\n\n    <div>\n      <button id=\"submitButton\" class=\"btn-primary\">\n        <svg class=\"icon\" id=\"submitIcon\"><use href=\"#i-zap\"/></svg>\n        <span id=\"submitText\">生成图像</span>\n      </button>\n      <p class=\"kbd-hint\">快捷键 <kbd>Ctrl</kbd> + <kbd>Enter</kbd> 快速生成</p>\n    </div>\n  </div>\n\n  <!-- 右侧：结果画布 -->\n  <div class=\"stage-col\">\n    <div class=\"stage-head\">\n      <h2 class=\"card-title\" style=\"margin:0;\"><svg class=\"icon\"><use href=\"#i-image\"/></svg>生成结果</h2>\n      <div class=\"stage-actions\">\n        <button id=\"copyParamsButton\" class=\"btn hidden\">\n          <svg class=\"icon\"><use href=\"#i-copy\"/></svg> 复制参数\n        </button>\n        <button id=\"downloadButton\" class=\"btn hidden\">\n          <svg class=\"icon\"><use href=\"#i-download\"/></svg> 下载图像\n        </button>\n      </div>\n    </div>\n\n    <div class=\"stage\">\n      <div id=\"emptyState\" class=\"stage-empty\">\n        <svg class=\"mark\" viewBox=\"0 0 64 64\" aria-hidden=\"true\">\n          <g fill=\"none\" stroke=\"var(--brand)\" stroke-width=\"7.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n            <path d=\"M23 55V22c0-7.2 5.8-13 13-13h2\"/>\n            <path d=\"M12.5 31h21\"/>\n          </g>\n          <circle cx=\"49\" cy=\"9\" r=\"5.5\" fill=\"var(--brand)\"/>\n        </svg>\n        <p>输入提示词，点击「生成图像」开始创作</p>\n        <p style=\"font-size:12px;\">生成通常需要几秒到几十秒</p>\n      </div>\n\n      <img id=\"aiImage\" class=\"hidden\" alt=\"生成的图像\">\n\n      <div id=\"loadingOverlay\" class=\"loading-mask hidden\">\n        <div>\n          <div class=\"spinner\"></div>\n          <div class=\"loading-text\">\n            正在生成，请稍候…\n            <div class=\"elapsed\" id=\"elapsedTimer\">已等待 0.0s</div>\n          </div>\n        </div>\n      </div>\n\n      <span id=\"imageStatus\" class=\"hidden\"></span>\n    </div>\n\n    <div class=\"meta-row hidden\" id=\"metaRow\">\n      <span><svg class=\"icon\"><use href=\"#i-clock\"/></svg>耗时 <b id=\"generationTime\">-</b></span>\n      <span><svg class=\"icon\"><use href=\"#i-cpu\"/></svg>模型 <b id=\"usedModel\">-</b></span>\n      <span id=\"imageMeta\"></span>\n    </div>\n\n    <div class=\"hidden\" id=\"allParamsContainer\" style=\"margin-top:12px;\">\n      <div class=\"card\">\n        <div class=\"card-title\" style=\"margin-bottom:8px;\">本次生成参数</div>\n        <div id=\"allParams\" style=\"display:flex;flex-wrap:wrap;gap:6px;\"></div>\n      </div>\n    </div>\n  </div>\n</div>\n\n<footer class=\"footer\">\n  Powered by <a href=\"https://developers.cloudflare.com/workers-ai/\" target=\"_blank\" rel=\"noopener\">Cloudflare Workers AI</a>\n  · 免费额度内即可使用 ·\n  <a href=\"https://github.com/LisaPullman/foxai-Text2img-Cloudflare-Workers\" target=\"_blank\" rel=\"noopener\">GitHub</a>\n  · <span style=\"opacity:.55\">v2026.09.03-3</span>\n</footer>\n\n<script>\ndocument.addEventListener('DOMContentLoaded', function () {\n  'use strict';\n\n  var $ = function (id) { return document.getElementById(id); };\n\n  var availableModels = [];\n  var modelsById = {};\n  var currentModel = null;\n  var randomPromptsList = [];\n  var currentImageParams = {};\n  var isGenerating = false;\n  var lastBlob = null;\n  var lastObjectUrl = null;\n  var statusTimer = null;\n  var elapsedInterval = null;\n  var selectedRatio = '1:1';\n\n  var PREFS_KEY = 't2i:prefs';\n\n  // ============ 主题切换 ============\n  var themeToggle = $('themeToggle');\n  var themeIcon = $('themeIcon');\n\n  function syncThemeButton() {\n    var dark = document.documentElement.classList.contains('dark');\n    themeIcon.innerHTML = '<use href=\"#' + (dark ? 'i-sun' : 'i-moon') + '\"/>';\n    themeToggle.setAttribute('aria-label', dark ? '切换亮色主题' : '切换暗色主题');\n  }\n\n  themeToggle.addEventListener('click', function () {\n    var dark = document.documentElement.classList.toggle('dark');\n    try { localStorage.theme = dark ? 'dark' : 'light'; } catch (e) {}\n    syncThemeButton();\n  });\n  syncThemeButton();\n\n  // ============ 偏好记忆 ============\n  function loadPrefs() {\n    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); }\n    catch (e) { return {}; }\n  }\n  function savePrefs() {\n    try {\n      localStorage.setItem(PREFS_KEY, JSON.stringify({\n        model: $('model').value,\n        prompt: $('prompt').value,\n        negativePrompt: $('negative_prompt').value,\n        width: $('width').value,\n        height: $('height').value,\n        num_steps: $('num_steps').value,\n        guidance: $('guidance').value,\n        seed: $('seed').value,\n        ratio: selectedRatio\n      }));\n    } catch (e) { /* 忽略存储异常 */ }\n  }\n\n  // ============ 状态提示 ============\n  function showStatus(message, type) {\n    var el = $('imageStatus');\n    if (!el) return;\n    el.className = 'status-' + (type || 'info');\n    el.textContent = message;\n    el.classList.remove('hidden');\n    if (statusTimer) clearTimeout(statusTimer);\n    statusTimer = setTimeout(function () { el.classList.add('hidden'); }, 5000);\n  }\n\n  // ============ 模型能力适配 ============\n  function capChipsFor(caps) {\n    var chips = [];\n    if (caps.size) chips.push({ t: '尺寸 ' + caps.size.min + '–' + caps.size.max + 'px', brand: false });\n    if (caps.aspectRatio) chips.push({ t: '多种画面比例', brand: false });\n    if (caps.negativePrompt) chips.push({ t: '反向提示词', brand: false });\n    if (caps.guidance) chips.push({ t: '引导系数 ' + caps.guidance.min + '–' + caps.guidance.max, brand: false });\n    if (caps.seed) chips.push({ t: '随机种子', brand: false });\n    if (caps.steps) chips.push({ t: '步数 ' + caps.steps.min + '–' + caps.steps.max, brand: false });\n    return chips;\n  }\n\n  function setSlider(slider, label, opts) {\n    // opts: {min, max, step, value, format}\n    var old = parseFloat(slider.value);\n    slider.min = opts.min; slider.max = opts.max; slider.step = opts.step;\n    var v = Number.isFinite(old) ? Math.min(opts.max, Math.max(opts.min, old)) : opts.value;\n    if (opts.reset) v = opts.value;\n    slider.value = v;\n    if (label) label.textContent = opts.format(v);\n  }\n\n  function fmtPx(v) { return v + 'px'; }\n  function fmtNum(v) { return String(v); }\n  function fmtGuidance(v) { return parseFloat(v).toFixed(1); }\n\n  function applyModelCapabilities(model, opts) {\n    var caps = model.capabilities || {};\n    currentModel = model;\n\n    // 模型信息与能力标签\n    $('modelInfo').textContent = model.description || '';\n    $('capChips').innerHTML = capChipsFor(caps).map(function (c) {\n      return '<span class=\"cap-chip' + (c.brand ? ' brand' : '') + '\">' + c.t + '</span>';\n    }).join('');\n\n    // 分组显隐\n    $('negativePromptGroup').classList.toggle('hidden', !caps.negativePrompt);\n    var sizeOn = !!caps.size;\n    $('widthGroup').classList.toggle('hidden', !sizeOn);\n    $('heightGroup').classList.toggle('hidden', !sizeOn);\n    $('aspectGroup').classList.toggle('hidden', !caps.aspectRatio);\n    $('guidanceGroup').classList.toggle('hidden', !caps.guidance);\n    $('seedGroup').classList.toggle('hidden', !caps.seed);\n\n    // 尺寸滑块\n    if (caps.size) {\n      setSlider($('width'), $('widthValue'), {\n        min: caps.size.min, max: caps.size.max, step: caps.size.step || 8,\n        value: caps.size.defaultWidth, reset: !!opts.reset, format: fmtPx });\n      setSlider($('height'), $('heightValue'), {\n        min: caps.size.min, max: caps.size.max, step: caps.size.step || 8,\n        value: caps.size.defaultHeight, reset: !!opts.reset, format: fmtPx });\n    }\n\n    // 步数滑块\n    if (caps.steps) {\n      $('stepsGroup').classList.remove('hidden');\n      setSlider($('num_steps'), $('num_stepsValue'), {\n        min: caps.steps.min, max: caps.steps.max, step: 1,\n        value: caps.steps.default, reset: !!opts.reset, format: fmtNum });\n    } else {\n      $('stepsGroup').classList.add('hidden');\n    }\n\n    // 引导系数滑块\n    if (caps.guidance) {\n      setSlider($('guidance'), $('guidanceValue'), {\n        min: caps.guidance.min, max: caps.guidance.max, step: 0.5,\n        value: caps.guidance.default, reset: !!opts.reset, format: fmtGuidance });\n    }\n\n    // 画面比例按钮\n    if (caps.aspectRatio) {\n      var row = $('ratioRow');\n      row.innerHTML = '';\n      caps.aspectRatio.forEach(function (r) {\n        var b = document.createElement('button');\n        b.type = 'button';\n        b.className = 'ratio-btn' + (r === selectedRatio ? ' active' : '');\n        b.textContent = r;\n        b.addEventListener('click', function () {\n          selectedRatio = r;\n          row.querySelectorAll('.ratio-btn').forEach(function (x) { x.classList.remove('active'); });\n          b.classList.add('active');\n          savePrefs();\n        });\n        row.appendChild(b);\n      });\n      if (!caps.aspectRatio.includes(selectedRatio)) {\n        selectedRatio = caps.aspectRatio[0];\n        var first = row.querySelector('.ratio-btn');\n        if (first) first.classList.add('active');\n      }\n    }\n  }\n\n  // ============ 模型列表加载 ============\n  async function loadModels() {\n    try {\n      var response = await fetch('/api/models');\n      if (!response.ok) throw new Error('HTTP ' + response.status);\n      availableModels = await response.json();\n      modelsById = {};\n      availableModels.forEach(function (m) { modelsById[m.id] = m; });\n\n      var modelSelect = $('model');\n      modelSelect.innerHTML = '';\n      availableModels.forEach(function (m) {\n        var option = document.createElement('option');\n        option.value = m.id;\n        option.textContent = m.name;\n        modelSelect.appendChild(option);\n      });\n\n      // 默认选中：记住的偏好 > default 标记 > 第一个\n      var prefs = loadPrefs();\n      var initial = (prefs.model && modelsById[prefs.model])\n        ? prefs.model\n        : (availableModels.find(function (m) { return m.default; }) || availableModels[0]).id;\n      modelSelect.value = initial;\n      applyModelCapabilities(modelsById[initial], { reset: true });\n\n      // 恢复记忆的高级参数（钳制到当前模型范围内）\n      if (prefs.width !== undefined) $('width').value = prefs.width;\n      if (prefs.height !== undefined) $('height').value = prefs.height;\n      if (prefs.num_steps !== undefined) $('num_steps').value = prefs.num_steps;\n      if (prefs.guidance !== undefined) $('guidance').value = prefs.guidance;\n      if (prefs.seed !== undefined) $('seed').value = prefs.seed;\n      if (prefs.prompt) $('prompt').value = prefs.prompt;\n      if (prefs.negativePrompt) $('negative_prompt').value = prefs.negativePrompt;\n      if (prefs.ratio) selectedRatio = prefs.ratio;\n      syncSliderLabels();\n    } catch (error) {\n      console.error('加载模型列表错误:', error);\n      showStatus('模型列表加载失败，请刷新页面重试', 'error');\n    }\n  }\n\n  function syncSliderLabels() {\n    $('widthValue').textContent = $('width').value + 'px';\n    $('heightValue').textContent = $('height').value + 'px';\n    $('num_stepsValue').textContent = $('num_steps').value;\n    $('guidanceValue').textContent = parseFloat($('guidance').value).toFixed(1);\n  }\n\n  async function loadRandomPrompts() {\n    try {\n      var response = await fetch('/api/prompts');\n      if (!response.ok) throw new Error('HTTP ' + response.status);\n      randomPromptsList = await response.json();\n    } catch (error) {\n      console.error('加载提示词错误:', error);\n      randomPromptsList = [];\n    }\n  }\n\n  loadModels();\n  loadRandomPrompts();\n\n  // 模型切换\n  $('model').addEventListener('change', function () {\n    var m = modelsById[this.value];\n    if (m) applyModelCapabilities(m, { reset: true });\n    savePrefs();\n  });\n\n  // ============ 高级选项折叠 ============\n  var toggleAdvanced = $('toggleAdvanced');\n  toggleAdvanced.addEventListener('click', function () {\n    var body = $('advancedOptions');\n    var open = body.classList.toggle('hidden') === false;\n    toggleAdvanced.classList.toggle('open', open);\n    toggleAdvanced.setAttribute('aria-expanded', open);\n  });\n\n  // ============ 滑块即时显示 ============\n  [['width', fmtPx], ['height', fmtPx], ['num_steps', fmtNum], ['guidance', fmtGuidance]]\n    .forEach(function (pair) {\n      $(pair[0]).addEventListener('input', function () {\n        $(pair[0] + 'Value').textContent = pair[1](this.value);\n      });\n      $(pair[0]).addEventListener('change', savePrefs);\n    });\n\n  // ============ 随机种子 / 随机提示词 ============\n  $('randomSeed').addEventListener('click', function () {\n    $('seed').value = Math.floor(Math.random() * 4294967295);\n    savePrefs();\n  });\n\n  $('randomButton').addEventListener('click', function () {\n    if (randomPromptsList.length > 0) {\n      var i = Math.floor(Math.random() * randomPromptsList.length);\n      $('prompt').value = randomPromptsList[i];\n      savePrefs();\n    } else {\n      showStatus('提示词库未加载，请稍后再试', 'warning');\n    }\n  });\n\n  ['prompt', 'negative_prompt', 'seed', 'password'].forEach(function (id) {\n    $(id).addEventListener('change', savePrefs);\n  });\n\n  // ============ 参数名称 ============\n  function formatParamName(name) {\n    var nameMap = {\n      prompt: '正向提示词',\n      negative_prompt: '反向提示词',\n      model: '文生图模型',\n      width: '图像宽度',\n      height: '图像高度',\n      num_steps: '迭代步数',\n      guidance: '引导系数',\n      seed: '随机种子',\n      aspect_ratio: '画面比例'\n    };\n    return nameMap[name] || name;\n  }\n\n  // ============ 生成请求 ============\n  function buildParams() {\n    var caps = currentModel.capabilities;\n    var params = {\n      password: $('password').value || '',\n      prompt: $('prompt').value.trim(),\n      model: currentModel.id\n    };\n    if (caps.negativePrompt) params.negative_prompt = $('negative_prompt').value.trim();\n    if (caps.size) {\n      params.width = parseInt($('width').value, 10);\n      params.height = parseInt($('height').value, 10);\n    }\n    if (caps.steps) params.num_steps = parseInt($('num_steps').value, 10);\n    if (caps.guidance) params.guidance = parseFloat($('guidance').value);\n    if (caps.seed) {\n      var seedStr = $('seed').value.trim();\n      // 注意 0 是合法种子：仅在未填写时省略，由服务端随机\n      if (seedStr !== '' && Number.isFinite(Number(seedStr))) params.seed = Math.trunc(Number(seedStr));\n    }\n    if (caps.aspectRatio) params.aspect_ratio = selectedRatio;\n    return params;\n  }\n\n  function setGenerating(on) {\n    isGenerating = on;\n    var btn = $('submitButton');\n    btn.disabled = on;\n    $('submitText').textContent = on ? '生成中…' : '生成图像';\n    btn.setAttribute('aria-busy', on);\n    var overlay = $('loadingOverlay');\n    if (on) {\n      overlay.classList.remove('hidden');\n      var start = performance.now();\n      $('elapsedTimer').textContent = '已等待 0.0s';\n      elapsedInterval = setInterval(function () {\n        $('elapsedTimer').textContent = '已等待 ' + ((performance.now() - start) / 1000).toFixed(1) + 's';\n      }, 100);\n    } else {\n      overlay.classList.add('hidden');\n      if (elapsedInterval) { clearInterval(elapsedInterval); elapsedInterval = null; }\n    }\n  }\n\n  async function generate() {\n    if (isGenerating) return;\n    if (!currentModel) { showStatus('模型尚未加载完成', 'warning'); return; }\n\n    var params = buildParams();\n    if (!params.prompt) {\n      showStatus('请先输入正向提示词', 'warning');\n      $('prompt').focus();\n      return;\n    }\n    currentImageParams = params;\n    savePrefs();\n\n    $('emptyState').classList.add('hidden');\n    $('aiImage').classList.add('hidden');\n    $('imageStatus').classList.add('hidden');\n    $('copyParamsButton').classList.add('hidden');\n    $('downloadButton').classList.add('hidden');\n\n    setGenerating(true);\n    var startTime = performance.now();\n\n    try {\n      var response = await fetch('/', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json', 'Accept': 'image/*' },\n        body: JSON.stringify(params)\n      });\n\n      if (!response.ok) {\n        var msg = '生成失败（HTTP ' + response.status + '）';\n        try {\n          var errData = await response.json();\n          if (errData && errData.error) msg = errData.error;\n          if (errData && errData.details) console.warn('[text2img] 服务端详情:', errData.details);\n        } catch (e) { /* 非 JSON 错误体 */ }\n        throw new Error(msg);\n      }\n\n      var blob = await response.blob();\n      if (!blob.type.startsWith('image/')) {\n        throw new Error('服务端返回的不是图像数据');\n      }\n      var generationTime = ((performance.now() - startTime) / 1000).toFixed(1);\n\n      // 用 Object URL 展示（内存占用远低于 base64），并释放上一张\n      if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl);\n      lastObjectUrl = URL.createObjectURL(blob);\n      lastBlob = blob;\n\n      var img = $('aiImage');\n      img.onload = function () {\n        $('generationTime').textContent = generationTime + ' 秒';\n        $('usedModel').textContent = currentModel.name;\n        $('imageMeta').textContent = blob.type === 'image/png' ? 'PNG' : 'JPEG';\n        $('metaRow').classList.remove('hidden');\n        updateParamsDisplay(params);\n        $('copyParamsButton').classList.remove('hidden');\n        $('downloadButton').classList.remove('hidden');\n        showStatus('生成成功', 'success');\n      };\n      img.onerror = function () {\n        showStatus('图像加载失败，请重试', 'error');\n        $('emptyState').classList.remove('hidden');\n      };\n      img.src = lastObjectUrl;\n      img.classList.remove('hidden');\n    } catch (error) {\n      console.error('生成图像错误:', error);\n      showStatus(error.message || '生成失败', 'error');\n      $('emptyState').classList.remove('hidden');\n    } finally {\n      setGenerating(false);\n    }\n  }\n\n  $('submitButton').addEventListener('click', generate);\n\n  // Ctrl/Cmd + Enter 快捷键\n  document.addEventListener('keydown', function (e) {\n    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {\n      e.preventDefault();\n      generate();\n    }\n  });\n\n  // ============ 参数展示 / 复制 ============\n  function updateParamsDisplay(params) {\n    var container = $('allParams');\n    container.innerHTML = '';\n    Object.keys(params).forEach(function (key) {\n      if (key === 'password') return;\n      var badge = document.createElement('span');\n      badge.className = 'param-badge';\n      var val = key === 'model' ? currentModel.name : params[key];\n      badge.innerHTML = '<b>' + formatParamName(key) + '</b>' + String(val)\n        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');\n      container.appendChild(badge);\n    });\n    $('allParamsContainer').classList.remove('hidden');\n  }\n\n  $('copyParamsButton').addEventListener('click', function () {\n    var lines = ['--- foxai 文生图参数 ---'];\n    Object.keys(currentImageParams).forEach(function (key) {\n      if (key === 'password') return;\n      var val = key === 'model' ? currentModel.name : currentImageParams[key];\n      lines.push(formatParamName(key) + ': ' + val);\n    });\n    navigator.clipboard.writeText(lines.join('\\n'))\n      .then(function () { showStatus('参数已复制到剪贴板', 'success'); })\n      .catch(function () { showStatus('复制失败，请手动复制', 'error'); });\n  });\n\n  // ============ 下载 ============\n  $('downloadButton').addEventListener('click', function () {\n    if (!lastBlob) { showStatus('没有可下载的图像', 'error'); return; }\n    var ext = lastBlob.type === 'image/png' ? 'png'\n      : (lastBlob.type === 'image/jpg' || lastBlob.type === 'image/jpeg') ? 'jpg' : 'img';\n    var url = URL.createObjectURL(lastBlob);\n    var link = document.createElement('a');\n    var timestamp = new Date().toISOString().replace(/[:.]/g, '-');\n    link.href = url;\n    link.download = currentModel.id + '-' + timestamp + '.' + ext;\n    document.body.appendChild(link);\n    link.click();\n    document.body.removeChild(link);\n    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);\n    showStatus('图像已开始下载', 'success');\n  });\n});\n</script>\n</body>\n</html>\n";

// =====================================================================
// 模型配置（唯一事实来源：服务端输入校验与前端 UI 均以此能力描述驱动）
//
// capabilities 字段说明（参数范围对照 Cloudflare 官方模型文档，2026-09 核实）:
//   transport:      'json' 直接传 JSON 参数 | 'multipart' 以 FormData 传参（FLUX.2 系列）
//   response:       'stream' AI.run 返回图像流 | 'base64' 返回 { image: base64 } JSON
//   mime:           响应 Content-Type，同时决定下载文件扩展名
//   negativePrompt: 是否支持反向提示词
//   size:           false 或 { min, max, step, defaultWidth, defaultHeight }
//   steps:          false 或 { param, min, max, default }（param 为该模型实际的参数名）
//   guidance:       false 或 { min, max, default }
//   seed:           是否支持随机种子
//   aspectRatio:    false 或可选比例数组（FLUX.2 [dev] 用比例而非像素尺寸）
//   promptMaxLen:   文档标注的提示词长度上限，null 表示未标注
// =====================================================================
const AVAILABLE_MODELS = [
  {
    id: 'flux-2-klein-9b',
    name: 'FLUX.2 [klein] 9B',
    description: '最新超快蒸馏模型，质量增强，生成与编辑一体（付费 Partner 模型）',
    key: '@cf/black-forest-labs/flux-2-klein-9b',
    default: false,
    capabilities: {
      transport: 'multipart',
      response: 'base64',
      mime: 'image/jpeg',
      negativePrompt: false,
      size: { min: 256, max: 2048, step: 64, defaultWidth: 1024, defaultHeight: 1024 },
      steps: { param: 'steps', min: 1, max: 50, default: 25 },
      guidance: false,
      seed: false,
      aspectRatio: false,
      promptMaxLen: null
    }
  },
  {
    id: 'flux-2-klein-4b',
    name: 'FLUX.2 [klein] 4B',
    description: '超快轻量蒸馏模型，适合实时预览与交互式工作流（付费 Partner 模型）',
    key: '@cf/black-forest-labs/flux-2-klein-4b',
    default: false,
    capabilities: {
      transport: 'multipart',
      response: 'base64',
      mime: 'image/jpeg',
      negativePrompt: false,
      size: { min: 256, max: 2048, step: 64, defaultWidth: 1024, defaultHeight: 1024 },
      steps: { param: 'steps', min: 1, max: 50, default: 25 },
      guidance: false,
      seed: false,
      aspectRatio: false,
      promptMaxLen: null
    }
  },
  {
    id: 'flux-2-dev',
    name: 'FLUX.2 [dev]',
    description: '高写实、高细节，支持多种画面比例（付费 Partner 模型）',
    key: '@cf/black-forest-labs/flux-2-dev',
    default: false,
    capabilities: {
      transport: 'multipart',
      response: 'base64',
      mime: 'image/jpeg',
      negativePrompt: false,
      size: false,
      steps: false,
      guidance: false,
      seed: true,
      aspectRatio: ['1:1', '4:3', '3:4', '3:2', '2:3', '16:9', '9:16'],
      promptMaxLen: 2048
    }
  },
  {
    id: 'lucid-origin',
    name: 'Lucid Origin',
    description: 'Leonardo 出品，提示词响应度高、文字渲染准确，支持全高清（付费 Partner 模型）',
    key: '@cf/leonardo/lucid-origin',
    default: false,
    capabilities: {
      transport: 'json',
      response: 'stream',
      mime: 'image/jpg',
      negativePrompt: false,
      size: { min: 256, max: 2500, step: 16, defaultWidth: 1120, defaultHeight: 1120 },
      steps: { param: 'num_steps', min: 1, max: 40, default: 30 },
      guidance: { min: 0, max: 10, default: 4.5 },
      seed: true,
      aspectRatio: false,
      promptMaxLen: null
    }
  },
  {
    id: 'phoenix-1.0',
    name: 'Phoenix 1.0',
    description: 'Leonardo 出品，提示词遵循度与文字连贯性出色（付费 Partner 模型）',
    key: '@cf/leonardo/phoenix-1.0',
    default: false,
    capabilities: {
      transport: 'json',
      response: 'stream',
      mime: 'image/jpg',
      negativePrompt: true,
      size: { min: 256, max: 2048, step: 64, defaultWidth: 1024, defaultHeight: 1024 },
      steps: { param: 'num_steps', min: 1, max: 50, default: 25 },
      guidance: { min: 2, max: 10, default: 2 },
      seed: true,
      aspectRatio: false,
      promptMaxLen: null
    }
  },
  {
    id: 'flux-1-schnell',
    name: 'FLUX.1 [schnell]',
    description: '120 亿参数整流流 Transformer，4 步出图，速度快质量好（推荐）',
    key: '@cf/black-forest-labs/flux-1-schnell',
    default: true,
    capabilities: {
      transport: 'json',
      response: 'base64',
      mime: 'image/jpeg',
      negativePrompt: false,
      size: false,
      steps: { param: 'steps', min: 1, max: 8, default: 4 },
      guidance: false,
      seed: false, // 注意：绑定实际校验不接受 seed（官方示例代码有误导，schema 表为准）
      aspectRatio: false,
      promptMaxLen: 2048
    }
  },
  {
    id: 'stable-diffusion-xl-base-1.0',
    name: 'Stable Diffusion XL Base 1.0',
    description: 'Stability AI 经典 SDXL 文生图模型，参数可调空间大',
    key: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    default: false,
    capabilities: {
      transport: 'json',
      response: 'stream',
      mime: 'image/png',
      negativePrompt: true,
      size: { min: 256, max: 2048, step: 64, defaultWidth: 1024, defaultHeight: 1024 },
      steps: { param: 'num_steps', min: 1, max: 20, default: 20 },
      guidance: { min: 0, max: 30, default: 7.5 },
      seed: true,
      aspectRatio: false,
      promptMaxLen: null
    }
  },
  {
    id: 'dreamshaper-8-lcm',
    name: 'DreamShaper 8 LCM',
    description: '增强真实感的 SD 微调模型，少步数即可出图',
    key: '@cf/lykon/dreamshaper-8-lcm',
    default: false,
    capabilities: {
      transport: 'json',
      response: 'stream',
      mime: 'image/png',
      negativePrompt: true,
      size: { min: 256, max: 2048, step: 64, defaultWidth: 1024, defaultHeight: 1024 },
      steps: { param: 'num_steps', min: 1, max: 20, default: 20 },
      guidance: { min: 0, max: 30, default: 7.5 },
      seed: true,
      aspectRatio: false,
      promptMaxLen: null
    }
  },
  {
    id: 'stable-diffusion-xl-lightning',
    name: 'Stable Diffusion XL Lightning',
    description: '字节跳动蒸馏加速模型，少步数高质量（实际 2-8 步效果最佳）',
    key: '@cf/bytedance/stable-diffusion-xl-lightning',
    default: false,
    capabilities: {
      transport: 'json',
      response: 'stream',
      mime: 'image/png',
      negativePrompt: true,
      size: { min: 256, max: 2048, step: 64, defaultWidth: 1024, defaultHeight: 1024 },
      steps: { param: 'num_steps', min: 1, max: 20, default: 8 },
      guidance: { min: 0, max: 30, default: 7.5 },
      seed: true,
      aspectRatio: false,
      promptMaxLen: null
    }
  }
];

// Random prompts list
const RANDOM_PROMPTS = [
  'cyberpunk cat samurai graphic art, blood splattered, beautiful colors',
  '1girl, solo, outdoors, camping, night, mountains, nature, stars, moon, tent, twin ponytails, green eyes, cheerful, happy, backpack, sleeping bag, camping stove, water bottle, mountain boots, gloves, sweater, hat, flashlight,forest, rocks, river, wood, smoke, shadows, contrast, clear sky, constellations, Milky Way',
  'masterpiece, best quality, amazing quality, very aesthetic, high resolution, ultra-detailed, absurdres, newest, scenery, anime, anime coloring, (dappled sunlight:1.2), rim light, backlit, dramatic shadow, 1girl, long blonde hair, blue eyes, shiny eyes, parted lips, medium breasts, puffy sleeve white dress, forest, flowers, white butterfly, looking at viewer',
  'frost_glass, masterpiece, best quality, absurdres, cute girl wearing red Christmas dress, holding small reindeer, hug, braided ponytail, sidelocks, hairclip, hair ornaments, green eyes, (snowy forest, moonlight, Christmas trees), (sparkles, sparkling clothes), frosted, snow, aurora, moon, night, sharp focus, highly detailed, abstract, flowing',
  '1girl, hatsune miku, white pupils, power elements, microphone, vibrant blue color palette, abstract,abstract background, dreamlike atmosphere, delicate linework, wind-swept hair, energy, masterpiece, best quality, amazing quality',
  'cyberpunk cat(neon lights:1.3) clutter,ultra detailed, ctrash, chaotic, low light, contrast, dark, rain ,at night ,cinematic , dystopic, broken ground, tunnels, skyscrapers',
  'Cyberpunk catgirl with purple hair, wearing leather and latex outfit with pink and purple cheetah print, holding a hand gun, black latex brassiere, glowing blue eyes with purple tech sunglasses, tail, large breasts, glowing techwear clothes, handguns, black leather jacket, tight shiny leather pants, cyberpunk alley background, Cyb3rWar3, Cyberware',
  'a wide aerial view of a floating elven city in the sky, with two elven figures walking side by side across a glowing skybridge, the bridge arching between tall crystal towers, surrounded by clouds and golden light, majestic and serene atmosphere, vivid style, magical fantasy architecture',
  'masterpiece, newest, absurdres,incredibly absurdres, best quality, amazing quality, very aesthetic, 1girl, very long hair, blonde, multi-tied hair, center-flap bangs, sunset, cumulonimbus cloud, old tree,sitting in tree, dark blue track suit, adidas, simple bird',
  'beautiful girl, breasts, curvy, looking down scope, looking away from viewer, laying on the ground, laying ontop of jacket, aiming a sniper rifle, dark braided hair, backwards hat, armor, sleeveless, arm sleeve tattoos, muscle tone, dogtags, sweaty, foreshortening, depth of field, at night, night, alpine, lightly snowing, dusting of snow, Closeup, detailed face, freckles',
];

// Passwords for authentication
// demo: const PASSWORDS = ['P@ssw0rd']
const PASSWORDS = []

// =====================================================================
// 输入处理辅助函数
// =====================================================================

// 统一 JSON 响应
function jsonResponse(obj, status, cors, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      ...cors,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extra
    }
  });
}

// 转为有限数值，非法返回 null（尊重 0 值，不用 || 兜底）
function toFinite(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// 整数钳制
function clampInt(v, min, max, dflt) {
  const n = toFinite(v);
  return n === null ? dflt : Math.min(max, Math.max(min, Math.round(n)));
}

// 浮点钳制
function clampFloat(v, min, max, dflt) {
  const n = toFinite(v);
  return n === null ? dflt : Math.min(max, Math.max(min, n));
}

// 尺寸钳制并向下对齐到 8 的倍数（各文生图模型对尺寸的共同要求）
function clampDim(v, size, dflt) {
  const n = clampInt(v, size.min, size.max, dflt);
  return n - (n % 8);
}

// 提示词清洗：去首尾空白，超长截断
function sanitizePrompt(v, maxLen) {
  let s = typeof v === 'string' ? v.trim() : '';
  return maxLen ? s.slice(0, maxLen) : s;
}

// 种子：有效整数直接用（含 0），否则生成完整 32 位随机数
function resolveSeed(v) {
  const n = toFinite(v);
  return n === null ? Math.floor(Math.random() * 4294967296) : Math.trunc(n);
}

// 按模型能力构建并钳制输入参数；提示词为空返回 null（由路由层回 400）
function buildInputs(model, data) {
  const c = model.capabilities;
  const inputs = {};

  const prompt = sanitizePrompt(data.prompt, c.promptMaxLen);
  if (!prompt) return null;
  inputs.prompt = prompt;

  if (c.steps) {
    inputs[c.steps.param] = clampInt(data.num_steps, c.steps.min, c.steps.max, c.steps.default);
  }
  if (c.negativePrompt) {
    // 仅在填写时发送（部分模型要求 minLength 1）
    const negative = sanitizePrompt(data.negative_prompt, c.promptMaxLen);
    if (negative) inputs.negative_prompt = negative;
  }
  if (c.size) {
    inputs.width = clampDim(data.width, c.size, c.size.defaultWidth);
    inputs.height = clampDim(data.height, c.size, c.size.defaultHeight);
  }
  if (c.guidance) {
    inputs.guidance = clampFloat(data.guidance, c.guidance.min, c.guidance.max, c.guidance.default);
  }
  if (c.seed) {
    inputs.seed = resolveSeed(data.seed);
  }
  if (c.aspectRatio) {
    inputs.aspect_ratio = c.aspectRatio.includes(data.aspect_ratio) ? data.aspect_ratio : c.aspectRatio[0];
  }
  return inputs;
}

// 调用模型：json 直传参数；multipart（FLUX.2 系列）序列化为 FormData 传输
async function runModel(env, model, inputs) {
  const c = model.capabilities;
  if (c.transport === 'multipart') {
    const form = new FormData();
    for (const [k, v] of Object.entries(inputs)) {
      form.append(k, String(v));
    }
    // FormData 需先序列化才能取得带 boundary 的 Content-Type（官方文档示例做法）
    const serialized = new Response(form);
    return env.AI.run(model.key, {
      multipart: {
        body: serialized.body,
        contentType: serialized.headers.get('content-type')
      }
    });
  }
  return env.AI.run(model.key, inputs);
}

// 从 base64 前缀嗅探实际图片格式（JPEG: /9j/ ，PNG: iVBOR）
function sniffImageMime(base64) {
  if (typeof base64 !== 'string' || base64.length < 4) return null;
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBOR')) return 'image/png';
  return null;
}

// base64 转二进制
function base64ToBytes(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// =====================================================================
// Worker 入口
// =====================================================================
export default {
  async fetch(request, env) {
    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // 模型清单（含能力描述，前端据此适配控件）
      if (path === '/api/models') {
        if (request.method !== 'GET') {
          return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
        }
        return jsonResponse(AVAILABLE_MODELS, 200, corsHeaders);
      }

      // 随机提示词
      if (path === '/api/prompts') {
        if (request.method !== 'GET') {
          return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
        }
        return jsonResponse(RANDOM_PROMPTS, 200, corsHeaders);
      }

      // 图像生成（仅接受 POST /）
      if (request.method === 'POST' && (path === '/' || path === '/api/generate')) {
        let data;
        try {
          data = await request.json();
        } catch (e) {
          return jsonResponse({ error: '请求体不是有效的 JSON', details: e.message }, 400, corsHeaders);
        }

        // 密码校验
        if (PASSWORDS.length > 0 && (!data.password || !PASSWORDS.includes(data.password))) {
          return jsonResponse({ error: '请输入正确的访问密码' }, 403, corsHeaders);
        }

        if (!('prompt' in data) || !('model' in data)) {
          return jsonResponse({ error: '缺少必需参数: prompt 或 model' }, 400, corsHeaders);
        }

        const selectedModel = AVAILABLE_MODELS.find(m => m.id === data.model);
        if (!selectedModel) {
          return jsonResponse({ error: '模型无效，请刷新页面后重试' }, 400, corsHeaders);
        }

        const inputs = buildInputs(selectedModel, data);
        if (!inputs) {
          return jsonResponse({ error: '提示词不能为空' }, 400, corsHeaders);
        }

        // 记录钳制后的数值参数（不记录提示词内容，便于在控制台日志核实校验生效）
        const logParams = { ...inputs, prompt: `<${inputs.prompt.length} chars>` };
        console.log(`[text2img] ${selectedModel.id}: ${JSON.stringify(logParams)}`);

        try {
          const response = await runModel(env, selectedModel, inputs);
          const c = selectedModel.capabilities;

          if (c.response === 'base64') {
            // FLUX 系列返回 { image: base64 }（可能是对象或 JSON 字符串）
            let jsonResponseData;
            if (typeof response === 'object' && response !== null) {
              jsonResponseData = response;
            } else {
              try {
                jsonResponseData = JSON.parse(response);
              } catch (e) {
                return jsonResponse({ error: '解析模型响应失败', details: e.message }, 500, corsHeaders);
              }
            }

            if (!jsonResponseData || !jsonResponseData.image) {
              return jsonResponse({ error: '模型响应中没有图像数据' }, 500, corsHeaders);
            }

            try {
              const bytes = base64ToBytes(jsonResponseData.image);
              const mime = sniffImageMime(jsonResponseData.image) || c.mime;
              return new Response(bytes, {
                headers: {
                  ...corsHeaders,
                  'Content-Type': mime,
                  'Cache-Control': 'no-store',
                  'X-Content-Type-Options': 'nosniff'
                }
              });
            } catch (e) {
              return jsonResponse({ error: '图像数据处理失败', details: e.message }, 500, corsHeaders);
            }
          } else {
            // SD / Leonardo 系列直接返回图像流
            return new Response(response, {
              headers: {
                ...corsHeaders,
                'Content-Type': c.mime,
                'Cache-Control': 'no-store',
                'X-Content-Type-Options': 'nosniff'
              }
            });
          }
        } catch (aiError) {
          console.error('[text2img] AI generation error:', aiError);
          return jsonResponse({ error: '图像生成失败，请稍后重试', details: aiError.message }, 500, corsHeaders);
        }
      }

      // 页面托管（GET/HEAD）。no-store：页面由 Worker 即时返回，
      // 避免边缘缓存导致重新部署后仍看到旧页面
      if ((request.method === 'GET' || request.method === 'HEAD') && (path === '/' || path.endsWith('.html'))) {
        return new Response(HTML, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }

      return jsonResponse({ error: 'Not Found' }, 404, corsHeaders);
    } catch (error) {
      console.error('[text2img] Worker error:', error);
      return jsonResponse({ error: '服务器内部错误', details: error.message }, 500, corsHeaders);
    }
  },
};
