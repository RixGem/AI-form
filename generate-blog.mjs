import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration
const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = process.env.GOOGLE_MODEL || 'gemini-1.5-pro';
const OUTPUT_DIR = '.';
const POST_COUNT = 5;

// Topics for generation
const TOPICS = [
    "Essential Linux Server Maintenance Tips for 2025",
    "Python Productivity Hacks You Might Have Missed",
    "Modern Frontend Performance Optimization Techniques",
    "The Art of Coffee Brewing for Developers",
    "Understanding WebSocket Protocol Deep Dive",
    "Securing Your Cloudflare Worker Deployments",
    "Vim vs Emacs: A Neutral Perspective",
    "Introduction to eBPF for System Administrators"
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

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const posts = [];
    const selectedTopics = TOPICS.sort(() => 0.5 - Math.random()).slice(0, POST_COUNT);

    for (let i = 0; i < selectedTopics.length; i++) {
        const topic = selectedTopics[i];
        console.log(`[${i + 1}/${POST_COUNT}] Generating post for: "${topic}"...`);

        const prompt = `
      Write a technical blog post about "${topic}".
      Return ONLY a JSON object with the following structure (no markdown formatting blocks):
      {
        "title": "Engaging Title",
        "summary": "A 2-sentence summary for the preview card.",
        "content": "HTML formatted body content (use <h3>, <p>, <ul>, <li>, <code>). Do not include <h1> or <html> tags."
      }
    `;

        try {
            let rawText = await generateContent(prompt);
            // Clean up potential markdown code blocks if the model adds them
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

            const postData = JSON.parse(rawText);
            const fileName = `post-${i + 1}.html`;
            const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

            // Save post metadata for index
            posts.push({ ...postData, fileName, dateStr });

            // 1. Generate Individual Post HTML
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

            await fs.writeFile(fileName, postHtml);

        } catch (error) {
            console.error(`❌ Failed to generate post for "${topic}":`, error.message);
        }
    }

    // 2. Generate Index HTML
    console.log('Creating index page...');
    const indexBody = posts.map(post => `
    <article class="card">
        <h2><a href="${post.fileName}">${post.title}</a></h2>
        <div class="meta">Published on ${post.dateStr}</div>
        <p>${post.summary}</p>
        <a href="${post.fileName}" class="btn">Read Article</a>
    </article>
  `).join('');

    const indexHtml = createHtml('Home', indexBody, true);
    await fs.writeFile('index.html', indexHtml);

    console.log('✅ Blog generation complete! Files saved to:', OUTPUT_DIR);
}

main().catch(console.error);
