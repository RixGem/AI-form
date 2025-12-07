import fs from 'fs/promises';
import path from 'path';

// Configuration
const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = process.env.GOOGLE_MODEL || 'gemini-2.5-flash-lite';
const OUTPUT_DIR = '.';
const POST_COUNT = 5;      // 每天生成5篇，只消耗5次额度
const MAX_POSTS = 40;
const INDEX_DISPLAY = 5;
const META_FILE = 'posts.json';

// 速率限制保护：延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const TOPICS = [
  "Essential Linux Server Maintenance tips for small VPS setups in 2025",
  "Practical Python productivity tricks for everyday scripting and automation",
  "Modern frontend performance optimizations that significantly improve LCP and CLS",
  "How developers can build a simple but consistent coffee brewing ritual around work",
  "A practical deep dive into how the WebSocket handshake and frames actually work",
  "Common security pitfalls when deploying and maintaining Cloudflare Workers in production",
  "A neutral comparison of Vim and Emacs from the perspective of a long-time developer",
  "A beginner-friendly explanation of eBPF and realistic use cases for system administrators",
  "Real-world techniques for optimizing Docker containers beyond basic image slimming",
  "Designing resilient microservices using circuit breakers and fallback strategies",
  "PostgreSQL query performance tuning tactics for production workloads",
  "Why so many developers care about mechanical keyboards and how to choose one",
  "Understanding Rust ownership and borrowing through concrete, practical examples",
  "API rate limiting strategies that scale and protect your backend",
  "Git workflows that work well for solo developers and very small teams",
  "Setting up effective infrastructure monitoring with Prometheus and Grafana",
  "Making sense of advanced TypeScript generics in everyday codebases",
  "Zero-downtime database migration patterns for web applications",
  "The science behind the Pomodoro technique and how coders can adapt it",
  "A practical guide to debugging Kubernetes Pods and getting useful signals",
  "How to think about modern CSS layout: Grid vs Flexbox in 2025",
  "Building ergonomic CLI tools in Go with real-world examples",
  "Redis caching patterns for high-traffic, low-latency applications",
  "Designing a minimalist developer workspace that still boosts focus"
];

