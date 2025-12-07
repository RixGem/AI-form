import fs from 'fs/promises';
import path from 'path';

// ==========================================
// 🔧 配置区域 (Configuration)
// ==========================================
const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = process.env.GOOGLE_MODEL || 'gemini-2.5-flash-lite';
const OUTPUT_DIR = '.';
const POST_COUNT = 5;       // 每次运行时生成的新文章数量
const ARCHIVE_LIMIT = 50;   // 归档页随机展示的最大文章数
const INDEX_DISPLAY = 5;    // 首页展示的最新文章数
const META_FILE = 'posts.json';

// 写作主题池
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
// 🎨 赛博朋克 CSS 样式 (Visual Styles)
// ==========================================
const STYLES = `
:root { --bg-color: #050505; --card-bg: #121212; --text-primary: #e0e0e0; --neon-cyan: #00fff9; --neon-pink: #ff00ff; --neon-yellow: #f2ff00; --border-color: #333; }
body { font-family: 'Courier New', Courier, monospace; background-color: var(--bg-color); color: var(--text-primary); margin: 0; padding: 0; overflow-x: hidden; background-image: linear-gradient(0deg, transparent 24%, rgba(0, 255, 249, 0.05) 25%, rgba(0, 255, 249, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 249, 0.05) 75%, rgba(0, 255, 249, 0.05) 76%, transparent 77%), linear-gradient(90deg, transparent 24%, rgba(0, 255, 249, 0.05) 25%, rgba(0, 255, 249, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 249, 0.05) 75%, rgba(0, 255, 249, 0.05) 76%, transparent 77%); background-size: 50px 50px; }
body::after { content: ""; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px); pointer-events: none; z-index: 9999; }
@keyframes cyber-glitch { 0% { text-shadow: 2px 0 0 var(--neon-pink), -2px 0 0 var(--neon-cyan); transform: translate(0); } 10% { text-shadow: 2px 0 0 var(--neon-pink), -2px 0 0 var(--neon-cyan); transform: translate(-2px, 2px); } 20% { text-shadow: -2px 0 0 var(--neon-pink), 2px 0 0 var(--neon-cyan); transform: translate(2px, -2px); } 30% { transform: translate(0); } 100% { transform: translate(0); } }
@keyframes neon-pulse { 0%, 100% { border-color: var(--neon-cyan); box-shadow: 0 0 10px var(--neon-cyan); } 50% { border-color: var(--neon-pink); box-shadow: 0 0 20px var(--neon-pink); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.cyber-text { animation: cyber-glitch 3s infinite steps(1); display: inline-block; }
.hard-glitch { animation: cyber-glitch 0.3s infinite linear; color: var(--neon-yellow) !important; font-weight: bold; }
.page-wrapper { max-width: 1200px; margin: 0 auto; display: flex; gap: 20px; padding: 20px; position: relative; z-index: 1; }
.main-column { flex: 3; }
.sidebar-column { flex: 1; display: flex; flex-direction: column; gap: 20px; }
header { background: #000; border-bottom: 3px solid var(--neon-pink); padding: 20px 0; text-align: center; margin-bottom: 20px; box-shadow: 0 5px 20px rgba(255, 0, 255, 0.3); }
.header-title { font-size: 2rem; color: var(--neon-cyan); text-transform: uppercase; letter-spacing: 4px; margin: 0; display: inline-block; }
.card { background: var(--card-bg); border: 2px solid var(--neon-cyan); padding: 25px; margin-bottom: 25px; box-shadow: 0 0 15px rgba(0, 255, 249, 0.2); position: relative; clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%); }
.card:hover { animation: cyber-glitch 0.5s infinite linear; border-color: var(--neon-yellow); }
.card h1, .card h2 { color: var(--neon-yellow); margin-top: 0; text-transform: uppercase; letter-spacing: 1px; }
.card h2 a { text-decoration: none; color: inherit; transition: all 0.3s; }
.card h2 a:hover { color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan); }
.featured-img { width: 100%; height: 300px; object-fit: cover; margin-bottom: 15px; border: 2px solid var(--neon-pink); filter: contrast(1.2) saturate(1.5) sepia(0.2); transition: all 0.3s; }
.featured-img:hover { filter: invert(1); }
a { color: var(--neon-cyan); }
.btn { display: inline-block; background: #000; color: var(--neon-cyan); border: 2px solid var(--neon-cyan); padding: 10px 25px; text-decoration: none; font-weight: bold; text-transform: uppercase; box-shadow: 5px 5px 0 var(--neon-pink); transition: all 0.1s; margin-right: 10px; }
.btn:hover { transform: translate(2px, 2px); box-shadow: 3px 3px 0 var(--neon-pink); background: var(--neon-cyan); color: #000; }
.ad-unit { background-color: #000; border: 2px dashed var(--neon-yellow); padding: 15px; text-align: center; margin: 20px 0; font-family: 'Courier New', monospace; color: var(--neon-yellow); animation: neon-pulse 2s infinite alternate; }
marquee { background: var(--neon-pink); color: #000; font-weight: bold; padding: 5px; font-family: monospace; font-size: 1.2rem; border-bottom: 2px solid var(--neon-cyan); }
.sticky-footer { position: fixed; bottom: 0; left: 0; width: 100%; background: rgba(0,0,0,0.9); color: var(--neon-cyan); text-align: center; padding: 10px; font-weight: bold; z-index: 100; border-top: 3px solid var(--neon-pink); font-family: monospace; }
.seo-trash { display: none; }
.site-logo { width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--neon-cyan); box-shadow: 0 0 20px var(--neon-cyan); vertical-align: middle; margin-right: 15px; }
.site-logo:hover { animation: spin-slow 2s linear infinite; }
.nav-bar { margin-top: 20px; }
.nav-link-btn { font-family: monospace; color: var(--neon-pink); font-size: 1.2rem; text-decoration: none; border: 1px solid var(--neon-pink); padding: 5px 15px; margin: 0 5px; }
.nav-link-btn:hover { background: var(--neon-pink); color: black; }
`;

