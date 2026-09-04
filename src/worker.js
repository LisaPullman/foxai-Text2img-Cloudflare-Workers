/**
 * foxai Text2img — 基于 Cloudflare Workers AI 的在线文生图服务
 *
 * @author: kared / foxai
 * @create_date: 2025-05-10
 * @last_edit_time: 2026-09-03
 * @description: Cloudflare Worker：模型能力清单 / 输入校验 / 图像生成 API + 页面托管
 */

// import html template
import HTML from './index.html';

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
