import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const username = process.env.GH_USER || 'ashiqurzammansm';
const token = process.env.GITHUB_TOKEN;

const headers = { 
  Authorization: `token ${token}`,
  Accept: 'application/vnd.github+json'
};

async function api(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${url}`);
  return res.json();
}

const ICON = {
  'javascript':'javascript','typescript':'typescript','python':'python','java':'java','kotlin':'kotlin','swift':'swift','go':'go','c':'c','cpp':'cplusplus','csharp':'csharp','ruby':'ruby','php':'php','rust':'rust','r':'r','dart':'dart','scala':'scala',
  'html':'html','css':'css','sass':'sass','less':'less','react':'react','nextjs':'nextjs','vue':'vue','nuxtjs':'nuxtjs','svelte':'svelte','angular':'angular','tailwind':'tailwind','bootstrap':'bootstrap','gsap':'greensock',
  'nodejs':'nodejs','express':'express','nestjs':'nestjs','spring':'spring','django':'django','flask':'flask','fastapi':'fastapi','laravel':'laravel','rails':'rails','gin':'gin',
  'android':'androidstudio','kotlin-android':'kotlin','react-native':'react','flutter':'flutter','swiftui':'swift',
  'pytorch':'pytorch','tensorflow':'tensorflow','scikitlearn':'scikitlearn','opencv':'opencv','keras':'keras','numpy':'numpy','pandas':'pandas','jupyter':'jupyter',
  'mysql':'mysql','postgresql':'postgres','sqlite':'sqlite','mongodb':'mongodb','redis':'redis','firebase':'firebase','supabase':'supabase',
  'd3':'d3','chartjs':'chartjs','echarts':'echarts',
  'docker':'docker','kubernetes':'kubernetes','github-actions':'githubactions','gitlabci':'gitlab','jenkins':'jenkins','aws':'aws','gcp':'gcp','azure':'azure','nginx':'nginx','vercel':'vercel','netlify':'netlify',
  'jest':'jest','vitest':'vitest','cypress':'cypress','playwright':'playwright','mocha':'mocha','pytest':'pytest','junit':'java',
  'astro':'astro','hugo':'hugo','gatsby':'gatsby','nextjs-ssg':'nextjs',
  'unity':'unity','unreal':'unrealengine','godot':'godot',
  'puppeteer':'puppeteer','selenium':'selenium','ansible':'ansible','terraform':'terraform',
  'graphql':'graphql','rabbitmq':'rabbitmq','kafka':'kafka'
};

const CATS = {
  LANGUAGES: ['javascript','typescript','python','java','kotlin','swift','go','c','cpp','csharp','ruby','php','rust','r','dart','scala'],
  FRONTEND: ['html','css','sass','less','react','nextjs','vue','nuxtjs','svelte','angular','tailwind','bootstrap','gsap'],
  BACKEND: ['nodejs','express','nestjs','spring','django','flask','fastapi','laravel','rails','gin'],
  MOBILE: ['android','kotlin-android','react-native','flutter','swiftui'],
  AI: ['pytorch','tensorflow','scikitlearn','opencv','keras','numpy','pandas','jupyter'],
  DATABASE: ['mysql','postgresql','sqlite','mongodb','redis','firebase','supabase'],
  DATAVIZ: ['d3','chartjs','echarts'],
  DEVOPS: ['docker','kubernetes','github-actions','gitlabci','jenkins','aws','gcp','azure','nginx','vercel','netlify'],
  BAAS: ['firebase','supabase'],
  FRAMEWORK: ['nextjs','nestjs','spring','django','flask','fastapi','laravel','rails'],
  TESTING: ['jest','vitest','cypress','playwright','mocha','pytest','junit'],
  SSG: ['astro','hugo','gatsby','nextjs-ssg'],
  GAME: ['unity','unreal','godot'],
  AUTOMATION: ['puppeteer','selenium','ansible','terraform'],
  OTHERS: ['graphql','rabbitmq','kafka']
};

// Topic -> canonical mapping to make React/Next.js detections robust
const NORMALIZE = {
  'js': 'javascript',
  'javascript': 'javascript',
  'reactjs': 'react',
  'react': 'react',
  'next': 'nextjs',
  'nextjs': 'nextjs',
  'vuejs': 'vue',
  'vue': 'vue',
  'tailwindcss': 'tailwind',
  'scss': 'sass',
  'postgres': 'postgresql',
  'gha': 'github-actions',
  'android': 'kotlin-android', // treat android topic as mobile (Kotlin or general android)
};

async function listRepos() {
  let page = 1, repos = [];
  while (true) {
    const chunk = await api(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated&page=${page}`);
    repos = repos.concat(chunk);
    if (chunk.length < 100) break;
    page++;
  }
  return repos.filter(r => !r.fork);
}

function normalizeKeyword(k) {
  return NORMALIZE[k.toLowerCase()] || k.toLowerCase();
}

async function collect() {
  const repos = await listRepos();
  const found = new Set();

  for (const r of repos) {
    if (r.language) found.add(normalizeKeyword(r.language));
    try {
      const langs = await api(r.languages_url);
      Object.keys(langs).forEach(k => found.add(normalizeKeyword(k)));
    } catch {}

    try {
      const topics = await api(`https://api.github.com/repos/${username}/${r.name}/topics`);
      (topics.names || []).forEach(t => found.add(normalizeKeyword(t)));
    } catch {}
  }
  return Array.from(found);
}