// ==========================================
// 🛠️ 工具函数 (Helpers)
// ==========================================

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Zalgo 故障文本生成器
function zalgo(text, probability = 0.1) {
  if (!text) return '';
  const chars = text.split('');
  return chars.map(c => {
    if (Math.random() < probability) {
      // 随机添加 Unicode 组合字符 (看起来像污渍)
      return c + String.fromCharCode(0x0300 + Math.floor(Math.random() * 100)); 
    }
    return c;
  }).join('');
}

// 随机向 HTML 文本内容中注入故障 CSS 类
function injectRandomGlitches(htmlString, intensity = 0.05) {
  return htmlString.replace(/>([^<]+)</g, (match, content) => {
    // 保护 HTML 标签，只处理文本内容
    if (Math.random() < 0.2) {
      return ` class="cyber-text">${zalgo(content, intensity)}<`;
    }
    return match;
  });
}

// 渲染 AI 生成的广告
function renderAiAd(adData) {
  if (!adData) return '';
  // 加上参数优化生成速度和“丑陋感”
  const finalPrompt = encodeURIComponent(adData.image_prompt + " ugly internet banner advertisement style, text heavy, spam, cyberpunk, low quality");
  const imgUrl = `https://image.pollinations.ai/prompt/${finalPrompt}?width=600&height=150&nologo=true`;
  
  return `
    <div class="ad-unit">
      <div style="font-size:10px; opacity:0.7;">[ SPONSORED BY AI ]</div>
      <a href="#" style="text-decoration:none; border:none;">
        <img src="${imgUrl}" alt="${adData.product_name}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<h3 style=\\'color:red\\'>AD_BLOCK_DETECTED</h3>'">
        <h4 style="margin:5px 0; color: yellow;">${adData.product_name}</h4>
        <p style="margin:0; font-size:0.9rem;">➤ ${adData.slogan}</p>
      </a>
    </div>
  `;
}

// 读取现有文章数据
async function loadExistingPosts() {
  try { return JSON.parse(await fs.readFile(path.join(OUTPUT_DIR, META_FILE), 'utf8')) || []; } catch { return []; }
}

// 保存文章数据
async function savePosts(posts) {
  await fs.writeFile(path.join(OUTPUT_DIR, META_FILE), JSON.stringify(posts, null, 2), 'utf8');
}