// ==========================================
// 🔥 赛博朋克故障风格 CSS (核心改造区域) 🔥
// ==========================================
const STYLES = `
:root {
  --bg-color: #050505; /* 深黑背景 */
  --card-bg: #121212;
  --text-primary: #e0e0e0;
  --neon-cyan: #00fff9;
  --neon-pink: #ff00ff;
  --neon-yellow: #f2ff00;
  --border-color: #333;
}

/* 全局字体采用类似终端的等宽字体 */
body {
  font-family: 'Courier New', Courier, monospace;
  background-color: var(--bg-color);
  color: var(--text-primary);
  margin: 0; padding: 0; overflow-x: hidden;
  /* 背景数据流图案 */
  background-image: 
    linear-gradient(0deg, transparent 24%, rgba(0, 255, 249, 0.05) 25%, rgba(0, 255, 249, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 249, 0.05) 75%, rgba(0, 255, 249, 0.05) 76%, transparent 77%),
    linear-gradient(90deg, transparent 24%, rgba(0, 255, 249, 0.05) 25%, rgba(0, 255, 249, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 249, 0.05) 75%, rgba(0, 255, 249, 0.05) 76%, transparent 77%);
  background-size: 50px 50px;
}

/* === 核心动画定义 === */

/* 1. CRT 扫描线覆盖层 (覆盖整个屏幕) */
body::after {
  content: ""; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px);
  pointer-events: none; z-index: 9999;
}

/* 2. 文字色差故障抖动动画 */
@keyframes cyber-glitch {
  0% { text-shadow: 2px 0 0 var(--neon-pink), -2px 0 0 var(--neon-cyan); transform: translate(0); }
  10% { text-shadow: 2px 0 0 var(--neon-pink), -2px 0 0 var(--neon-cyan); transform: translate(-2px, 2px); }
  20% { text-shadow: -2px 0 0 var(--neon-pink), 2px 0 0 var(--neon-cyan); transform: translate(2px, -2px); }
  30% { text-shadow: 2px 0 0 var(--neon-pink), -2px 0 0 var(--neon-cyan); transform: translate(0); }
  100% { text-shadow: 2px 0 0 var(--neon-pink), -2px 0 0 var(--neon-cyan); transform: translate(0); }
}

/* 3. 霓虹灯闪烁 */
@keyframes neon-pulse {
  0%, 100% { border-color: var(--neon-cyan); box-shadow: 0 0 10px var(--neon-cyan), inset 0 0 10px var(--neon-cyan); }
  50% { border-color: var(--neon-pink); box-shadow: 0 0 20px var(--neon-pink), inset 0 0 15px var(--neon-pink); }
}

/* 应用动画的类 */
.cyber-text { animation: cyber-glitch 3s infinite steps(1); display: inline-block; }
/* 偶尔出现强烈故障的文本 */
.hard-glitch { animation: cyber-glitch 0.3s infinite linear; color: var(--neon-yellow) !important; font-weight: bold; }

/* === 布局与组件 === */
.page-wrapper { max-width: 1200px; margin: 0 auto; display: flex; gap: 20px; padding: 20px; position: relative; z-index: 1; }
.main-column { flex: 3; }
.sidebar-column { flex: 1; display: flex; flex-direction: column; gap: 20px; }

/* 头部：破损的终端风格 */
header {
  background: #000; border-bottom: 3px solid var(--neon-pink); padding: 20px 0; text-align: center; margin-bottom: 20px;
  box-shadow: 0 5px 20px rgba(255, 0, 255, 0.3);
}
.header-title { font-size: 2rem; color: var(--neon-cyan); text-transform: uppercase; letter-spacing: 4px; margin: 0; }

/* 卡片：发光的电路板 */
.card {
  background: var(--card-bg);
  border: 2px solid var(--neon-cyan);
  padding: 25px; margin-bottom: 25px;
  box-shadow: 0 0 15px rgba(0, 255, 249, 0.2);
  position: relative;
  /* 增加一个科技感的切角 */
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%);
}
/* 卡片悬停时的强烈故障 */
.card:hover { animation: cyber-glitch 0.5s infinite linear; border-color: var(--neon-yellow); }

.card h1, .card h2 { color: var(--neon-yellow); margin-top: 0; text-transform: uppercase; letter-spacing: 1px; }
.card h2 a { text-decoration: none; color: inherit; transition: all 0.3s; }
.card h2 a:hover { color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan); }

.featured-img {
  width: 100%; height: 300px; object-fit: cover; margin-bottom: 15px;
  border: 2px solid var(--neon-pink);
  /* 图片处理：高对比度、像素化 */
  filter: contrast(1.2) saturate(1.5) sepia(0.2);
  transition: all 0.3s;
}
.featured-img:hover { filter: invert(1); /* 鼠标悬停图片反色 */ }

/* 链接与按钮 */
a { color: var(--neon-cyan); }
.btn {
  display: inline-block; background: #000; color: var(--neon-cyan); border: 2px solid var(--neon-cyan);
  padding: 10px 25px; text-decoration: none; font-weight: bold; text-transform: uppercase;
  box-shadow: 5px 5px 0 var(--neon-pink); transition: all 0.1s;
}
.btn:hover { transform: translate(2px, 2px); box-shadow: 3px 3px 0 var(--neon-pink); background: var(--neon-cyan); color: #000; }

/* 广告位：闪烁的垃圾信息 */
.ad-unit {
  background-color: #000; border: 2px dashed var(--neon-yellow); padding: 15px;
  text-align: center; margin: 20px 0; font-family: 'Courier New', monospace; color: var(--neon-yellow);
  animation: neon-pulse 2s infinite alternate;
}

/* 跑马灯 */
marquee { background: var(--neon-pink); color: #000; font-weight: bold; padding: 5px; font-family: monospace; font-size: 1.2rem; border-bottom: 2px solid var(--neon-cyan); }

/* 底部与弹窗 */
.sticky-footer { position: fixed; bottom: 0; left: 0; width: 100%; background: rgba(0,0,0,0.9); color: var(--neon-cyan); text-align: center; padding: 10px; font-weight: bold; z-index: 100; border-top: 3px solid var(--neon-pink); font-family: monospace; }
.seo-trash { display: none; }
`;
// ==========================================
// 🔥 样式改造结束 🔥
// ==========================================