const iconUrl = (slug) => `https://skillicons.dev/icons?i=${ICON[slug] || slug}`;
const iconTag = (slug) => ICON[slug] ? `![${slug}](${iconUrl(slug)})` : null;

function renderCategory(label, matches) {
  const items = matches.map(iconTag).filter(Boolean);
  if (items.length === 0) return '';
  return `<details><summary><b>${label}</b></summary>\n\n${items.join(' ')}\n\n</details>\n`;
}

function replaceBetween(md, startMarker, endMarker, replacement) {
  const start = md.indexOf(startMarker);
  const end = md.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) return md;
  return md.slice(0, start + startMarker.length) + "\n" + replacement + md.slice(end);
}

(async () => {
  const found = await collect();

  const pick = (arr) => arr.filter(k => found.includes(k));

  const sections = {
    LANGUAGES: renderCategory('Programming Languages', pick(CATS.LANGUAGES)),
    FRONTEND: renderCategory('Frontend Development', pick(CATS.FRONTEND)),
    BACKEND: renderCategory('Backend Development', pick(CATS.BACKEND)),
    MOBILE: renderCategory('Mobile Application Development', pick(CATS.MOBILE)),
    AI: renderCategory('AI / ML', pick(CATS.AI)),
    DATABASE: renderCategory('Database', pick(CATS.DATABASE)),
    DATAVIZ: renderCategory('Data Visualization', pick(CATS.DATAVIZ)),
    DEVOPS: renderCategory('DevOps', pick(CATS.DEVOPS)),
    BAAS: renderCategory('Backend as a Service (BaaS)', pick(CATS.BAAS)),
    FRAMEWORK: renderCategory('Framework', pick(CATS.FRAMEWORK)),
    TESTING: renderCategory('Testing / Software', pick(CATS.TESTING)),
    SSG: renderCategory('Static Site Generators', pick(CATS.SSG)),
    GAME: renderCategory('Game Engine', pick(CATS.GAME)),
    AUTOMATION: renderCategory('Automation', pick(CATS.AUTOMATION)),
    OTHERS: renderCategory('Others', pick(CATS.OTHERS)),
  };

  const __filename = fileURLToPath(import.meta.url);
  const repoRoot = path.resolve(path.dirname(__filename), '..');
  const readmePath = path.join(repoRoot, 'README.md');
  let md = fs.readFileSync(readmePath, 'utf8');

  md = replaceBetween(md, '<!-- SKILLS:LANGUAGES-START -->', '<!-- SKILLS:LANGUAGES-END -->', sections.LANGUAGES);
  md = replaceBetween(md, '<!-- SKILLS:FRONTEND-START -->', '<!-- SKILLS:FRONTEND-END -->', sections.FRONTEND);
  md = replaceBetween(md, '<!-- SKILLS:BACKEND-START -->', '<!-- SKILLS:BACKEND-END -->', sections.BACKEND);
  md = replaceBetween(md, '<!-- SKILLS:MOBILE-START -->', '<!-- SKILLS:MOBILE-END -->', sections.MOBILE);
  md = replaceBetween(md, '<!-- SKILLS:AI-START -->', '<!-- SKILLS:AI-END -->', sections.AI);
  md = replaceBetween(md, '<!-- SKILLS:DATABASE-START -->', '<!-- SKILLS:DATABASE-END -->', sections.DATABASE);
  md = replaceBetween(md, '<!-- SKILLS:DATAVIZ-START -->', '<!-- SKILLS:DATAVIZ-END -->', sections.DATAVIZ);
  md = replaceBetween(md, '<!-- SKILLS:DEVOPS-START -->', '<!-- SKILLS:DEVOPS-END -->', sections.DEVOPS);
  md = replaceBetween(md, '<!-- SKILLS:BAAS-START -->', '<!-- SKILLS:BAAS-END -->', sections.BAAS);
  md = replaceBetween(md, '<!-- SKILLS:FRAMEWORK-START -->', '<!-- SKILLS:FRAMEWORK-END -->', sections.FRAMEWORK);
  md = replaceBetween(md, '<!-- SKILLS:TESTING-START -->', '<!-- SKILLS:TESTING-END -->', sections.TESTING);
  md = replaceBetween(md, '<!-- SKILLS:SSG-START -->', '<!-- SKILLS:SSG-END -->', sections.SSG);
  md = replaceBetween(md, '<!-- SKILLS:GAME-START -->', '<!-- SKILLS:GAME-END -->', sections.GAME);
  md = replaceBetween(md, '<!-- SKILLS:AUTOMATION-START -->', '<!-- SKILLS:AUTOMATION-END -->', sections.AUTOMATION);
  md = replaceBetween(md, '<!-- SKILLS:OTHERS-START -->', '<!-- SKILLS:OTHERS-END -->', sections.OTHERS);

  fs.writeFileSync(readmePath, md);
  console.log('README updated with categorized skills.');
})().catch(e => {
  console.error('Updater failed:', e);
  process.exit(1);
});
