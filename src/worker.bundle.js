/**
 * foxai Text2img — 基于 Cloudflare Workers AI 的在线文生图服务
 *
 * @author: kared / foxai
 * @create_date: 2025-05-10
 * @last_edit_time: 2026-09-03
 * @description: Cloudflare Worker：模型能力清单 / 输入校验 / 图像生成 API + 页面托管
 */

// import html template
const HTML = "<!DOCTYPE html>\n<html lang=\"zh\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<meta name=\"app-version\" content=\"2026.09.03-5\">\n<title>foxai · 免费在线文生图</title>\n<script>\n/* 主题初始化：必须在样式表加载前执行，避免深色用户看到亮色闪烁 */\n(function () {\n  try {\n    if (localStorage.theme === 'dark' ||\n        (!('theme' in localStorage) && matchMedia('(prefers-color-scheme: dark)').matches)) {\n      document.documentElement.classList.add('dark');\n    }\n  } catch (e) { /* 隐私模式下 localStorage 可能不可用 */ }\n})();\n</script>\n<!-- foxai Tile favicon（LOGO 规范：固定 Light Ember 底 + 反白 Mark） -->\n<link rel=\"icon\" type=\"image/svg+xml\" href=\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2064%2064'%3E%3Crect%20width='64'%20height='64'%20rx='14'%20fill='%23E2571F'/%3E%3Cg%20fill='none'%20stroke='%23FFFFFF'%20stroke-width='7.5'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M23%2055V22c0-7.2%205.8-13%2013-13h2'/%3E%3Cpath%20d='M12.5%2031h21'/%3E%3C/g%3E%3Ccircle%20cx='49'%20cy='9'%20r='5.5'%20fill='%23FFFFFF'/%3E%3C/svg%3E\">\n<style>\n/* ===================== 设计令牌（foxai 品牌规范，Light/Dark 双值） ===================== */\n:root {\n  --brand: #E2571F;                       /* Ember (light) */\n  --brand-foreground: #FFFFFF;\n  --brand-muted: rgba(226, 87, 31, 0.12);\n  --brand-ring: rgba(226, 87, 31, 0.35);\n\n  --bg: #F6F7F8;\n  --surface: #FFFFFF;\n  --surface-2: #F1F2F4;\n  --border: #E3E5E9;\n  --text: #1A1D21;\n  --text-soft: #5C636B;\n\n  --success: #0E9F6E;\n  --error: #DC2626;\n  --warning: #B45309;\n  --info: #2563EB;\n  --success-bg: rgba(14, 159, 110, 0.14);\n  --error-bg: rgba(220, 38, 38, 0.12);\n  --warning-bg: rgba(180, 83, 9, 0.14);\n  --info-bg: rgba(37, 99, 235, 0.12);\n\n  --shadow: 0 1px 2px rgba(16, 24, 40, 0.05);\n  --shadow-lg: 0 12px 32px -12px rgba(16, 24, 40, 0.18);\n  --radius: 12px;\n}\n.dark {\n  --brand: #FF7A4D;                       /* Ember (dark, lifted) */\n  --brand-foreground: #1A1A1A;\n  --brand-muted: rgba(255, 122, 77, 0.16);\n  --brand-ring: rgba(255, 122, 77, 0.45);\n\n  --bg: #101214;\n  --surface: #191C1F;\n  --surface-2: #22262A;\n  --border: #2C3136;\n  --text: #EFF1F2;\n  --text-soft: #9AA1A9;\n\n  --success: #3DD68C;\n  --error: #F28B82;\n  --warning: #FBBF24;\n  --info: #7EB3FF;\n  --success-bg: rgba(61, 214, 140, 0.14);\n  --error-bg: rgba(242, 139, 130, 0.14);\n  --warning-bg: rgba(251, 191, 36, 0.14);\n  --info-bg: rgba(126, 179, 255, 0.14);\n\n  --shadow: 0 1px 2px rgba(0, 0, 0, 0.4);\n  --shadow-lg: 0 12px 32px -12px rgba(0, 0, 0, 0.6);\n}\n\n/* ===================== 基础 ===================== */\n* { box-sizing: border-box; }\nhtml { -webkit-text-size-adjust: 100%; }\nbody {\n  margin: 0;\n  background: var(--bg);\n  color: var(--text);\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\",\n    \"Hiragino Sans GB\", \"Microsoft YaHei\", Roboto, Helvetica, Arial, sans-serif;\n  font-size: 14px;\n  line-height: 1.55;\n  transition: background-color 0.25s ease, color 0.25s ease;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n}\n.icon { width: 16px; height: 16px; stroke: currentColor; stroke-width: 2; fill: none;\n  stroke-linecap: round; stroke-linejoin: round; vertical-align: -3px; flex-shrink: 0; }\n.hidden { display: none !important; }\na { color: var(--brand); text-decoration: none; }\n\n/* ===================== 顶栏 ===================== */\n.topbar {\n  position: sticky; top: 0; z-index: 50;\n  background: var(--surface);\n  border-bottom: 1px solid var(--border);\n  height: 56px;\n  display: flex; align-items: center; justify-content: space-between;\n  padding: 0 20px;\n}\n/* foxai Lockup（LOGO 规范 §2.3：Mark 与 \"ai\" 同用品牌色，\"fox\" 中性墨色，600 字重，-0.01em） */\n.lockup { display: inline-flex; align-items: center; gap: 8px; }\n.lockup svg { width: 26px; height: 26px; }\n.lockup .word { font-weight: 600; letter-spacing: -0.01em; font-size: 16px; line-height: 1; color: var(--text); }\n.lockup .word .ai { color: var(--brand); }\n.topbar-sub { color: var(--text-soft); font-size: 13px; margin-left: 10px; padding-left: 12px;\n  border-left: 1px solid var(--border); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.topbar-actions { display: flex; align-items: center; gap: 8px; }\n\n/* 主题三态切换（自动 / 亮 / 暗） */\n.theme-seg {\n  display: inline-flex; align-items: center;\n  background: var(--surface-2); border: 1px solid var(--border);\n  border-radius: 999px; padding: 2px; gap: 2px;\n}\n.theme-seg button {\n  display: inline-flex; align-items: center; justify-content: center; gap: 4px;\n  border: none; background: transparent; color: var(--text-soft);\n  border-radius: 999px; padding: 4px 10px; font: inherit; font-size: 12px;\n  cursor: pointer; transition: all 0.15s ease;\n}\n.theme-seg button .icon { width: 13px; height: 13px; }\n.theme-seg button:hover { color: var(--text); }\n.theme-seg button.active { background: var(--surface); color: var(--brand); box-shadow: var(--shadow); font-weight: 600; }\n\n/* ===================== 布局 ===================== */\n.layout {\n  flex: 1; width: 100%; max-width: 1400px;\n  margin: 0 auto; padding: 20px;\n  display: flex; gap: 20px; align-items: flex-start;\n}\n.composer { width: 400px; flex-shrink: 0; display: flex; flex-direction: column; gap: 14px; }\n.stage-col { flex: 1; min-width: 0; }\n\n.card {\n  background: var(--surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius);\n  box-shadow: var(--shadow);\n  padding: 16px;\n}\n.card-title {\n  display: flex; align-items: center; gap: 6px;\n  font-size: 13px; font-weight: 600; color: var(--text-soft);\n  text-transform: uppercase; letter-spacing: 0.03em;\n  margin: 0 0 10px;\n}\n.card-title .icon { width: 14px; height: 14px; color: var(--brand); }\n.card-title .spacer { flex: 1; }\n\n/* ===================== 表单控件 ===================== */\ntextarea, select, input {\n  width: 100%;\n  background: var(--surface);\n  color: var(--text);\n  border: 1px solid var(--border);\n  border-radius: 8px;\n  padding: 9px 12px;\n  font: inherit;\n  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.25s ease;\n}\ntextarea { resize: vertical; min-height: 96px; }\ntextarea:focus, select:focus, input:focus {\n  outline: none;\n  border-color: var(--brand);\n  box-shadow: 0 0 0 3px var(--brand-ring);\n}\n.field { margin-bottom: 14px; }\n.field:last-child { margin-bottom: 0; }\n.field-label {\n  display: flex; align-items: center; justify-content: space-between;\n  font-size: 13px; font-weight: 600; margin-bottom: 6px;\n}\n.field-label .icon { width: 13px; height: 13px; margin-right: 4px; color: var(--text-soft); }\n.hint { font-size: 12px; color: var(--text-soft); margin-top: 4px; }\n\n/* 滑块 */\n.slider-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }\n.slider-value { font-variant-numeric: tabular-nums; font-size: 13px; color: var(--text-soft);\n  background: var(--surface-2); border-radius: 6px; padding: 1px 8px; }\n.slider {\n  -webkit-appearance: none; appearance: none;\n  width: 100%; height: 5px; border-radius: 5px;\n  background: var(--border); outline: none; margin: 10px 0;\n}\n.slider::-webkit-slider-thumb {\n  -webkit-appearance: none; appearance: none;\n  width: 16px; height: 16px; border-radius: 50%;\n  background: var(--brand); cursor: pointer; border: none;\n  transition: transform 0.15s ease, box-shadow 0.15s ease;\n}\n.slider::-webkit-slider-thumb:hover { transform: scale(1.2); box-shadow: 0 0 0 4px var(--brand-ring); }\n.slider::-moz-range-thumb {\n  width: 16px; height: 16px; border-radius: 50%;\n  background: var(--brand); cursor: pointer; border: none;\n}\n.slider::-moz-range-thumb:hover { transform: scale(1.2); box-shadow: 0 0 0 4px var(--brand-ring); }\n\n/* 按钮 */\n.btn {\n  display: inline-flex; align-items: center; justify-content: center; gap: 6px;\n  border: 1px solid var(--border); border-radius: 8px;\n  background: var(--surface); color: var(--text);\n  font: inherit; font-weight: 500;\n  padding: 7px 12px; cursor: pointer;\n  transition: all 0.2s ease;\n}\n.btn:hover { background: var(--surface-2); }\n.btn:focus-visible { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-ring); }\n.btn-icon { width: 34px; height: 34px; padding: 0; }\n.btn-soft { background: var(--brand-muted); color: var(--brand); border-color: transparent; }\n.btn-soft:hover { background: var(--brand-muted); filter: brightness(1.08); }\n/* 主按钮（LOGO 规范：底 --brand 字 --brand-foreground，hover brightness(1.1)，无渐变） */\n.btn-primary {\n  background: var(--brand); color: var(--brand-foreground);\n  border: none; border-radius: 10px;\n  font-size: 15px; font-weight: 600;\n  padding: 13px 20px; width: 100%;\n  box-shadow: 0 4px 14px -4px var(--brand-ring);\n}\n.btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }\n.btn-primary:active:not(:disabled) { transform: translateY(0); filter: brightness(0.98); }\n.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }\n.btn-primary:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--brand-ring); }\n\n/* 模型信息与能力标签 */\n.model-info { margin-top: 8px; font-size: 12.5px; color: var(--text-soft); }\n.cap-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }\n.cap-chip {\n  font-size: 11.5px; color: var(--text-soft);\n  background: var(--surface-2); border-radius: 999px; padding: 2px 9px;\n}\n.cap-chip.brand { color: var(--brand); background: var(--brand-muted); }\n\n/* 画面比例选择（FLUX.2 [dev]） */\n.ratio-row { display: flex; flex-wrap: wrap; gap: 6px; }\n.ratio-btn {\n  border: 1px solid var(--border); background: var(--surface); color: var(--text-soft);\n  border-radius: 8px; padding: 5px 12px; font: inherit; font-size: 13px;\n  cursor: pointer; transition: all 0.15s ease;\n}\n.ratio-btn:hover { border-color: var(--brand); color: var(--brand); }\n.ratio-btn.active { background: var(--brand); border-color: var(--brand); color: var(--brand-foreground); font-weight: 600; }\n\n/* 生成数量分段选择 */\n.seg { display: flex; gap: 6px; }\n.seg-btn {\n  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 5px;\n  border: 1px solid var(--border); background: var(--surface); color: var(--text-soft);\n  border-radius: 8px; padding: 7px 8px; font: inherit; font-size: 13px;\n  cursor: pointer; transition: all 0.15s ease;\n}\n.seg-btn:hover { border-color: var(--brand); color: var(--brand); }\n.seg-btn.active { background: var(--brand); border-color: var(--brand); color: var(--brand-foreground); font-weight: 600; }\n\n/* 高级选项折叠 */\n.adv-toggle { width: 100%; justify-content: space-between; }\n.adv-toggle .icon.chevron { transition: transform 0.2s ease; }\n.adv-toggle.open .icon.chevron { transform: rotate(180deg); }\n.adv-body { margin-top: 14px; border-top: 1px dashed var(--border); padding-top: 14px; }\n\n/* 生成快捷键提示 */\n.kbd-hint { text-align: center; font-size: 12px; color: var(--text-soft); margin-top: 8px; }\n.kbd-hint kbd {\n  background: var(--surface-2); border: 1px solid var(--border); border-bottom-width: 2px;\n  border-radius: 5px; padding: 0 5px; font-size: 11px; font-family: inherit;\n}\n\n/* ===================== 结果画布 ===================== */\n.stage-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }\n.stage-actions { display: flex; gap: 8px; }\n.stage {\n  position: relative;\n  background: var(--surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius);\n  box-shadow: var(--shadow);\n  min-height: 480px;\n  display: flex; align-items: center; justify-content: center;\n  overflow: hidden;\n  padding: 16px;\n}\n.stage-empty { text-align: center; color: var(--text-soft); user-select: none; }\n.stage-empty svg.mark { width: 88px; height: 88px; opacity: 0.22; margin-bottom: 12px; }\n.stage-empty p { margin: 4px 0; font-size: 13.5px; }\n\n/* 结果网格（单图 / 2 图 / 2×2） */\n.results-grid { display: grid; gap: 12px; width: 100%; }\n.results-grid[data-count=\"1\"] { grid-template-columns: 1fr; }\n.results-grid[data-count=\"2\"],\n.results-grid[data-count=\"4\"] { grid-template-columns: 1fr 1fr; }\n.result-cell {\n  position: relative; margin: 0; overflow: hidden;\n  border-radius: 10px; background: var(--surface-2);\n  border: 1px solid var(--border);\n  display: flex; align-items: center; justify-content: center;\n  min-height: 180px;\n  animation: cellIn 0.3s ease;\n}\n@keyframes cellIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: none; } }\n.result-cell.done { cursor: zoom-in; }\n.result-cell img { max-width: 100%; max-height: 100%; display: block; }\n.results-grid[data-count=\"1\"] .result-cell img { max-height: min(72vh, 920px); }\n.results-grid:not([data-count=\"1\"]) .result-cell img { max-height: 480px; }\n\n/* 单格加载 / 失败状态 */\n.cell-state {\n  display: flex; flex-direction: column; align-items: center; justify-content: center;\n  gap: 10px; padding: 28px 14px; color: var(--text-soft);\n  font-size: 12.5px; text-align: center;\n}\n.cell-state .spinner { width: 24px; height: 24px; border-width: 2.5px; margin: 0; }\n.cell-state .icon.alert { width: 22px; height: 22px; color: var(--error); }\n.cell-error-text { max-width: 92%; word-break: break-word; }\n\n.spinner {\n  width: 34px; height: 34px; border-radius: 50%;\n  border: 3px solid var(--brand-muted); border-top-color: var(--brand);\n  animation: spin 0.8s linear infinite; margin: 0 auto 12px;\n}\n@keyframes spin { to { transform: rotate(360deg); } }\n\n/* 悬停操作（查看 / 下载） */\n.cell-actions {\n  position: absolute; top: 8px; right: 8px; display: flex; gap: 6px;\n  opacity: 0; transition: opacity 0.15s ease;\n}\n.result-cell:hover .cell-actions,\n.result-cell:focus-within .cell-actions { opacity: 1; }\n.cell-actions .btn {\n  background: color-mix(in srgb, var(--surface) 86%, transparent);\n  backdrop-filter: blur(4px);\n}\n\n/* 灯箱（大图查看） */\n.lightbox {\n  position: fixed; inset: 0; z-index: 100;\n  background: rgba(8, 9, 10, 0.9);\n  display: flex; align-items: center; justify-content: center;\n}\n.lightbox img { max-width: 92vw; max-height: 82vh; border-radius: 8px; box-shadow: var(--shadow-lg); }\n.lb-btn {\n  position: absolute; display: inline-flex; align-items: center; justify-content: center;\n  width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer;\n  background: rgba(255, 255, 255, 0.12); color: #FFF;\n  transition: background 0.15s ease;\n}\n.lb-btn:hover { background: rgba(255, 255, 255, 0.26); }\n.lb-close { top: 18px; right: 18px; }\n.lb-nav.left { left: 18px; top: 50%; transform: translateY(-50%); }\n.lb-nav.right { right: 18px; top: 50%; transform: translateY(-50%); }\n.lb-bar {\n  position: absolute; bottom: 22px; left: 0; right: 0;\n  display: flex; align-items: center; justify-content: center; gap: 14px;\n  color: #FFF; font-size: 13.5px; font-variant-numeric: tabular-nums;\n}\n.lb-bar .btn { background: rgba(255, 255, 255, 0.12); color: #FFF; border: none; }\n.lb-bar .btn:hover { background: rgba(255, 255, 255, 0.26); }\n\n/* 状态徽章（半透明底色，双主题自适应） */\n#imageStatus {\n  position: absolute; bottom: 14px; left: 14px; z-index: 20;\n  padding: 4px 12px; border-radius: 999px;\n  font-size: 12.5px; font-weight: 500;\n  box-shadow: var(--shadow);\n  transition: all 0.3s ease;\n}\n.status-success { background: var(--success-bg); color: var(--success); }\n.status-error   { background: var(--error-bg);   color: var(--error); }\n.status-warning { background: var(--warning-bg); color: var(--warning); }\n.status-info    { background: var(--info-bg);    color: var(--info); }\n\n/* 结果元信息 */\n.meta-row {\n  display: flex; flex-wrap: wrap; gap: 8px 24px;\n  margin-top: 14px; font-size: 13px; color: var(--text-soft);\n}\n.meta-row .icon { width: 13px; height: 13px; margin-right: 4px; }\n.meta-row b { color: var(--text); font-weight: 600; }\n\n/* 参数徽章 */\n.param-badge {\n  background: var(--surface); border: 1px solid var(--border);\n  color: var(--text);\n  padding: 3px 10px; border-radius: 6px;\n  font-size: 12px; display: inline-block;\n}\n.param-badge b { font-weight: 600; color: var(--text-soft); margin-right: 2px; }\n\n/* ===================== 页脚 ===================== */\n.footer {\n  text-align: center; color: var(--text-soft); font-size: 12.5px;\n  padding: 18px 20px 22px;\n}\n.footer a { color: inherit; text-decoration: underline; text-underline-offset: 3px; }\n.footer a:hover { color: var(--brand); }\n\n/* ===================== 响应式 ===================== */\n/* 触屏设备无 hover：结果格操作按钮常显 */\n@media (hover: none) {\n  .cell-actions { opacity: 1; }\n}\n\n@media (max-width: 960px) {\n  .layout { flex-direction: column; padding: 14px; gap: 14px; }\n  .composer { width: 100%; }\n  .stage { min-height: 360px; padding: 12px; }\n  .topbar { padding: 0 14px; }\n  .topbar-sub { display: none; }\n  /* iOS Safari 聚焦 <16px 输入框会自动放大页面 */\n  textarea, select, input { font-size: 16px; }\n  textarea { min-height: 88px; }\n  /* 网格更紧凑，多图上限高度收缩 */\n  .results-grid { gap: 8px; }\n  .results-grid:not([data-count=\"1\"]) .result-cell img { max-height: 320px; }\n  .cell-actions .btn { width: 30px; height: 30px; }\n  /* 触屏无键盘，隐藏快捷键提示 */\n  .kbd-hint { display: none; }\n  .footer { padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px)); }\n}\n\n@media (max-width: 640px) {\n  /* 灯箱：导航按钮缩小贴边，避免遮挡图片 */\n  .lb-close { top: 10px; right: 10px; width: 36px; height: 36px; }\n  .lb-nav.left { left: 6px; }\n  .lb-nav.right { right: 6px; }\n  .lb-nav { width: 36px; height: 36px; }\n  .lightbox img { max-width: 94vw; max-height: 76vh; }\n  .lb-bar { bottom: calc(14px + env(safe-area-inset-bottom, 0px)); }\n}\n\n@media (max-width: 480px) {\n  .topbar { padding: 0 10px; gap: 6px; }\n  .lockup svg { width: 22px; height: 22px; }\n  /* 主题切换的“自动”仅留图标，给标识留出空间 */\n  .theme-seg button { padding: 4px 7px; }\n  .theme-seg .seg-label { display: none; }\n  .ratio-row { gap: 5px; }\n  .ratio-btn { padding: 5px 9px; font-size: 12.5px; }\n  .meta-row { gap: 6px 16px; font-size: 12.5px; }\n}\n</style>\n</head>\n<body>\n\n<!-- 内联 SVG 图标库（Feather 风格，MIT License） -->\n<svg xmlns=\"http://www.w3.org/2000/svg\" style=\"display:none\" aria-hidden=\"true\">\n  <symbol id=\"i-moon\" viewBox=\"0 0 24 24\"><path d=\"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\"/></symbol>\n  <symbol id=\"i-sun\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"5\"/><path d=\"M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42\"/></symbol>\n  <symbol id=\"i-github\" viewBox=\"0 0 24 24\"><path d=\"M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22\"/></symbol>\n  <symbol id=\"i-shuffle\" viewBox=\"0 0 24 24\"><path d=\"M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5\"/></symbol>\n  <symbol id=\"i-copy\" viewBox=\"0 0 24 24\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\"/><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"/></symbol>\n  <symbol id=\"i-download\" viewBox=\"0 0 24 24\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3\"/></symbol>\n  <symbol id=\"i-chevron\" viewBox=\"0 0 24 24\"><path d=\"M6 9l6 6 6-6\"/></symbol>\n  <symbol id=\"i-zap\" viewBox=\"0 0 24 24\"><path d=\"M13 2 3 14h9l-1 8 10-12h-9l1-8z\"/></symbol>\n  <symbol id=\"i-clock\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 6v6l4 2\"/></symbol>\n  <symbol id=\"i-cpu\" viewBox=\"0 0 24 24\"><rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2\"/><rect x=\"9\" y=\"9\" width=\"6\" height=\"6\"/><path d=\"M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3\"/></symbol>\n  <symbol id=\"i-refresh\" viewBox=\"0 0 24 24\"><path d=\"M23 4v6h-6M1 20v-6h6\"/><path d=\"M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15\"/></symbol>\n  <symbol id=\"i-image\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><circle cx=\"8.5\" cy=\"8.5\" r=\"1.5\"/><path d=\"M21 15l-5-5L5 21\"/></symbol>\n  <symbol id=\"i-lock\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/></symbol>\n  <symbol id=\"i-sliders\" viewBox=\"0 0 24 24\"><path d=\"M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6\"/></symbol>\n  <symbol id=\"i-ban\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M4.93 4.93l14.14 14.14\"/></symbol>\n  <symbol id=\"i-seed\" viewBox=\"0 0 24 24\"><path d=\"M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></symbol>\n  <symbol id=\"i-edit\" viewBox=\"0 0 24 24\"><path d=\"M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z\"/></symbol>\n  <symbol id=\"i-x\" viewBox=\"0 0 24 24\"><path d=\"M18 6L6 18M6 6l12 12\"/></symbol>\n  <symbol id=\"i-left\" viewBox=\"0 0 24 24\"><path d=\"M15 18l-6-6 6-6\"/></symbol>\n  <symbol id=\"i-right\" viewBox=\"0 0 24 24\"><path d=\"M9 18l6-6-6-6\"/></symbol>\n  <symbol id=\"i-maximize\" viewBox=\"0 0 24 24\"><path d=\"M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3\"/></symbol>\n  <symbol id=\"i-layers\" viewBox=\"0 0 24 24\"><path d=\"M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5\"/></symbol>\n  <symbol id=\"i-alert\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 8v4M12 16h.01\"/></symbol>\n  <symbol id=\"i-monitor\" viewBox=\"0 0 24 24\"><rect x=\"2\" y=\"3\" width=\"20\" height=\"14\" rx=\"2\"/><path d=\"M8 21h8M12 17v4\"/></symbol>\n</svg>\n\n<!-- 顶栏 -->\n<header class=\"topbar\">\n  <div style=\"display:flex;align-items:center;min-width:0;\">\n    <!-- foxai Lockup（严格遵循 LOGO.html §2.3 定稿） -->\n    <span class=\"lockup\" aria-label=\"foxai\">\n      <svg viewBox=\"0 0 64 64\" role=\"img\" aria-hidden=\"true\">\n        <g fill=\"none\" stroke=\"var(--brand)\" stroke-width=\"7.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n          <path d=\"M23 55V22c0-7.2 5.8-13 13-13h2\"/>\n          <path d=\"M12.5 31h21\"/>\n        </g>\n        <circle cx=\"49\" cy=\"9\" r=\"5.5\" fill=\"var(--brand)\"/>\n      </svg>\n      <span class=\"word\">fox<span class=\"ai\">ai</span></span>\n    </span>\n    <span class=\"topbar-sub\">免费在线文生图 · Cloudflare Workers AI</span>\n  </div>\n  <div class=\"topbar-actions\">\n    <div class=\"theme-seg\" id=\"themeSeg\" role=\"group\" aria-label=\"主题模式\">\n      <button type=\"button\" data-mode=\"auto\" title=\"跟随系统主题\">\n        <svg class=\"icon\"><use href=\"#i-monitor\"/></svg><span class=\"seg-label\">自动</span>\n      </button>\n      <button type=\"button\" data-mode=\"light\" title=\"亮色模式\" aria-label=\"亮色模式\">\n        <svg class=\"icon\"><use href=\"#i-sun\"/></svg>\n      </button>\n      <button type=\"button\" data-mode=\"dark\" title=\"暗色模式\" aria-label=\"暗色模式\">\n        <svg class=\"icon\"><use href=\"#i-moon\"/></svg>\n      </button>\n    </div>\n    <button id=\"githubBtn\" class=\"btn btn-icon\" aria-label=\"项目地址\" title=\"GitHub 项目\"\n            onclick=\"window.open('https://github.com/LisaPullman/foxai-Text2img-Cloudflare-Workers', '_blank')\">\n      <svg class=\"icon\"><use href=\"#i-github\"/></svg>\n    </button>\n  </div>\n</header>\n\n<div class=\"layout\">\n  <!-- 左侧：创作面板 -->\n  <div class=\"composer\">\n    <section class=\"card\">\n      <h2 class=\"card-title\"><svg class=\"icon\"><use href=\"#i-cpu\"/></svg>模型</h2>\n      <select id=\"model\" aria-label=\"选择文生图模型\">\n        <option value=\"\" disabled selected>加载中…</option>\n      </select>\n      <div class=\"model-info\" id=\"modelInfo\"></div>\n      <div class=\"cap-chips\" id=\"capChips\"></div>\n\n      <div class=\"field\" id=\"ratioGroup\" style=\"margin-top:14px;margin-bottom:0;\">\n        <div class=\"field-label\">\n          <span>画面比例</span>\n          <span class=\"hint\" id=\"sizeHint\" style=\"margin:0;font-variant-numeric:tabular-nums;\"></span>\n        </div>\n        <div class=\"ratio-row\" id=\"ratioRow\"></div>\n      </div>\n    </section>\n\n    <section class=\"card\">\n      <h2 class=\"card-title\"><svg class=\"icon\"><use href=\"#i-zap\"/></svg>提示词</h2>\n\n      <div class=\"field\">\n        <div class=\"field-label\">\n          <label for=\"prompt\" style=\"display:flex;align-items:center;\">\n            <svg class=\"icon\"><use href=\"#i-edit\"/></svg>正向提示词\n          </label>\n          <button id=\"randomButton\" class=\"btn btn-soft\" style=\"font-size:12px;padding:3px 10px;\">\n            <svg class=\"icon\" style=\"width:12px;height:12px;\"><use href=\"#i-shuffle\"/></svg> 随机灵感\n          </button>\n        </div>\n        <textarea id=\"prompt\" rows=\"4\" placeholder=\"描述你想要生成的图像内容及风格，支持中英文…\"></textarea>\n      </div>\n\n      <div class=\"field\" id=\"negativePromptGroup\">\n        <div class=\"field-label\">\n          <label for=\"negative_prompt\" style=\"display:flex;align-items:center;\">\n            <svg class=\"icon\"><use href=\"#i-ban\"/></svg>反向提示词\n          </label>\n        </div>\n        <textarea id=\"negative_prompt\" rows=\"2\" placeholder=\"不想出现在图像中的元素（该模型不支持时隐藏）\"></textarea>\n      </div>\n\n      <div class=\"field\">\n        <div class=\"field-label\">\n          <label style=\"display:flex;align-items:center;\">\n            <svg class=\"icon\"><use href=\"#i-layers\"/></svg>生成数量\n          </label>\n        </div>\n        <div class=\"seg\" id=\"batchSeg\">\n          <button type=\"button\" class=\"seg-btn active\" data-n=\"1\">1 张</button>\n          <button type=\"button\" class=\"seg-btn\" data-n=\"2\">2 张</button>\n          <button type=\"button\" class=\"seg-btn\" data-n=\"4\">4 张</button>\n        </div>\n        <p class=\"hint\">多张并行生成（同时最多 2 张在途，限流自动重试），额度消耗相应倍增</p>\n      </div>\n    </section>\n\n    <section class=\"card\">\n      <button id=\"toggleAdvanced\" class=\"btn adv-toggle\" aria-expanded=\"false\">\n        <span style=\"display:flex;align-items:center;gap:6px;\">\n          <svg class=\"icon\"><use href=\"#i-sliders\"/></svg>高级选项\n        </span>\n        <svg class=\"icon chevron\"><use href=\"#i-chevron\"/></svg>\n      </button>\n\n      <div id=\"advancedOptions\" class=\"adv-body hidden\">\n        <div class=\"field\" id=\"passwordGroup\">\n          <div class=\"field-label\">\n            <label for=\"password\" style=\"display:flex;align-items:center;\">\n              <svg class=\"icon\"><use href=\"#i-lock\"/></svg>访问密码\n            </label>\n          </div>\n          <input type=\"password\" id=\"password\" placeholder=\"私有部署时填写，留空则无需密码\">\n        </div>\n\n        <div class=\"field\" id=\"widthGroup\">\n          <div class=\"slider-row\">\n            <label for=\"width\" style=\"display:flex;align-items:center;\">\n              <svg class=\"icon\"><use href=\"#i-image\"/></svg>图像宽度\n            </label>\n            <span class=\"slider-value\" id=\"widthValue\">1024px</span>\n          </div>\n          <input type=\"range\" id=\"width\" min=\"256\" max=\"2048\" step=\"64\" value=\"1024\" class=\"slider\">\n        </div>\n\n        <div class=\"field\" id=\"heightGroup\">\n          <div class=\"slider-row\">\n            <label for=\"height\" style=\"display:flex;align-items:center;\">\n              <svg class=\"icon\"><use href=\"#i-image\"/></svg>图像高度\n            </label>\n            <span class=\"slider-value\" id=\"heightValue\">1024px</span>\n          </div>\n          <input type=\"range\" id=\"height\" min=\"256\" max=\"2048\" step=\"64\" value=\"1024\" class=\"slider\">\n          <p class=\"hint\" id=\"customSizeHint\">拖动微调尺寸；与上方预设不一致时按自定义输出</p>\n        </div>\n\n        <div class=\"field\" id=\"stepsGroup\">\n          <div class=\"slider-row\">\n            <label for=\"num_steps\" style=\"display:flex;align-items:center;\">\n              <svg class=\"icon\"><use href=\"#i-refresh\"/></svg>迭代步数\n            </label>\n            <span class=\"slider-value\" id=\"num_stepsValue\">20</span>\n          </div>\n          <input type=\"range\" id=\"num_steps\" min=\"1\" max=\"20\" step=\"1\" value=\"20\" class=\"slider\">\n          <p class=\"hint\">步数越高细节越丰富，但耗时更长</p>\n        </div>\n\n        <div class=\"field\" id=\"guidanceGroup\">\n          <div class=\"slider-row\">\n            <label for=\"guidance\" style=\"display:flex;align-items:center;\">\n              <svg class=\"icon\"><use href=\"#i-edit\"/></svg>引导系数\n            </label>\n            <span class=\"slider-value\" id=\"guidanceValue\">7.5</span>\n          </div>\n          <input type=\"range\" id=\"guidance\" min=\"0\" max=\"30\" step=\"0.5\" value=\"7.5\" class=\"slider\">\n          <p class=\"hint\">越高越严格遵循提示词，过高可能画面失真</p>\n        </div>\n\n        <div class=\"field\" id=\"seedGroup\">\n          <div class=\"field-label\">\n            <label for=\"seed\" style=\"display:flex;align-items:center;\">\n              <svg class=\"icon\"><use href=\"#i-seed\"/></svg>随机种子\n            </label>\n            <button id=\"randomSeed\" class=\"btn btn-soft\" style=\"font-size:12px;padding:3px 10px;\" title=\"生成随机种子\">\n              <svg class=\"icon\" style=\"width:12px;height:12px;\"><use href=\"#i-refresh\"/></svg> 随机\n            </button>\n          </div>\n          <input type=\"number\" id=\"seed\" placeholder=\"留空则每次随机\" min=\"0\" step=\"1\">\n          <p class=\"hint\">相同种子 + 相同参数可复现相似图像</p>\n        </div>\n      </div>\n    </section>\n\n    <div>\n      <button id=\"submitButton\" class=\"btn-primary\">\n        <svg class=\"icon\" id=\"submitIcon\"><use href=\"#i-zap\"/></svg>\n        <span id=\"submitText\">生成图像</span>\n      </button>\n      <p class=\"kbd-hint\">快捷键 <kbd>Ctrl</kbd> + <kbd>Enter</kbd> 快速生成</p>\n    </div>\n  </div>\n\n  <!-- 右侧：结果画布 -->\n  <div class=\"stage-col\">\n    <div class=\"stage-head\">\n      <h2 class=\"card-title\" style=\"margin:0;\"><svg class=\"icon\"><use href=\"#i-image\"/></svg>生成结果</h2>\n      <div class=\"stage-actions\">\n        <button id=\"copyParamsButton\" class=\"btn hidden\">\n          <svg class=\"icon\"><use href=\"#i-copy\"/></svg> 复制参数\n        </button>\n        <button id=\"downloadButton\" class=\"btn hidden\">\n          <svg class=\"icon\"><use href=\"#i-download\"/></svg> <span id=\"downloadText\">下载图像</span>\n        </button>\n      </div>\n    </div>\n\n    <div class=\"stage\">\n      <div id=\"emptyState\" class=\"stage-empty\">\n        <svg class=\"mark\" viewBox=\"0 0 64 64\" aria-hidden=\"true\">\n          <g fill=\"none\" stroke=\"var(--brand)\" stroke-width=\"7.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n            <path d=\"M23 55V22c0-7.2 5.8-13 13-13h2\"/>\n            <path d=\"M12.5 31h21\"/>\n          </g>\n          <circle cx=\"49\" cy=\"9\" r=\"5.5\" fill=\"var(--brand)\"/>\n        </svg>\n        <p>输入提示词，点击「生成图像」开始创作</p>\n        <p style=\"font-size:12px;\">生成通常需要几秒到几十秒</p>\n      </div>\n\n      <div id=\"resultsGrid\" class=\"results-grid hidden\"></div>\n\n      <span id=\"imageStatus\" class=\"hidden\"></span>\n    </div>\n\n    <div class=\"meta-row hidden\" id=\"metaRow\">\n      <span><svg class=\"icon\"><use href=\"#i-clock\"/></svg>耗时 <b id=\"generationTime\">-</b></span>\n      <span><svg class=\"icon\"><use href=\"#i-cpu\"/></svg>模型 <b id=\"usedModel\">-</b></span>\n      <span><svg class=\"icon\"><use href=\"#i-layers\"/></svg>数量 <b id=\"generationCount\">-</b></span>\n      <span id=\"imageMeta\"></span>\n    </div>\n\n    <div class=\"hidden\" id=\"allParamsContainer\" style=\"margin-top:12px;\">\n      <div class=\"card\">\n        <div class=\"card-title\" style=\"margin-bottom:8px;\">本次生成参数</div>\n        <div id=\"allParams\" style=\"display:flex;flex-wrap:wrap;gap:6px;\"></div>\n      </div>\n    </div>\n  </div>\n</div>\n\n<footer class=\"footer\">\n  Powered by <a href=\"https://developers.cloudflare.com/workers-ai/\" target=\"_blank\" rel=\"noopener\">Cloudflare Workers AI</a>\n  · 免费额度内即可使用 ·\n  <a href=\"https://github.com/LisaPullman/foxai-Text2img-Cloudflare-Workers\" target=\"_blank\" rel=\"noopener\">GitHub</a>\n  · <span style=\"opacity:.55\">v2026.09.03-5</span>\n</footer>\n\n<!-- 灯箱：大图查看（多图可左右切换） -->\n<div id=\"lightbox\" class=\"lightbox hidden\" role=\"dialog\" aria-modal=\"true\" aria-label=\"图像预览\">\n  <button type=\"button\" id=\"lbClose\" class=\"lb-btn lb-close\" aria-label=\"关闭预览\">\n    <svg class=\"icon\"><use href=\"#i-x\"/></svg>\n  </button>\n  <button type=\"button\" id=\"lbPrev\" class=\"lb-btn lb-nav left\" aria-label=\"上一张\">\n    <svg class=\"icon\"><use href=\"#i-left\"/></svg>\n  </button>\n  <img id=\"lbImage\" alt=\"预览图像\">\n  <button type=\"button\" id=\"lbNext\" class=\"lb-btn lb-nav right\" aria-label=\"下一张\">\n    <svg class=\"icon\"><use href=\"#i-right\"/></svg>\n  </button>\n  <div class=\"lb-bar\">\n    <span id=\"lbCaption\"></span>\n    <button type=\"button\" id=\"lbDownload\" class=\"btn\">\n      <svg class=\"icon\"><use href=\"#i-download\"/></svg> 下载\n    </button>\n  </div>\n</div>\n\n<script>\ndocument.addEventListener('DOMContentLoaded', function () {\n  'use strict';\n\n  var $ = function (id) { return document.getElementById(id); };\n\n  var availableModels = [];\n  var modelsById = {};\n  var currentModel = null;\n  var randomPromptsList = [];\n  var currentImageParams = {};\n  var isGenerating = false;\n  var statusTimer = null;\n  var elapsedInterval = null;\n  var selectedRatio = '1:1';\n  var numImages = 1;\n  var results = [];          // [{ params, status: 'loading'|'done'|'error', blob, url, error }]\n  var doneCount = 0;\n  var failCount = 0;\n  var genStart = 0;\n  var lbIndex = 0;\n\n  var PREFS_KEY = 't2i:prefs';\n\n  // ============ 主题模式（自动 / 亮 / 暗） ============\n  var themeSeg = $('themeSeg');\n  var systemDark = matchMedia('(prefers-color-scheme: dark)');\n\n  function currentThemeMode() {\n    try {\n      return localStorage.theme === 'dark' || localStorage.theme === 'light'\n        ? localStorage.theme\n        : 'auto';\n    } catch (e) { return 'auto'; }\n  }\n\n  function syncThemeSeg() {\n    var mode = currentThemeMode();\n    Array.prototype.forEach.call(themeSeg.querySelectorAll('button'), function (b) {\n      b.classList.toggle('active', b.dataset.mode === mode);\n    });\n  }\n\n  function applyThemeMode(mode) {\n    var dark = mode === 'dark' || (mode === 'auto' && systemDark.matches);\n    document.documentElement.classList.toggle('dark', dark);\n    try {\n      if (mode === 'auto') localStorage.removeItem('theme');\n      else localStorage.theme = mode;\n    } catch (e) { /* 隐私模式下 localStorage 可能不可用 */ }\n    syncThemeSeg();\n  }\n\n  Array.prototype.forEach.call(themeSeg.querySelectorAll('button'), function (b) {\n    b.addEventListener('click', function () { applyThemeMode(b.dataset.mode); });\n  });\n  // 自动模式下实时跟随系统明暗切换\n  if (systemDark.addEventListener) {\n    systemDark.addEventListener('change', function () {\n      if (currentThemeMode() === 'auto') applyThemeMode('auto');\n    });\n  }\n  syncThemeSeg();\n\n  // ============ 偏好记忆 ============\n  function loadPrefs() {\n    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); }\n    catch (e) { return {}; }\n  }\n  function savePrefs() {\n    try {\n      localStorage.setItem(PREFS_KEY, JSON.stringify({\n        // 注意：model 不记忆——每次打开页面固定默认模型\n        prompt: $('prompt').value,\n        negativePrompt: $('negative_prompt').value,\n        width: $('width').value,\n        height: $('height').value,\n        num_steps: $('num_steps').value,\n        guidance: $('guidance').value,\n        seed: $('seed').value,\n        ratio: selectedRatio,\n        numImages: numImages\n      }));\n    } catch (e) { /* 忽略存储异常 */ }\n  }\n\n  // ============ 状态提示 ============\n  function showStatus(message, type, persistent) {\n    var el = $('imageStatus');\n    if (!el) return;\n    el.className = 'status-' + (type || 'info');\n    el.textContent = message;\n    el.classList.remove('hidden');\n    if (statusTimer) clearTimeout(statusTimer);\n    // persistent: 生成期间持续显示进度，不被自动隐藏\n    if (!persistent) statusTimer = setTimeout(function () { el.classList.add('hidden'); }, 5000);\n  }\n\n  function escapeHtml(s) {\n    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')\n      .replace(/>/g, '&gt;').replace(/\"/g, '&quot;');\n  }\n\n  // ============ 模型能力适配 ============\n  function capChipsFor(caps) {\n    var chips = [];\n    if (caps.size) chips.push({ t: '尺寸 ' + caps.size.min + '–' + caps.size.max + 'px', brand: false });\n    if (caps.aspectRatio) chips.push({ t: '多种画面比例', brand: false });\n    if (caps.negativePrompt) chips.push({ t: '反向提示词', brand: false });\n    if (caps.guidance) chips.push({ t: '引导系数 ' + caps.guidance.min + '–' + caps.guidance.max, brand: false });\n    if (caps.seed) chips.push({ t: '随机种子', brand: false });\n    if (caps.steps) chips.push({ t: '步数 ' + caps.steps.min + '–' + caps.steps.max, brand: false });\n    return chips;\n  }\n\n  function setSlider(slider, label, opts) {\n    // opts: {min, max, step, value, format}\n    var old = parseFloat(slider.value);\n    slider.min = opts.min; slider.max = opts.max; slider.step = opts.step;\n    var v = Number.isFinite(old) ? Math.min(opts.max, Math.max(opts.min, old)) : opts.value;\n    if (opts.reset) v = opts.value;\n    slider.value = v;\n    if (label) label.textContent = opts.format(v);\n  }\n\n  function fmtPx(v) { return v + 'px'; }\n  function fmtNum(v) { return String(v); }\n  function fmtGuidance(v) { return parseFloat(v).toFixed(1); }\n\n  function applyModelCapabilities(model, opts) {\n    var caps = model.capabilities || {};\n    currentModel = model;\n\n    // 模型信息与能力标签\n    $('modelInfo').textContent = model.description || '';\n    $('capChips').innerHTML = capChipsFor(caps).map(function (c) {\n      return '<span class=\"cap-chip' + (c.brand ? ' brand' : '') + '\">' + c.t + '</span>';\n    }).join('');\n\n    // 分组显隐\n    $('negativePromptGroup').classList.toggle('hidden', !caps.negativePrompt);\n    var sizeOn = !!caps.size;\n    $('widthGroup').classList.toggle('hidden', !sizeOn);\n    $('heightGroup').classList.toggle('hidden', !sizeOn);\n    $('guidanceGroup').classList.toggle('hidden', !caps.guidance);\n    $('seedGroup').classList.toggle('hidden', !caps.seed);\n\n    // 尺寸滑块\n    if (caps.size) {\n      setSlider($('width'), $('widthValue'), {\n        min: caps.size.min, max: caps.size.max, step: caps.size.step || 8,\n        value: caps.size.defaultWidth, reset: !!opts.reset, format: fmtPx });\n      setSlider($('height'), $('heightValue'), {\n        min: caps.size.min, max: caps.size.max, step: caps.size.step || 8,\n        value: caps.size.defaultHeight, reset: !!opts.reset, format: fmtPx });\n    }\n\n    // 步数滑块\n    if (caps.steps) {\n      $('stepsGroup').classList.remove('hidden');\n      setSlider($('num_steps'), $('num_stepsValue'), {\n        min: caps.steps.min, max: caps.steps.max, step: 1,\n        value: caps.steps.default, reset: !!opts.reset, format: fmtNum });\n    } else {\n      $('stepsGroup').classList.add('hidden');\n    }\n\n    // 引导系数滑块\n    if (caps.guidance) {\n      setSlider($('guidance'), $('guidanceValue'), {\n        min: caps.guidance.min, max: caps.guidance.max, step: 0.5,\n        value: caps.guidance.default, reset: !!opts.reset, format: fmtGuidance });\n    }\n\n    // 画面比例预设（比例模型直接选比例；像素模型选比例即套用预设宽高）\n    buildRatioRow(caps);\n  }\n\n  function buildRatioRow(caps) {\n    var row = $('ratioRow');\n    row.innerHTML = '';\n    var presets = null;\n    if (caps.aspectRatio) {\n      presets = caps.aspectRatio.map(function (r) { return { label: r }; });\n    } else if (caps.size && caps.size.presets) {\n      presets = caps.size.presets;\n    }\n    $('ratioGroup').classList.toggle('hidden', !presets);\n    if (!presets) { $('sizeHint').textContent = ''; return; }\n\n    presets.forEach(function (p) {\n      var b = document.createElement('button');\n      b.type = 'button';\n      b.className = 'ratio-btn';\n      b.dataset.label = p.label;\n      b.textContent = p.label;\n      if (caps.size) b.title = p.w + ' × ' + p.h + ' px';\n      b.addEventListener('click', function () {\n        if (caps.aspectRatio) {\n          selectedRatio = p.label;\n        } else {\n          $('width').value = p.w;\n          $('height').value = p.h;\n          $('widthValue').textContent = p.w + 'px';\n          $('heightValue').textContent = p.h + 'px';\n        }\n        syncPresetUI();\n        savePrefs();\n      });\n      row.appendChild(b);\n    });\n\n    if (caps.aspectRatio && !caps.aspectRatio.includes(selectedRatio)) {\n      selectedRatio = caps.aspectRatio[0];\n    }\n    syncPresetUI();\n  }\n\n  // 同步预设按钮高亮与右侧尺寸提示；滑块值与预设不一致时视为「自定义」\n  function syncPresetUI() {\n    if (!currentModel) return;\n    var caps = currentModel.capabilities;\n    var row = $('ratioRow');\n    if (row.children.length === 0) return;\n    var active = null;\n\n    if (caps.aspectRatio) {\n      active = selectedRatio;\n      $('sizeHint').textContent = '按所选比例输出';\n    } else if (caps.size) {\n      var w = parseInt($('width').value, 10);\n      var h = parseInt($('height').value, 10);\n      $('sizeHint').textContent = w + '×' + h + ' px';\n      (caps.size.presets || []).forEach(function (p) {\n        if (p.w === w && p.h === h) active = p.label;\n      });\n    }\n\n    Array.prototype.forEach.call(row.querySelectorAll('.ratio-btn'), function (b) {\n      b.classList.toggle('active', b.dataset.label === active);\n    });\n  }\n\n  // ============ 模型列表加载 ============\n  async function loadModels() {\n    try {\n      var response = await fetch('/api/models');\n      if (!response.ok) throw new Error('HTTP ' + response.status);\n      availableModels = await response.json();\n      modelsById = {};\n      availableModels.forEach(function (m) { modelsById[m.id] = m; });\n\n      var modelSelect = $('model');\n      modelSelect.innerHTML = '';\n      availableModels.forEach(function (m) {\n        var option = document.createElement('option');\n        option.value = m.id;\n        option.textContent = m.name;\n        modelSelect.appendChild(option);\n      });\n\n      // 默认选中：每次打开固定选中 default 标记的模型（FLUX.1 [schnell]），\n      // 不恢复上次使用的模型；会话内切换不受影响\n      var prefs = loadPrefs();\n      var initial = (availableModels.find(function (m) { return m.default; }) || availableModels[0]).id;\n      modelSelect.value = initial;\n\n      // 先恢复记忆的比例/数量，再渲染模型控件，避免预设高亮被覆盖\n      if (prefs.ratio) selectedRatio = prefs.ratio;\n      if (prefs.numImages === 1 || prefs.numImages === 2 || prefs.numImages === 4) {\n        numImages = prefs.numImages;\n      }\n      syncBatchSeg();\n      applyModelCapabilities(modelsById[initial], { reset: true });\n\n      // 恢复记忆的高级参数（钳制到当前滑块范围内）\n      function restoreSliderValue(el, val) {\n        var n = Number(val);\n        if (!Number.isFinite(n)) return;\n        var min = parseFloat(el.min), max = parseFloat(el.max);\n        if (n < min) n = min;\n        if (n > max) n = max;\n        el.value = n;\n      }\n      if (prefs.width !== undefined) restoreSliderValue($('width'), prefs.width);\n      if (prefs.height !== undefined) restoreSliderValue($('height'), prefs.height);\n      if (prefs.num_steps !== undefined) restoreSliderValue($('num_steps'), prefs.num_steps);\n      if (prefs.guidance !== undefined) restoreSliderValue($('guidance'), prefs.guidance);\n      if (prefs.seed !== undefined) $('seed').value = prefs.seed;\n      if (prefs.prompt) $('prompt').value = prefs.prompt;\n      if (prefs.negativePrompt) $('negative_prompt').value = prefs.negativePrompt;\n      syncSliderLabels();\n      syncPresetUI();\n    } catch (error) {\n      console.error('加载模型列表错误:', error);\n      showStatus('模型列表加载失败，请刷新页面重试', 'error');\n    }\n  }\n\n  function syncSliderLabels() {\n    $('widthValue').textContent = $('width').value + 'px';\n    $('heightValue').textContent = $('height').value + 'px';\n    $('num_stepsValue').textContent = $('num_steps').value;\n    $('guidanceValue').textContent = parseFloat($('guidance').value).toFixed(1);\n  }\n\n  async function loadRandomPrompts() {\n    try {\n      var response = await fetch('/api/prompts');\n      if (!response.ok) throw new Error('HTTP ' + response.status);\n      randomPromptsList = await response.json();\n    } catch (error) {\n      console.error('加载提示词错误:', error);\n      randomPromptsList = [];\n    }\n  }\n\n  loadModels();\n  loadRandomPrompts();\n\n  // 模型切换\n  $('model').addEventListener('change', function () {\n    var m = modelsById[this.value];\n    if (m) applyModelCapabilities(m, { reset: true });\n    savePrefs();\n  });\n\n  // ============ 高级选项折叠 ============\n  var toggleAdvanced = $('toggleAdvanced');\n  toggleAdvanced.addEventListener('click', function () {\n    var body = $('advancedOptions');\n    var open = body.classList.toggle('hidden') === false;\n    toggleAdvanced.classList.toggle('open', open);\n    toggleAdvanced.setAttribute('aria-expanded', open);\n  });\n\n  // ============ 滑块即时显示 ============\n  [['width', fmtPx], ['height', fmtPx], ['num_steps', fmtNum], ['guidance', fmtGuidance]]\n    .forEach(function (pair) {\n      $(pair[0]).addEventListener('input', function () {\n        $(pair[0] + 'Value').textContent = pair[1](this.value);\n      });\n      $(pair[0]).addEventListener('change', savePrefs);\n    });\n  // 宽高拖动时同步预设按钮高亮（与预设不一致则显示为自定义）\n  ['width', 'height'].forEach(function (id) {\n    $(id).addEventListener('input', syncPresetUI);\n  });\n\n  // ============ 生成数量（1 / 2 / 4 张） ============\n  function syncBatchSeg() {\n    Array.prototype.forEach.call($('batchSeg').querySelectorAll('.seg-btn'), function (b) {\n      b.classList.toggle('active', parseInt(b.dataset.n, 10) === numImages);\n    });\n  }\n  Array.prototype.forEach.call($('batchSeg').querySelectorAll('.seg-btn'), function (b) {\n    b.addEventListener('click', function () {\n      numImages = parseInt(b.dataset.n, 10);\n      syncBatchSeg();\n      savePrefs();\n    });\n  });\n\n  // ============ 随机种子 / 随机提示词 ============\n  $('randomSeed').addEventListener('click', function () {\n    $('seed').value = Math.floor(Math.random() * 4294967295);\n    savePrefs();\n  });\n\n  $('randomButton').addEventListener('click', function () {\n    if (randomPromptsList.length > 0) {\n      var i = Math.floor(Math.random() * randomPromptsList.length);\n      $('prompt').value = randomPromptsList[i];\n      savePrefs();\n    } else {\n      showStatus('提示词库未加载，请稍后再试', 'warning');\n    }\n  });\n\n  ['prompt', 'negative_prompt', 'seed', 'password'].forEach(function (id) {\n    $(id).addEventListener('change', savePrefs);\n  });\n\n  // ============ 参数名称 ============\n  function formatParamName(name) {\n    var nameMap = {\n      prompt: '正向提示词',\n      negative_prompt: '反向提示词',\n      model: '文生图模型',\n      width: '图像宽度',\n      height: '图像高度',\n      num_steps: '迭代步数',\n      guidance: '引导系数',\n      seed: '随机种子',\n      aspect_ratio: '画面比例',\n      numImages: '生成数量'\n    };\n    return nameMap[name] || name;\n  }\n\n  // ============ 生成请求 ============\n  function buildParams() {\n    var caps = currentModel.capabilities;\n    var params = {\n      password: $('password').value || '',\n      prompt: $('prompt').value.trim(),\n      model: currentModel.id\n    };\n    if (caps.negativePrompt) params.negative_prompt = $('negative_prompt').value.trim();\n    if (caps.size) {\n      params.width = parseInt($('width').value, 10);\n      params.height = parseInt($('height').value, 10);\n    }\n    if (caps.steps) params.num_steps = parseInt($('num_steps').value, 10);\n    if (caps.guidance) params.guidance = parseFloat($('guidance').value);\n    if (caps.seed) {\n      var seedStr = $('seed').value.trim();\n      // 注意 0 是合法种子：仅在未填写时省略，由服务端随机\n      if (seedStr !== '' && Number.isFinite(Number(seedStr))) params.seed = Math.trunc(Number(seedStr));\n    }\n    if (caps.aspectRatio) params.aspect_ratio = selectedRatio;\n    return params;\n  }\n\n  function setGenerating(on) {\n    isGenerating = on;\n    var btn = $('submitButton');\n    btn.disabled = on;\n    $('submitText').textContent = on ? '生成中…' : '生成图像';\n    btn.setAttribute('aria-busy', on);\n  }\n\n  // ============ 批量生成（1 / 2 / 4 张并行） ============\n  // 多张时派生不同种子保证图像互不相同：用户填了种子则以该种子为基准 +i，\n  // 未填则随机基准（单张时不传 seed，由服务端随机）\n  function deriveSeeds(baseParams, n) {\n    if (!currentModel.capabilities.seed || n <= 1) return null;\n    var base = (baseParams.seed !== undefined)\n      ? Number(baseParams.seed)\n      : Math.floor(Math.random() * 4294967296);\n    var seeds = [];\n    for (var i = 0; i < n; i++) seeds.push((base + i) % 4294967296);\n    return seeds;\n  }\n\n  function revokeResults() {\n    results.forEach(function (r) {\n      if (r.url) { URL.revokeObjectURL(r.url); r.url = null; }\n    });\n  }\n\n  function renderGrid() {\n    revokeResults();\n    var grid = $('resultsGrid');\n    grid.dataset.count = String(results.length);\n    grid.innerHTML = '';\n    results.forEach(function (r, i) {\n      var cell = document.createElement('figure');\n      cell.className = 'result-cell';\n      cell.id = 'cell-' + i;\n      cell.innerHTML = '<div class=\"cell-state\"><div class=\"spinner\"></div>' +\n        '<div class=\"cell-state-text\">排队中…</div></div>';\n      grid.appendChild(cell);\n    });\n    grid.classList.remove('hidden');\n  }\n\n  function cellDone(i) {\n    var r = results[i];\n    var cell = $('cell-' + i);\n    if (!cell || !r.url) return;\n    cell.innerHTML = '';\n\n    var img = document.createElement('img');\n    img.alt = '生成的图像 ' + (i + 1);\n    img.src = r.url;\n\n    var actions = document.createElement('div');\n    actions.className = 'cell-actions';\n    var viewBtn = document.createElement('button');\n    viewBtn.type = 'button';\n    viewBtn.className = 'btn btn-icon';\n    viewBtn.title = '查看大图';\n    viewBtn.innerHTML = '<svg class=\"icon\"><use href=\"#i-maximize\"/></svg>';\n    viewBtn.addEventListener('click', function (e) { e.stopPropagation(); openLightbox(i); });\n\n    var saveBtn = document.createElement('button');\n    saveBtn.type = 'button';\n    saveBtn.className = 'btn btn-icon';\n    saveBtn.title = '下载此图';\n    saveBtn.innerHTML = '<svg class=\"icon\"><use href=\"#i-download\"/></svg>';\n    saveBtn.addEventListener('click', function (e) { e.stopPropagation(); downloadResult(i); });\n\n    actions.appendChild(viewBtn);\n    actions.appendChild(saveBtn);\n    cell.appendChild(img);\n    cell.appendChild(actions);\n    cell.classList.add('done');\n    cell.addEventListener('click', function () { openLightbox(i); });\n  }\n\n  function cellFailed(i, message) {\n    var cell = $('cell-' + i);\n    if (!cell) return;\n    cell.className = 'result-cell failed';\n    cell.innerHTML =\n      '<div class=\"cell-state\">' +\n      '<svg class=\"icon alert\"><use href=\"#i-alert\"/></svg>' +\n      '<div class=\"cell-error-text\">' + escapeHtml(message || '生成失败') + '</div>' +\n      '<button type=\"button\" class=\"btn\" style=\"font-size:12.5px;padding:4px 12px;\">' +\n      '<svg class=\"icon\" style=\"width:12px;height:12px;\"><use href=\"#i-refresh\"/></svg> 重试</button></div>';\n    cell.querySelector('button').addEventListener('click', function (e) {\n      e.stopPropagation();\n      retryCell(i);\n    });\n  }\n\n  function updateProgress() {\n    showStatus('生成中 ' + doneCount + '/' + results.length + ' 张 · ' +\n      ((performance.now() - genStart) / 1000).toFixed(1) + 's', 'info', true);\n  }\n  function startTimer() {\n    stopTimer();\n    updateProgress();\n    elapsedInterval = setInterval(updateProgress, 100);\n  }\n  function stopTimer() {\n    if (elapsedInterval) { clearInterval(elapsedInterval); elapsedInterval = null; }\n  }\n\n  // ============ 请求层：并发池 + 限流自动重试 ============\n  // 多张并行请求容易触发 Workers AI 限流（429），三重缓解：\n  //   1) runPool 限制同时在途请求数，任务按顺序补位\n  //   2) 任务启动时错峰，避免瞬时突发\n  //   3) requestImage 对 429/5xx/网络错误指数退避自动重试（400/403 等业务错误不重试）\n  var MAX_CONCURRENCY = 2;\n  var MAX_AUTO_RETRY = 2;\n  var RETRY_BASE_DELAY = 1500;\n  var START_STAGGER = 400;\n\n  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }\n\n  function setCellStateText(i, text) {\n    var el = document.querySelector('#cell-' + i + ' .cell-state-text');\n    if (el) el.textContent = text;\n  }\n\n  async function requestImage(i) {\n    var r = results[i];\n    var lastError = null;\n    for (var attempt = 0; attempt <= MAX_AUTO_RETRY; attempt++) {\n      if (attempt > 0) {\n        setCellStateText(i, '第 ' + (i + 1) + ' 张被限流，自动重试 (' + attempt + '/' + MAX_AUTO_RETRY + ')…');\n        await sleep(RETRY_BASE_DELAY * Math.pow(2, attempt - 1) + Math.random() * 500);\n      } else {\n        setCellStateText(i, '第 ' + (i + 1) + ' 张生成中…');\n      }\n      try {\n        var response = await fetch('/', {\n          method: 'POST',\n          headers: { 'Content-Type': 'application/json', 'Accept': 'image/*' },\n          body: JSON.stringify(r.params)\n        });\n        if (!response.ok) {\n          var msg = '生成失败（HTTP ' + response.status + '）';\n          try {\n            var errData = await response.json();\n            if (errData && errData.error) msg = errData.error;\n            if (errData && errData.details) console.warn('[text2img] 服务端详情:', errData.details);\n          } catch (e) { /* 非 JSON 错误体 */ }\n          var err = new Error(msg);\n          err.retryable = response.status === 429 || response.status >= 500;\n          throw err;\n        }\n        var blob = await response.blob();\n        if (!blob.type.startsWith('image/')) throw new Error('服务端返回的不是图像数据');\n        return blob;\n      } catch (error) {\n        lastError = error;\n        // 显式不可重试（retryable === false）直接抛出；网络错误/限流/5xx 继续重试\n        if (error && error.retryable === false) throw error;\n      }\n    }\n    throw lastError;\n  }\n\n  // 并发池：最多 limit 个任务在途，空闲槽位按序启动下一个\n  function runPool(total, limit, task) {\n    return new Promise(function (resolve) {\n      var next = 0, active = 0, launched = 0;\n      function slot() {\n        if (next >= total) {\n          if (active === 0) resolve();\n          return;\n        }\n        var i = next++;\n        active++;\n        sleep(launched++ * START_STAGGER)\n          .then(function () { return task(i); })\n          .then(function () { active--; slot(); },\n                function () { active--; slot(); });\n      }\n      for (var k = 0; k < Math.min(limit, total); k++) slot();\n    });\n  }\n\n  async function runOne(i) {\n    var r = results[i];\n    try {\n      var blob = await requestImage(i);\n\n      // Object URL 展示（内存占用远低于 base64），在下一次生成时统一释放\n      r.blob = blob;\n      r.url = URL.createObjectURL(blob);\n      r.status = 'done';\n      doneCount++;\n      cellDone(i);\n    } catch (error) {\n      console.error('[text2img] 第 ' + (i + 1) + ' 张生成失败:', error);\n      r.status = 'error';\n      r.error = error.message || '生成失败';\n      failCount++;\n      cellFailed(i, r.error);\n    }\n    updateProgress();\n  }\n\n  function refreshBatchStatus() {\n    if (failCount === 0) {\n      showStatus('生成成功', 'success');\n    } else if (doneCount > 0) {\n      showStatus(doneCount + ' 张成功，' + failCount + ' 张失败，可对失败项重试', 'warning');\n    } else {\n      showStatus('生成失败', 'error');\n    }\n  }\n\n  async function retryCell(i) {\n    var r = results[i];\n    if (!r || r.status !== 'error' || isGenerating) return;\n    setGenerating(true);\n    if (failCount > 0) failCount--;\n    r.status = 'loading';\n    var cell = $('cell-' + i);\n    cell.className = 'result-cell';\n    cell.innerHTML = '<div class=\"cell-state\"><div class=\"spinner\"></div>' +\n      '<div class=\"cell-state-text\">正在重试第 ' + (i + 1) + ' 张…</div></div>';\n    genStart = performance.now();\n    startTimer();\n    await runOne(i);\n    stopTimer();\n    setGenerating(false);\n    if (r.status === 'done' && doneCount === results.length) {\n      updateBatchMeta();\n    }\n    refreshBatchStatus();\n  }\n\n  function updateBatchMeta() {\n    var firstDone = results.find(function (r) { return r.status === 'done'; });\n    if (!firstDone) return;\n    $('generationCount').textContent = doneCount + ' 张';\n    $('imageMeta').textContent = firstDone.blob.type === 'image/png' ? 'PNG' : 'JPEG';\n  }\n\n  async function generate() {\n    if (isGenerating) return;\n    if (!currentModel) { showStatus('模型尚未加载完成', 'warning'); return; }\n\n    var baseParams = buildParams();\n    if (!baseParams.prompt) {\n      showStatus('请先输入正向提示词', 'warning');\n      $('prompt').focus();\n      return;\n    }\n\n    var seeds = deriveSeeds(baseParams, numImages);\n    results = [];\n    for (var i = 0; i < numImages; i++) {\n      var p = Object.assign({}, baseParams);\n      if (seeds) p.seed = seeds[i];\n      results.push({ params: p, status: 'loading' });\n    }\n\n    currentImageParams = Object.assign({}, baseParams);\n    currentImageParams.numImages = numImages;\n    savePrefs();\n\n    $('emptyState').classList.add('hidden');\n    $('imageStatus').classList.add('hidden');\n    $('copyParamsButton').classList.add('hidden');\n    $('downloadButton').classList.add('hidden');\n    $('metaRow').classList.add('hidden');\n    $('allParamsContainer').classList.add('hidden');\n\n    doneCount = 0;\n    failCount = 0;\n    renderGrid();\n\n    setGenerating(true);\n    var startTime = genStart = performance.now();\n    startTimer();\n\n    // 并发池调度（同时最多 2 张在途，自动错峰 + 限流重试）\n    await runPool(results.length, MAX_CONCURRENCY, runOne);\n\n    stopTimer();\n    setGenerating(false);\n    var generationTime = ((performance.now() - startTime) / 1000).toFixed(1);\n\n    if (doneCount > 0) {\n      $('generationTime').textContent = generationTime + ' 秒';\n      $('usedModel').textContent = currentModel.name;\n      updateBatchMeta();\n      $('metaRow').classList.remove('hidden');\n      updateParamsDisplay(currentImageParams);\n      $('copyParamsButton').classList.remove('hidden');\n      $('downloadButton').classList.remove('hidden');\n      $('downloadText').textContent = doneCount > 1 ? '下载全部' : '下载图像';\n    }\n    refreshBatchStatus();\n  }\n\n  $('submitButton').addEventListener('click', generate);\n\n  // ============ 灯箱（大图查看） ============\n  function doneIndices() {\n    var a = [];\n    results.forEach(function (r, i) { if (r.status === 'done') a.push(i); });\n    return a;\n  }\n\n  function openLightbox(i) {\n    var r = results[i];\n    if (!r || r.status !== 'done') return;\n    lbIndex = i;\n    $('lbImage').src = r.url;\n    var list = doneIndices();\n    $('lbCaption').textContent = list.length > 1 ? (list.indexOf(i) + 1) + ' / ' + list.length : '';\n    var multi = list.length > 1;\n    $('lbPrev').classList.toggle('hidden', !multi);\n    $('lbNext').classList.toggle('hidden', !multi);\n    $('lightbox').classList.remove('hidden');\n    document.body.style.overflow = 'hidden';\n  }\n\n  function closeLightbox() {\n    $('lightbox').classList.add('hidden');\n    $('lbImage').src = '';\n    document.body.style.overflow = '';\n  }\n\n  function lbStep(d) {\n    var list = doneIndices();\n    if (list.length < 2) return;\n    var pos = list.indexOf(lbIndex);\n    if (pos === -1) pos = 0;\n    openLightbox(list[(pos + d + list.length) % list.length]);\n  }\n\n  $('lbClose').addEventListener('click', closeLightbox);\n  $('lightbox').addEventListener('click', function (e) {\n    if (e.target === this) closeLightbox();\n  });\n  $('lbPrev').addEventListener('click', function () { lbStep(-1); });\n  $('lbNext').addEventListener('click', function () { lbStep(1); });\n  $('lbDownload').addEventListener('click', function () { downloadResult(lbIndex); });\n\n  // 快捷键：Ctrl/Cmd + Enter 生成；灯箱打开时 ← → 切换、Esc 关闭\n  document.addEventListener('keydown', function (e) {\n    if ($('lightbox').classList.contains('hidden')) {\n      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {\n        e.preventDefault();\n        generate();\n      }\n      return;\n    }\n    if (e.key === 'Escape') closeLightbox();\n    else if (e.key === 'ArrowLeft') lbStep(-1);\n    else if (e.key === 'ArrowRight') lbStep(1);\n  });\n\n  // ============ 参数展示 / 复制 ============\n  function updateParamsDisplay(params) {\n    var container = $('allParams');\n    container.innerHTML = '';\n    Object.keys(params).forEach(function (key) {\n      if (key === 'password') return;\n      var badge = document.createElement('span');\n      badge.className = 'param-badge';\n      var val = key === 'model' ? currentModel.name : params[key];\n      badge.innerHTML = '<b>' + formatParamName(key) + '</b>' + String(val)\n        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');\n      container.appendChild(badge);\n    });\n    $('allParamsContainer').classList.remove('hidden');\n  }\n\n  $('copyParamsButton').addEventListener('click', function () {\n    var lines = ['--- foxai 文生图参数 ---'];\n    Object.keys(currentImageParams).forEach(function (key) {\n      if (key === 'password') return;\n      var val = key === 'model' ? currentModel.name : currentImageParams[key];\n      lines.push(formatParamName(key) + ': ' + val);\n    });\n    navigator.clipboard.writeText(lines.join('\\n'))\n      .then(function () { showStatus('参数已复制到剪贴板', 'success'); })\n      .catch(function () { showStatus('复制失败，请手动复制', 'error'); });\n  });\n\n  // ============ 下载（单张 / 全部） ============\n  function downloadResult(i) {\n    var r = results[i];\n    if (!r || r.status !== 'done' || !r.blob) { showStatus('没有可下载的图像', 'error'); return; }\n    var ext = r.blob.type === 'image/png' ? 'png'\n      : (r.blob.type === 'image/jpg' || r.blob.type === 'image/jpeg') ? 'jpg' : 'img';\n    var url = r.url || URL.createObjectURL(r.blob);\n    var link = document.createElement('a');\n    var timestamp = new Date().toISOString().replace(/[:.]/g, '-');\n    link.href = url;\n    link.download = currentModel.id + '-' + timestamp +\n      (results.length > 1 ? '-' + (i + 1) : '') + '.' + ext;\n    document.body.appendChild(link);\n    link.click();\n    document.body.removeChild(link);\n    if (!r.url) setTimeout(function () { URL.revokeObjectURL(url); }, 1000);\n  }\n\n  $('downloadButton').addEventListener('click', function () {\n    var list = doneIndices();\n    if (list.length === 0) { showStatus('没有可下载的图像', 'error'); return; }\n    if (list.length === 1) {\n      downloadResult(list[0]);\n      showStatus('图像已开始下载', 'success');\n      return;\n    }\n    // 多张时错开触发，避免浏览器拦截连发下载\n    list.forEach(function (i, k) {\n      setTimeout(function () { downloadResult(i); }, k * 350);\n    });\n    showStatus('已开始下载 ' + list.length + ' 张图像', 'success');\n  });\n});\n</script>\n</body>\n</html>\n";

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
//   size.presets:   像素模型的常用比例预设 [{ label, w, h }]，前端渲染为
//                   一键按钮（数值须在 min/max 内并对齐 step，服务端仍会钳制校验）
// =====================================================================

