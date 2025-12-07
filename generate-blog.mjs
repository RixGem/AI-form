import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration
const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = process.env.GOOGLE_MODEL || 'gemini-1.5-pro';
const OUTPUT_DIR = '.';          // 生成到仓库根目录
const POST_COUNT = 5;            // 每次新生成多少篇
const MAX_POSTS = 40;            // posts.json 中最多保留多少篇历史
const INDEX_DISPLAY = 5;         // 首页展示多少篇
const META_FILE = 'posts.json';  // 元数据文件名

// Topics for generation（可以看作“写作主题”，不要求和最终标题一致）
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

// CSS Styles (Glassmorphism & Responsive)
const STYLES = `
:root {
  --bg-color: #0f172a;
  --text-color: #e2e8f0;
  --card-bg: rgba(30, 41, 59, 0.7);
  --card-border: rgba(255, 255, 255, 0.1);
  --accent-color: #38bdf8;
  --gradient-start: #3b82f6;
  --gradient-end: #8b5cf6;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--bg-color);
  background-image: 
    radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%);
  background-attachment: fixed;
  color: var(--text-color);
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

header {
  text-align: center;
  margin-bottom: 4rem;
  padding: 2rem 0;
}

h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.subtitle {
  color: #94a3b8;
  font-size: 1.1rem;
}

.card {
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--card-border);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
}

.card h2 {
  margin-top: 0;
  color: #f8fafc;
}

.card h2 a {
  text-decoration: none;
  color: inherit;
  transition: color 0.2s;
}

.card h2 a:hover {
  color: var(--accent-color);
}

.meta {
  font-size: 0.875rem;
  color: #94a3b8;
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
}

.content {
  color: #cbd5e1;
}

.content h3 {
  color: #f1f5f9;
  margin-top: 1.5rem;
}

.btn {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.9;
}

.nav-link {
  color: var(--accent-color);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.nav-link:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  h1 { font-size: 2rem; }
  .card { padding: 1.5rem; }
}
`;

// 读取已有的 posts.json（如果不存在就返回空数组）
async function loadExistingPosts() {
  try {
    const json = await fs.readFile(path.join(OUTPUT_DIR, META_FILE), 'utf8');
    const data = JSON.parse(json);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

// 保存新的 posts.json
async function savePosts(posts) {
  await fs.writeFile(
    path.join(OUTPUT_DIR, META_FILE),
    JSON.stringify(posts, null, 2),
    'utf8'
  );
}

// Helper: Generate content using Gemini API
async function generateContent(prompt) {
  if (!API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is not set.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API Error: ${response.status} ${response.statusText}\n${err}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Helper: Create HTML page
function createHtml(title, bodyContent, isIndex = false) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Tech Insights</title>
  <style>${STYLES}</style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Tech Insights</h1>
      <p class="subtitle">Exploring the frontier of modern development</p>
      ${!isIndex ? '<div style="margin-top:1rem"><a href="index.html" class="nav-link">← Back to Home</a></div>' : ''}
    </header>
    ${bodyContent}
    <footer style="text-align:center; color:#64748b; margin-top:4rem; padding-bottom:2rem;">
      &copy; ${new Date().getFullYear()} Tech Insights Blog. All rights reserved.
    </footer>
  </div>
</body>
</html>`;
}

async function main() {
  console.log('🚀 Starting Blog Generation...');

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // 1. 读取历史元数据
  let posts = await loadExistingPosts();

  const selectedTopics = TOPICS.sort(() => 0.5 - Math.random()).slice(0, POST_COUNT);

  for (let i = 0; i < selectedTopics.length; i++) {
    const topic = selectedTopics[i];
    console.log(`[${i + 1}/${POST_COUNT}] Generating post for: "${topic}"...`);

    const prompt = `
You are an experienced technical blogger.

Write a clear, engaging blog post about the following topic:
"${topic}"

Return ONLY a JSON object with the following structure (no markdown code fences or extra text):
{
  "title": "Engaging, human-like blog post title, based on the topic but not identical to it",
  "summary": "A 2-sentence summary for the preview card.",
  "content": "HTML formatted body content (use <h3>, <p>, <ul>, <li>, <code>). Do not include <h1> or <html> tags."
}
`;

      try {
      let rawText = await generateContent(prompt);

      // 清理可能出现的 `````` 包裹
      rawText = rawText
        .replace(/```
        .replace(/```/g, '')
        .trim();

      const postData = JSON.parse(rawText);

      // 用时间戳避免与历史文件重名
      const ts = Date.now();
      const fileName = `post-${ts}-${i + 1}.html`;

      const date = new Date();
      const dateStr = date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      // 生成单篇文章 HTML
      const postHtml = createHtml(
        postData.title,
        `<article class="card">
          <h2>${postData.title}</h2>
          <div class="meta">Published on ${dateStr} • #Tech</div>
          <div class="content">
            ${postData.content}
          </div>
        </article>`
      );

      await fs.writeFile(path.join(OUTPUT_DIR, fileName), postHtml, 'utf8');

      // 新文章插到列表最前面
      posts.unshift({
        title: postData.title,
        summary: postData.summary,
        fileName,
        dateISO: date.toISOString(),
        dateStr
      });

    } catch (error) {
      console.error(`❌ Failed to generate post for "${topic}":`, error.message);
    }
  }

  // 2. 截断历史，只保留最近 MAX_POSTS 篇
  posts.sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));
  posts = posts.slice(0, MAX_POSTS);

  // 3. 写回 posts.json
  await savePosts(posts);

  // 4. 生成首页（只展示最近 INDEX_DISPLAY 篇）
  console.log('Creating index page...');
  const latest = posts.slice(0, INDEX_DISPLAY);

  const indexBody = latest.map(post => `
    <article class="card">
      <h2><a href="${post.fileName}">${post.title}</a></h2>
      <div class="meta">Published on ${post.dateStr}</div>
      <p>${post.summary}</p>
      <a href="${post.fileName}" class="btn">Read Article</a>
    </article>
  `).join('');

  const indexHtml = createHtml(
    'Home',
    indexBody + `
      <div style="text-align:center; margin-top:2rem;">
        <a href="archive.html" class="nav-link">View full archive →</a>
      </div>
    `,
    true
  );
  await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf8');

  // 5. 生成归档页（展示所有保留的历史）
  console.log('Creating archive page...');
  const archiveBody = posts.map(post => `
    <article class="card">
      <h2><a href="${post.fileName}">${post.title}</a></h2>
      <div class="meta">Published on ${post.dateStr}</div>
      <p>${post.summary}</p>
      <a href="${post.fileName}" class="btn">Read Article</a>
    </article>
  `).join('');

  const archiveHtml = createHtml('Archive', archiveBody, false);
  await fs.writeFile(path.join(OUTPUT_DIR, 'archive.html'), archiveHtml, 'utf8');

  console.log('✅ Blog generation complete! Files and metadata updated.');
}

main().catch(console.error);