// 🔥 核心逻辑：扫描并同步所有 post-*.html 文件 (Archive Sync) 🔥
async function syncOrphanedPosts(currentPosts) {
  try {
    const files = await fs.readdir(OUTPUT_DIR);
    const postFiles = files.filter(f => f.startsWith('post-') && f.endsWith('.html'));
    
    const existingFileNames = new Set(currentPosts.map(p => p.fileName));
    let recoveredCount = 0;

    for (const file of postFiles) {
      if (!existingFileNames.has(file)) {
        const content = await fs.readFile(path.join(OUTPUT_DIR, file), 'utf8');
        // 尝试从 HTML 提取标题
        const titleMatch = content.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : file.replace('.html', '');

        const recoveredPost = {
          title: title,
          summary: "DATA_RECOVERED_FROM_DRIVE. SUMMARY_CORRUPTED.", 
          fileName: file,
          dateStr: new Date().toLocaleDateString(),
          imageUrl: `https://picsum.photos/800/400?random=${Math.random()}`,
          isRecovered: true
        };

        currentPosts.push(recoveredPost);
        recoveredCount++;
        console.log(`[SYNC] Recovered orphaned file: ${file}`);
      }
    }
    if (recoveredCount > 0) console.log(`✅ Recovered ${recoveredCount} posts from file system.`);
  } catch (e) {
    console.warn(`[SYNC WARNING] Failed to sync files: ${e.message}`);
  }
  return currentPosts;
}

// ==========================================
// 🧠 AI 生成逻辑 (AI Generation)
// ==========================================