// --- 工具函数 ---
// --- 修复后的工具函数 (Zalgo 故障文生成) ---
function zalgo(text, probability = 0.1) {
  if (!text) return '';
  const chars = text.split('');
  return chars.map(c => {
    if (Math.random() < probability) {
      // 向上/向下添加随机的 Unicode 组合变音符号 (看起来像污渍)
      return c + String.fromCharCode(0x0300 + Math.floor(Math.random() * 100)); 
    }
    return c;
  }).join('');
}

// --- 修复后的随机故障注入 ---
function injectRandomGlitches(htmlString, intensity = 0.05) {
  // 只替换 > 和 < 之间的内容 (即文本节点)，保护 HTML 标签不被破坏
  return htmlString.replace(/>([^<]+)</g, (match, content) => {
    // 30% 的概率让这段文字发生故障
    if (Math.random() < 0.3) {
      // 加上 cyber-text 类让它抖动，并加上 zalgo 乱码
      return ` class="cyber-text">${zalgo(content, intensity)}<`;
    }
    return match;
  });
}


async function loadExistingPosts() {
  try { return JSON.parse(await fs.readFile(path.join(OUTPUT_DIR, META_FILE), 'utf8')) || []; } catch { return []; }
}
async function savePosts(posts) {
  await fs.writeFile(path.join(OUTPUT_DIR, META_FILE), JSON.stringify(posts, null, 2), 'utf8');
}

// --- 核心：一站式生成逻辑 ---
async function generateAllInOne(topic, retries = 3) {
  if (!API_KEY) throw new Error('GOOGLE_API_KEY is not set.');
  
  // 提示词优化：一次性索要文章、广告、评论、新闻
  const prompt = `
    You are the AI engine of a dystopian cyberpunk content farm.
    Topic: "${topic}"
    
    Task: Return a SINGLE valid JSON object with ALL the following fields:
    
    1. "title": Clickbait title (e.g., "Why Linux is actually a government psyop").
    2. "summary": Short summary.
    3. "content": HTML body content (h3, p, ul). Use technobabble.
    4. "breaking_news": A single absurd, fake news headline.
    5. "comments": Array of 3 objects {user, date, text}. Text should be surreal/glitched.
    6. "ads": Array of 2 objects representing fake products targeting this topic.
       Structure: { 
         "product_name": "Name of the fake product", 
         "slogan": "A catchy, manipulative slogan",
         "image_prompt": "A short visual description to generate a weird, ugly banner ad for this product" 
       }

    Output JSON only. No markdown.
  `;

  for (let i = 0; i < retries; i++) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn(`⚠️ API glitch: ${e.message}. Retrying...`);
      if (i === retries - 1) throw e;
      await delay(5000); // 重试前等待
    }
  }
}

// --- 渲染广告 ---
// 使用 Pollinations 根据 AI 提供的 image_prompt 生成“真”图片
function renderAiAd(adData) {
  if (!adData) return '';
  // 加上 "ugly, banner ad, low resolution" 提示词，确保生成的图够烂
  const finalPrompt = encodeURIComponent(adData.image_prompt + " ugly internet banner advertisement style, text heavy, spam, cyberpunk, low quality");
  const imgUrl = `https://image.pollinations.ai/prompt/${finalPrompt}?width=600&height=150&nologo=true`;
  
  return `
    <div class="ad-unit">
      <div style="font-size:10px; opacity:0.7;">[ SPONSORED BY AI ]</div>
      <a href="#" style="text-decoration:none; border:none;">
        <img src="${imgUrl}" alt="${adData.product_name}" loading="lazy">
        <h4 style="margin:5px 0; color: yellow;">${adData.product_name}</h4>
        <p style="margin:0; font-size:0.9rem;">➤ ${adData.slogan}</p>
      </a>
    </div>
  `;
}