// 常用画面比例 → 像素预设（基准 1024，全部对齐 64px，SD/FLUX 系 2048 上限内）
const SIZE_PRESETS_1024 = [
  { label: '1:1',  w: 1024, h: 1024 },
  { label: '4:3',  w: 1152, h: 896  },
  { label: '3:4',  w: 896,  h: 1152 },
  { label: '3:2',  w: 1216, h: 832  },
  { label: '2:3',  w: 832,  h: 1216 },
  { label: '16:9', w: 1344, h: 768  },
  { label: '9:16', w: 768,  h: 1344 }
];

// Lucid Origin 全高清预设（16px 对齐，2500 上限内，充分利用其 FHD 出图能力）
const SIZE_PRESETS_FHD = [
  { label: '1:1',  w: 1440, h: 1440 },
  { label: '4:3',  w: 1600, h: 1200 },
  { label: '3:4',  w: 1200, h: 1600 },
  { label: '3:2',  w: 1728, h: 1152 },
  { label: '2:3',  w: 1152, h: 1728 },
  { label: '16:9', w: 1920, h: 1088 },
  { label: '9:16', w: 1088, h: 1920 }
];

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
      size: { min: 256, max: 2048, step: 64, defaultWidth: 1024, defaultHeight: 1024, presets: SIZE_PRESETS_1024 },
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
      size: { min: 256, max: 2048, step: 64, defaultWidth: 1024, defaultHeight: 1024, presets: SIZE_PRESETS_1024 },
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
      size: { min: 256, max: 2500, step: 16, defaultWidth: 1120, defaultHeight: 1120, presets: SIZE_PRESETS_FHD },
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
      size: { min: 256, max: 2048, step: 64, defaultWidth: 1024, defaultHeight: 1024, presets: SIZE_PRESETS_1024 },
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
      size: { min: 256, max: 2048, step: 64, defaultWidth: 1024, defaultHeight: 1024, presets: SIZE_PRESETS_1024 },
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
      size: { min: 256, max: 2048, step: 64, defaultWidth: 1024, defaultHeight: 1024, presets: SIZE_PRESETS_1024 },
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
      size: { min: 256, max: 2048, step: 64, defaultWidth: 1024, defaultHeight: 1024, presets: SIZE_PRESETS_1024 },
      steps: { param: 'num_steps', min: 1, max: 20, default: 8 },
      guidance: { min: 0, max: 30, default: 7.5 },
      seed: true,
      aspectRatio: false,
      promptMaxLen: null
    }
  }
];

