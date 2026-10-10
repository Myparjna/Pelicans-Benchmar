// 截图脚本：用系统已有的 Chrome 对 24 个模型生成的 HTML 逐一截图
// 生成 thumbs/<slug>.png 作为展厅封面，并输出 sites-data.js 元数据
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试';
const THUMBS = join(ROOT, 'thumbs');
mkdirSync(THUMBS, { recursive: true });

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// 站点元数据：file=原始文件名(勿改)  category=厂商归类  model=模型名  channel=生成渠道  slug=缩略图/标识(ASCII)
const SITES = [
  { file: 'qwen3.7plus官网.html',            category: '阿里 · 通义千问', model: '通义千问 Qwen 3.7 Plus', channel: '官网风格',        slug: 'qwen-3-7-plus' },
  { file: 'qwen3.627b官网.html',             category: '阿里 · 通义千问', model: '通义千问 Qwen 3.6 27B',  channel: '官网风格',        slug: 'qwen-3-6-27b' },
  { file: 'qwen3.6flash官网.html',           category: '阿里 · 通义千问', model: '通义千问 Qwen 3.6 Flash',channel: '官网风格',        slug: 'qwen-3-6-flash' },
  { file: 'qwen官网3.8max.html',             category: '阿里 · 通义千问', model: '通义千问 Qwen 3.8 Max',  channel: '官网风格',        slug: 'qwen-3-8-max' },
  { file: '千问官网3.6flash.html',           category: '阿里 · 通义千问', model: '通义千问 Qwen 3.6 Flash',channel: '官网风格',        slug: 'qianwen-3-6-flash' },

  { file: 'gpt5.6solcodex.html',             category: 'OpenAI',          model: 'GPT-5.6 Codex',          channel: 'Sol Codex',        slug: 'gpt-5-6-codex' },

  { file: 'gemini3.6flash官网.html',         category: 'Google · Gemini', model: 'Gemini 3.6 Flash',       channel: '官网风格',        slug: 'gemini-3-6-flash' },
  { file: 'gemini31pro官网.html',            category: 'Google · Gemini', model: 'Gemini 3.1 Pro',         channel: '官网风格',        slug: 'gemini-3-1-pro' },

  { file: 'grok45真.html',                   category: 'xAI · Grok',      model: 'Grok 4.5',               channel: '真·官网',          slug: 'grok-4-5-real' },
  { file: 'grok4.5.html',                    category: 'xAI · Grok',      model: 'Grok 4.5',               channel: '标准',             slug: 'grok-4-5' },

  { file: 'apideepseekv4flash0731.html',     category: 'DeepSeek',        model: 'DeepSeek V4 Flash',      channel: 'API 直连',         slug: 'deepseek-v4-flash-api-0731' },
  { file: 'v4pro813API.html',                category: 'DeepSeek',        model: 'DeepSeek V4 Pro',        channel: 'API 直连',         slug: 'deepseek-v4-pro-api-0813' },
  { file: 'deepseekv4pro424官网版本.html',    category: 'DeepSeek',        model: 'DeepSeek V4 Pro',        channel: '官网风格',         slug: 'deepseek-v4-pro-0424' },
  { file: 'deepseekv4flash0424trae.html',    category: 'DeepSeek',        model: 'DeepSeek V4 Flash',      channel: 'Trae',             slug: 'deepseek-v4-flash-0424-trae' },
  { file: 'deepseek0424pro trae.html',       category: 'DeepSeek',        model: 'DeepSeek V4 Pro (0424)', channel: 'Trae',             slug: 'deepseek-0424-pro-trae' },
  { file: 'deepseekflash0424官网版.html',     category: 'DeepSeek',        model: 'DeepSeek V4 Flash (0424)',channel:'官网风格',         slug: 'deepseek-flash-0424' },
  { file: 'deepseekv4pro-0424-workbuddy.html',category: 'DeepSeek',        model: 'DeepSeek V4 Pro (0424)', channel: 'WorkBuddy',        slug: 'deepseek-v4-pro-0424-wb' },
  { file: 'deepseekv4flash0424-workbuddy.html',category:'DeepSeek',        model: 'DeepSeek V4 Flash (0424)',channel:'WorkBuddy',        slug: 'deepseek-v4-flash-0424-wb' },

  { file: '豆包官网专家模式.html',            category: '字节 · 豆包',     model: '豆包 Doubao (专家模式)',  channel: '官网风格 · 专家模式', slug: 'doubao-expert' },
  { file: 'seed21pro trae.html',             category: '字节 · Seed',     model: 'Seed 2.1 Pro',           channel: 'Trae',             slug: 'seed-2-1-pro-trae' },

  { file: 'HY3workbuddy.html',               category: '腾讯 · 混元',     model: '混元 HY3',               channel: 'WorkBuddy',        slug: 'hunyuan-hy3-wb' },

  { file: 'kimik3workbuddy.html',            category: '月之暗面 · Kimi', model: 'Kimi K3',                channel: 'WorkBuddy',        slug: 'kimi-k3-wb' },

  { file: 'GLM52workbuddy.html',             category: '智谱 · GLM',     model: '智谱 GLM 5.2',           channel: 'WorkBuddy',        slug: 'glm-5-2-wb' },

  { file: 'minimaxm3-workbuddy.html',        category: 'MiniMax',         model: 'MiniMax M3',             channel: 'WorkBuddy',        slug: 'minimax-m3-wb' },
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars'],
});

let ok = 0, fail = 0;
for (const s of SITES) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    const url = pathToFileURL(join(ROOT, s.file)).href;
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1600)); // 等字体/动画
    const out = join(THUMBS, s.slug + '.png');
    await page.screenshot({ path: out, fullPage: true });
    console.log('OK  ', s.slug, '->', s.file);
    ok++;
  } catch (e) {
    console.error('FAIL', s.slug, s.file, '|', e.message);
    fail++;
  } finally {
    await page.close();
  }
}

await browser.close();

// 输出元数据（供展厅直接 <script> 引入，避免 file:// 下的 fetch 限制）
const data = SITES.map(s => ({
  file: s.file,
  slug: s.slug,
  category: s.category,
  model: s.model,
  channel: s.channel,
  thumb: 'thumbs/' + s.slug + '.png',
}));
const js = 'window.SITES = ' + JSON.stringify(data, null, 2) + ';\n';
writeFileSync(join(ROOT, 'sites-data.js'), js, 'utf8');

console.log(`\n完成：成功 ${ok} 张，失败 ${fail} 张`);
console.log('已写入 sites-data.js');