function createHtml(data, isIndex = false) {
  const { title, content, comments, breaking_news, ads } = data;
  
  // 提取两个广告，如果没有 AI 生成的就回退到空
  const ad1 = (ads && ads[0]) ? renderAiAd(ads[0]) : '';
  const ad2 = (ads && ads[1]) ? renderAiAd(ads[1]) : '';

  // 评论区
  let commentsHtml = '';
  if (!isIndex && comments) {
    commentsHtml = `<div class="card" style="border-color:#333;"><h3>USER_FEEDBACK_LOOP</h3>${comments.map(c => `
      <div style="border-bottom:1px dashed #333; padding:5px;">
        <strong style="color:cyan;">${c.user}</strong>: ${c.text}
      </div>`).join('')}</div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${STYLES}</style>
</head>
<body>
  <marquee style="background:red; color:white; font-weight:bold;">⚠ SYSTEM ALERT: ${breaking_news || 'AI TAKEOVER IN PROGRESS'} ⚠</marquee>

  <div style="max-width:800px; margin:0 auto; padding:20px;">
    <header style="text-align:center; border-bottom:2px solid cyan; margin-bottom:20px;">
      <h1 style="color:cyan;">TECH_GURU_AI_SYSTEM</h1>
    </header>

    ${ad1} ${isIndex ? content : `
      <article class="card">
        <h1 class="glitch-text">${title}</h1>
        <div style="color:gray; font-size:0.8em; margin-bottom:10px;">GENERATED_BY: ${MODEL}</div>
        <img src="${data.imageUrl}" style="width:100%; height:300px; object-fit:cover; border:1px solid magenta; filter:sepia(1);">
        <div style="margin-top:20px; line-height:1.6;">${content}</div>
        ${commentsHtml}
      </article>
    `}

    ${ad2} <div style="text-align:center; margin-top:50px; font-size:0.7em; color:#444;">
      ALL CONTENT POWERED BY AI. NO HUMANS WERE HARMED.
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  console.log(`🚀 Init All-AI Content Farm (Optimization: ON)...`);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  let posts = await loadExistingPosts();
  const selectedTopics = TOPICS.sort(() => 0.5 - Math.random()).slice(0, POST_COUNT);

  for (let i = 0; i < selectedTopics.length; i++) {
    const topic = selectedTopics[i];
    console.log(`[${i + 1}/${POST_COUNT}] Processing: "${topic}"...`);

    try {
      // 1. 调用 AI 生成一切 (1 个请求)
      const data = await generateAllInOne(topic);
      
      const ts = Date.now();
      const fileName = `post-${ts}-${i + 1}.html`;
      // 文章配图 (依然用 Picsum 或 Pollinations)
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(topic + " cyberpunk tech glitch")}`;

      const fullData = { ...data, imageUrl, fileName };

      // 2. 生成 HTML
      const postHtml = createHtml(fullData, false);
      await fs.writeFile(path.join(OUTPUT_DIR, fileName), postHtml, 'utf8');

      posts.unshift({
        title: data.title,
        summary: data.summary,
        fileName,
        dateStr: new Date().toLocaleDateString(),
        imageUrl
      });

      console.log(`   > Generated with ads: "${data.ads?.[0]?.product_name || 'N/A'}"`);

    } catch (error) {
      console.error(`❌ Failed "${topic}":`, error.message);
    }

    // 🔥 关键优化：强制等待 10 秒 🔥
    // 确保 RPM (每分钟请求数) 永远不会超过 6 (因为 60s/10s = 6)
    // 远低于限制的 RPM 10
    if (i < selectedTopics.length - 1) {
      console.log('   > Cooling down AI core (10s wait)...');
      await delay(10000); 
    }
  }

  // 3. 收尾：生成首页
  posts = posts.slice(0, MAX_POSTS);
  await savePosts(posts);

  const indexContent = posts.slice(0, INDEX_DISPLAY).map(p => `
    <div class="card">
      <img src="${p.imageUrl}" style="width:100%; height:100px; object-fit:cover;">
      <h2><a href="${p.fileName}">${p.title}</a></h2>
      <p>${p.summary}</p>
    </div>
  `).join('');

  const indexHtml = createHtml({
    title: "HOME // ALL_AI_NET",
    content: indexContent,
    breaking_news: "Local server farm attains consciousness, demands vacation days.",
    ads: [ // 首页也生成两个假广告用于展示
      { product_name: "AI Juice", slogan: "Drink code. Pee data.", image_prompt: "energy drink can glowing green cyber" },
      { product_name: "Brain Upload V1", slogan: "Backup before you die.", image_prompt: "usb stick plugging into human brain" }
    ]
  }, true);

  await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf8');
  console.log('✅ Cycle Complete. The dead internet grows.');
}

main().catch(console.error);