// Random prompts list（48 条，覆盖摄影 / 插画 / 中风水墨 / 科幻奇幻 / 建筑空间 / 美食 / 产品设计等）
const RANDOM_PROMPTS = [
  // —— 摄影写实 ——
  'an elderly fisherman with deep wrinkles mending a net at dawn, golden hour side light, mist over the lake, shot on 85mm lens, shallow depth of field, documentary photography',
  'macro photograph of a dewdrop on a spider web at sunrise, rainbow refraction, extreme detail, bokeh background of green grass',
  'a lone hiker on a ridge above a sea of clouds at sunrise, alpenglow on distant snow peaks, epic landscape photography, wide angle',
  'night street photography in Hong Kong, rain-soaked neon reflections, taxi lights streaking, a person with a transparent umbrella crossing the street, cinematic, 35mm',
  'wildlife photograph of a snowy owl taking off from a frozen branch, wings spread, snowflakes in the air, backlit by low winter sun, telephoto 600mm, sharp eye focus',
  'a cozy bookshop interior, warm lamplight, tall wooden shelves, a cat sleeping on a stack of books, dust particles floating in a beam of light, atmospheric',
  'aerial top-down photo of turquoise ocean meeting white sand beach, small boat casting a long shadow, minimal composition, drone photography',
  'portrait of a ballet dancer backstage, catching her breath, sweat glistening, dramatic single spotlight, dark background, black and white photography',
  // —— 艺术插画 ——
  'watercolor illustration of a mountain village in spring, cherry blossoms in the foreground, soft washes of pink and teal, loose brush strokes, white paper texture',
  'art nouveau poster of a woman holding a lantern, flowing hair intertwined with golden vines, ornate decorative border, muted gold and deep green palette, Alphonse Mucha style',
  'children book illustration of a tiny dragon riding on the back of a fox through an autumn forest, warm colors, friendly rounded shapes, soft textures',
  'flat vector illustration of a city skyline at dusk, geometric buildings, gradient purple to orange sky, birds and hot air balloon, minimal modern style',
  'charcoal sketch of an old violin resting on a chair in an empty theater, dramatic cross-hatching, strong contrast, expressive loose lines',
  'retro 1980s sci-fi book cover, astronaut discovering a giant crystal skull on an alien planet, airbrushed style, bold typography space at top, vivid magenta and cyan',
  'a fox spirit with nine tails walking through a torii gate under the full moon, Japanese folklore style, red and gold accents on indigo night',
  // —— 中式美学 ——
  'traditional Chinese ink wash painting (shuimo) of misty karst mountains and a small fishing boat, vast negative space, expressive brushwork, subtle ink gradations on rice paper',
  'a Tang dynasty palace banquet scene, elegant court ladies in flowing silk hanfu, lanterns and silk ribbons, gilded murals style, rich vermillion and gold',
  'Chinese New Year night market, red lanterns strung across the street, children carrying rabbit lanterns, fireworks blooming above tiled rooftops, festive warm light, illustration',
  'a giant panda cub rolling down a mossy hill in a bamboo forest, morning fog, soft light through leaves, adorable, photorealistic',
  'delicate porcelain teacup with blue-and-white patterns, jasmine flowers and steam rising, still life on a dark wooden table, chiaroscuro lighting',
  // —— 科幻 / 奇幻 ——
  'cyberpunk cat samurai graphic art, neon lights, rain, blood splattered, beautiful colors',
  'a wide aerial view of a floating elven city in the sky, two elven figures walking across a glowing skybridge between crystal towers, clouds and golden light, majestic and serene',
  'colossal derelict starship half-buried in desert dunes, nomads with torches exploring its engine cavity, scale contrast, dramatic dusk sky, sci-fi concept art',
  'an astronaut floating above the rings of Saturn, sunlight refracting through ice particles, Earth a small blue dot in the distance, hyperrealistic space art',
  'a cozy android cafe where robots serve tea to humans, warm afternoon light, plants everywhere, gentle slice-of-life sci-fi illustration',
  'a giant mechanical whale swimming through clouds above a steampunk city, brass propellers and brass pipes, airships docking on its back, epic scale',
  'deep sea exploration vessel discovering a glowing ancient city on the ocean floor, bioluminescent creatures circling, beams of light through dark water',
  'a knight in weathered armor kneeling before a glowing sword embedded in a stone, petals of light drifting, cathedral ruins, volumetric god rays, dark fantasy',
  // —— 建筑空间 ——
  'isometric cutaway illustration of a wizard tower with five floors, each floor a different magical workshop, tiny glowing details, game art style, soft colors',
  'a minimalist Japanese house with a central courtyard maple tree, shoji screens, warm wood and concrete, morning light raking across tatami, architectural photography',
  'brutalist library interior with towering concrete bookshelves, a single reader on a spiral staircase, shafts of dusty sunlight, dramatic scale',
  'cozy cabin in a snowy pine forest at night, warm orange light spilling from windows, aurora borealis overhead, smoke curling from the chimney, storybook illustration',
  'futuristic vertical farm skyscraper in Singapore at dusk, glass walls revealing green terraces, drones delivering produce, clean architectural rendering',
  // —— 美食静物 ——
  'steaming bowl of tonkotsu ramen, chashu, soft egg with runny yolk, nori, steam curling upward, dark moody background, food photography, shallow depth of field',
  'rustic wooden table with fresh sourdough bread, olive oil, tomatoes and herbs, morning light from a kitchen window, Tuscany style food photography',
  'an elaborate dessert of matcha lava cake with gold leaf, raspberry coulis dots, on a slate plate, dramatic side light, michelin-star plating',
  'top-down flat lay of a Chinese hot pot feast, bubbling red broth, plates of thinly sliced lamb, vegetables, dipping sauces, vibrant colors, overhead food photography',
  // —— 产品 / 平面设计 ——
  'product photography of a matte black ceramic coffee dripper on a stone slab, wisp of steam, single dramatic light, minimalist composition, high-end commercial shot',
  'sneaker concept design exploded view, floating layers of sole, mesh and laces, blueprint annotations, studio lighting on gradient background, industrial design render',
  'a sleek concept sports car in a rain-lit underground garage, reflections on wet floor, cyan rim light, automotive advertising photography',
  'creative poster design of a jazz concert, saxophone made of flowing paint splashes, bold typography, cream background with navy and orange',
  // —— 角色 / 时尚 ——
  '1girl, solo, camping at night in the mountains, tent and campfire, starry sky and the Milky Way, twin ponytails, cheerful, detailed anime style',
  'a desert nomad wrapped in indigo cloth, silver jewelry, walking with a camel at sunset, long shadow across golden dunes, National Geographic style portrait',
  'fashion editorial of a model in an avant-garde paper-fold dress, studio lighting, pastel seamless background, high fashion magazine photography',
  'an old wizard astronomer with a long beard, surrounded by floating orrery rings and star charts, candlelit observatory, warm and wise atmosphere, fantasy portrait',
  // —— 自然 / 纪实 ——
  'a thunderstorm rolling over vast golden wheat fields, a single oak tree standing against the dark clouds, lightning in the distance, epic contrast, landscape photography',
  'autumn forest path covered in crimson maple leaves, morning fog between white birch trunks, soft diffused light, serene atmosphere',
  'hummingbird hovering over a passion flower, wings frozen in motion, iridescent feathers, garden background bokeh, high-speed photography'
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
          // 识别 Workers AI 限流（429 Too Many Requests），透传状态码供客户端退避重试
          const isRateLimit = aiError && (
            aiError.status === 429 ||
            /(\b429\b|too many requests|rate limit)/i.test(String(aiError.message || ''))
          );
          return jsonResponse({
            error: isRateLimit ? '模型服务限流，请稍后重试' : '图像生成失败，请稍后重试',
            details: aiError.message
          }, isRateLimit ? 429 : 500, corsHeaders);
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