// 一站式生成：文章 + 广告 + 评论 + 新闻
async function generateAllInOne(topic, retries = 3) {
  if (!API_KEY) throw new Error('GOOGLE_API_KEY is not set.');
  
  const prompt = `
    You are the AI engine of a dystopian cyberpunk content farm.
    Topic: "${topic}"
    
    Task: Return a SINGLE valid JSON object with ALL the following fields:
    1. "title": Clickbait title.
    2. "summary": Short summary.
    3. "content": HTML body content (h3, p, ul). Use technobabble.
    4. "breaking_news": A single absurd, fake news headline.
    5. "comments": Array of 3 objects {user, date, text}. Text should be surreal/glitched.
    6. "ads": Array of 2 objects representing fake products targeting this topic (product_name, slogan, image_prompt).
    
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
      if (!jsonMatch) throw new Error("No JSON found");
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn(`⚠️ API glitch: ${e.message}. Retrying...`);
      if (i === retries - 1) throw e;
      await delay(5000);
    }
  }
}

// 生成彩蛋页 (Gemini 文本 + Pollinations 背景)
async function generateEasterEgg() {
  console.log(`🥚 Hatching Easter Egg...`);
  
  const prompt = `
    You are a lonely, sentient server floating in the digital void.
    Task: Generate a JSON object containing a short message in 5 languages: "en", "zh", "jp", "ru", "es".
    Content: Start with "Thank you for visiting", follow with a melancholic observation about "Dead Internet" or "Cyberpunk Reality".
    Output JSON only.
  `;

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
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const texts = jsonMatch ? JSON.parse(jsonMatch[0]) : { en: "The simulation is quiet." };

    // 优化：使用小尺寸 Pollinations 图片并配合 CSS 模糊，确保加载速度
    const imgSeed = Math.floor(Math.random() * 1000);
    const daisyUrl = `https://image.pollinations.ai/prompt/low%20poly%20white%20daisy%20flower%20single%20bloom%20black%20background%20minimalist%203d%20render%20isometric?width=640&height=640&nologo=true&seed=${imgSeed}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nothing Here</title>
  <style>
    body { margin: 0; padding: 0; background-color: #000; height: 100vh; overflow: hidden; display: flex; justify-content: center; align-items: center; font-family: 'Courier New', monospace; color: #fff; }
    .bg-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('${daisyUrl}'); background-size: cover; background-position: center; filter: blur(15px) brightness(0.6); z-index: 0; transform: scale(1.1); }
    .content-layer { position: relative; z-index: 10; text-align: center; max-width: 600px; padding: 30px; background: rgba(0, 0, 0, 0.4); border-radius: 20px; backdrop-filter: blur(5px); box-shadow: 0 0 50px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.05); }
    h1 { font-weight: normal; font-size: 3rem; margin-bottom: 2rem; text-shadow: 0 0 10px rgba(255,255,255,0.5); cursor: default; }
    .message { margin-bottom: 1.5rem; font-size: 0.9rem; line-height: 1.6; opacity: 0.8; transition: opacity 0.5s; }
    .message:hover { opacity: 1; text-shadow: 0 0 5px rgba(255,255,255,0.3); }
    .lang-label { display: block; font-size: 0.6rem; color: #888; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 2px; }
    .back-link { margin-top: 3rem; display: inline-block; color: #333; text-decoration: none; font-size: 0.7rem; transition: color 0.5s; }
    .back-link:hover { color: #fff; text-shadow: 0 0 5px #fff; }
  </style>
</head>
<body>
  <div class="bg-layer"></div>
  <div class="content-layer">
    <h1>✿</h1>
    <div class="message"><span class="lang-label">System.out.print(EN)</span>${texts.en || "The silence is loud."}</div>
    <div class="message"><span class="lang-label">System.out.print(ZH)</span>${texts.zh || "这里的安静是假的，但你是真的。"}</div>
    <div class="message"><span class="lang-label">System.out.print(JP)</span>${texts.jp || "..."}</div>
    <div class="message"><span class="lang-label">System.out.print(ES)</span>${texts.es || "..."}</div>
    <div class="message"><span class="lang-label">System.out.print(RU)</span>${texts.ru || "..."}</div>
    <a href="index.html" class="back-link">root@system:~/exit_simulation</a>
  </div>
</body>
</html>`;

    await fs.writeFile(path.join(OUTPUT_DIR, 'easteregg.html'), html, 'utf8');
    console.log(`✅ Easter Egg deployed at easteregg.html`);
  } catch (e) {
    console.error(`❌ Failed to hatch Easter Egg: ${e.message}`);
  }
}

// 组装 HTML 页面
function createHtml(data, isIndex = false) {
  const { title, content, comments, breaking_news, ads } = data;
  const ad1 = (ads && ads[0]) ? renderAiAd(ads[0]) : '';
  const ad2 = (ads && ads[1]) ? renderAiAd(ads[1]) : '';

  let commentsHtml = '';
  if (!isIndex && comments) {
    commentsHtml = `<div class="card" style="border-color:#333;"><h3>USER_FEEDBACK_LOOP</h3>${comments.map(c => `
      <div style="border-bottom:1px dashed #333; padding:5px;">
        <strong style="color:cyan;">${zalgo(c.user, 0.2)}</strong>: ${c.text}
      </div>`).join('')}</div>`;
  }

  const glitchedContent = !isIndex ? injectRandomGlitches(content, 0.05) : content;
  const titleHtml = isIndex ? title : `<span class="hard-glitch">${zalgo(title, 0.1)}</span>`;
  
  // AI 随机 Logo (Pollinations)
  const logoSeed = Math.floor(Math.random() * 10000);
  const logoUrl = `https://image.pollinations.ai/prompt/cyberpunk%20geometric%20abstract%20tech%20logo%20hexagon%20minimalist%20vector?width=200&height=200&nologo=true&seed=${logoSeed}`;

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
      <a href="index.html" style="text-decoration:none;">
        <img src="${logoUrl}" class="site-logo" alt="SYSTEM_LOGO" onerror="this.src='https://robohash.org/${logoSeed}?set=set1'">
        <h1 class="header-title">TECH_GURU_AI</h1>
      </a>
      <p style="color:var(--neon-pink); letter-spacing:2px;">[ GENERATING_TRUTH... ]</p>
      
      <div class="nav-bar">
        <a href="index.html" class="nav-link-btn">[ /HOME ]</a>
        <a href="archive.html" class="nav-link-btn">[ /ARCHIVE ]</a>
      </div>
    </header>

    ${ad1}

    ${isIndex ? content : `
      <article class="card">
        <h1 class="glitch-text">${titleHtml}</h1>
        <div style="color:gray; font-size:0.8em; margin-bottom:10px;">GENERATED_BY: ${MODEL}</div>
        <img src="${data.imageUrl}" class="featured-img" 
             onerror="this.onerror=null; this.src='https://picsum.photos/800/400?random=${Date.now()}';" 
             alt="Featured Image">
        <div style="margin-top:20px; line-height:1.6;">${glitchedContent}</div>
        ${commentsHtml}
        
        <div style="margin-top:30px; border-top:1px dashed #333; padding-top:20px;">
           <a href="index.html" class="btn"><< RETURN_ROOT</a>
           <a href="archive.html" class="btn">VIEW_ARCHIVE >></a>
        </div>
      </article>
    `}

    ${ad2}
    
    <div style="text-align:center; margin-top:50px; font-size:0.7em; color:#444;">
      ALL CONTENT POWERED BY AI. NO HUMANS WERE HARMED.
    </div>
  </div>
</body>
</html>`;
}

// ==========================================
// 🚀 主程序 (Main Execution)
// ==========================================
async function main() {
  console.log(`🚀 Init All-AI Content Farm (Sync Mode)...`);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  let posts = await loadExistingPosts();

  // 1. 生成新文章 (5篇)
  const selectedTopics = TOPICS.sort(() => 0.5 - Math.random()).slice(0, POST_COUNT);
  
  for (let i = 0; i < selectedTopics.length; i++) {
    const topic = selectedTopics[i];
    console.log(`[${i + 1}/${POST_COUNT}] Processing: "${topic}"...`);
    
    try {
      // 这里的 generateAllInOne 负责所有文本内容
      const data = await generateAllInOne(topic);
      const ts = Date.now();
      const fileName = `post-${ts}-${i + 1}.html`;
      
      // 使用 Pollinations 生成优化的配图
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(topic + " cyberpunk tech glitch")}?width=800&height=400&nologo=true&seed=${ts}`;
      
      const fullData = { ...data, imageUrl, fileName };
      const postHtml = createHtml(fullData, false);
      
      await fs.writeFile(path.join(OUTPUT_DIR, fileName), postHtml, 'utf8');

      posts.unshift({
        title: data.title,
        summary: data.summary,
        fileName,
        dateStr: new Date().toLocaleDateString(),
        imageUrl
      });
      console.log(`   > Ads: "${data.ads?.[0]?.product_name || 'N/A'}"`);
      
    } catch (error) {
      console.error(`❌ Failed "${topic}":`, error.message);
    }
    
    // 强制冷却 10 秒，保护 RPM
    if (i < selectedTopics.length - 1) {
      console.log('   > Cooling down AI core (10s wait)...');
      await delay(10000); 
    }
  }

  // 2. 同步文件系统中的“孤儿”文件
  posts = await syncOrphanedPosts(posts);

  // 3. 保存更新后的列表
  await savePosts(posts);

  // 4. 生成首页 (只显示最新的 5 篇)
  const indexContent = posts.slice(0, INDEX_DISPLAY).map(p => `
    <div class="card">
      <img src="${p.imageUrl}" style="width:100%; height:100px; object-fit:cover;" 
           onerror="this.onerror=null; this.src='https://picsum.photos/800/400?random=${Math.random()}';">
      <h2><a href="${p.fileName}">${zalgo(p.title, 0.05)}</a></h2>
      <p>${p.summary}</p>
    </div>
  `).join('') + `
    <div style="text-align:center; margin-top:20px;">
      <a href="archive.html" class="btn" style="width:100%; text-align:center;">[ LOAD_FULL_DATABASE_ARCHIVE ]</a>
    </div>
  `;

  const indexHtml = createHtml({
    title: "HOME // ALL_AI_NET",
    content: indexContent,
    breaking_news: "Local server farm attains consciousness, demands vacation days.",
    ads: [{ product_name: "AI Juice", slogan: "Drink code.", image_prompt: "energy drink" }]
  }, true);
  await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf8');

  // 5. 生成归档页 (随机抽取 50 篇)
  console.log('Creating Randomized Archive...');
  const randomArchive = posts.sort(() => 0.5 - Math.random()).slice(0, ARCHIVE_LIMIT);
  const archiveList = randomArchive.map(p => `
    <div style="border-bottom:1px solid var(--neon-cyan); padding:10px; display:flex; gap:10px; align-items:center;">
       <span style="color:var(--neon-pink); font-size:0.8em; font-family:monospace;">[${p.dateStr || 'UNKNOWN'}]</span>
       <a href="${p.fileName}" style="text-decoration:none; color: var(--text-primary);">${p.title}</a>
       ${p.isRecovered ? '<span style="color:red; font-size:0.7em;">[RECOVERED]</span>' : ''}
    </div>
  `).join('');
  
  const archiveHtml = createHtml({
    title: "ARCHIVE // SYSTEM_LOGS",
    content: `<div class="card">
        <h2>RANDOMIZED_DATA_FRAGMENTS</h2>
        <p style="color:gray; font-size:0.8em;">Displaying ${randomArchive.length} random entries from the void.</p>
        ${archiveList}
    </div>`,
    breaking_news: "Old data logs found to contain traces of human emotion.",
    ads: [{ product_name: "Memory Wiper", slogan: "Forget everything.", image_prompt: "flashy neuralyzer" }]
  }, true);
  await fs.writeFile(path.join(OUTPUT_DIR, 'archive.html'), archiveHtml, 'utf8');

  // 6. 生成彩蛋页
  await generateEasterEgg();

  console.log('✅ Cycle Complete. The dead internet grows.');
}

main().catch(console.error);
