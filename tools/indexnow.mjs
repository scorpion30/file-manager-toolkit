// Tells Bing (and Yandex, Seznam, Naver) about new or changed pages through IndexNow, so they show up in
// Bing search in hours instead of weeks. Google does not use IndexNow; it reads sitemap.xml.
//
// Run it AFTER the push is live on GitHub Pages (the key file must be reachable):
//   node tools/indexnow.mjs                 pages changed in the last commit
//   node tools/indexnow.mjs HEAD~3          pages changed since that commit
//   node tools/indexnow.mjs --all           every page in sitemap.xml
//   node tools/indexnow.mjs --dry ...       print the URLs, send nothing
//
// The key is the file <key>.txt at the site root (it holds the key itself).
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const HOST = 'filemanagertoolkit.com';
const ORIGIN = `https://${HOST}`;
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const rest = args.filter((a) => a !== '--dry');

const keyFile = fs.readdirSync('.').find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('No IndexNow key file (<32 hex>.txt) at the site root.');
const key = fs.readFileSync(keyFile, 'utf8').trim();

const toUrl = (file) => {
  const p = file.replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '$1');
  return `${ORIGIN}/${p}`;
};

let urls;
if (rest.includes('--all')) {
  urls = [...fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
} else {
  const since = rest[0] || 'HEAD~1';
  const files = execSync(`git diff --name-only --diff-filter=AM ${since} HEAD`, { encoding: 'utf8' }).split('\n').filter(Boolean);
  const inSitemap = new Set([...fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  urls = files.filter((f) => f.endsWith('.html')).map(toUrl).filter((u) => inSitemap.has(u));
}
urls = [...new Set(urls)];
if (!urls.length) { console.log('No changed pages to submit.'); process.exit(0); }
console.log(`${urls.length} URL(s):\n  ` + urls.slice(0, 40).join('\n  ') + (urls.length > 40 ? `\n  … and ${urls.length - 40} more` : ''));
if (dry) process.exit(0);

// Check the key file is live first, or IndexNow rejects the whole batch.
const live = await fetch(`${ORIGIN}/${keyFile}`).then((r) => (r.ok ? r.text() : '')).catch(() => '');
if (live.trim() !== key) throw new Error(`${ORIGIN}/${keyFile} is not live yet. Wait for GitHub Pages to deploy, then run again.`);

for (let i = 0; i < urls.length; i += 10000) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key, keyLocation: `${ORIGIN}/${keyFile}`, urlList: urls.slice(i, i + 10000) }),
  });
  console.log(`IndexNow: HTTP ${res.status} ${res.status === 200 || res.status === 202 ? '(accepted)' : await res.text()}`);
}
