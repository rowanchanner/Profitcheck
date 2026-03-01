import fs from "fs";
import path from "path";

const calcs = JSON.parse(fs.readFileSync("data/calculators.json", "utf8"));
const site = JSON.parse(fs.readFileSync("data/site.json", "utf8"));

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function escHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const toolsOut = [];
const categories = {}; // {cat: [{name, url, desc}]}

for (const key of Object.keys(calcs)) {
  const c = calcs[key];
  const name = c.name?.trim() || key;
  const cat = (c.category || "General").trim();

  const slug = (c.slug && slugify(c.slug)) || slugify(name);
  const dir = `tools/${slug}`;
  fs.mkdirSync(dir, { recursive: true });

  const urlPath = `/${dir}/`;
  const fullUrl = `${site.siteUrl}${urlPath}`;

  // Simple meta description (you can customize per calc later)
  const desc =
    c.description ||
    `Use the ${name} to estimate results instantly. Free online calculator.`;

  const html = `<!doctype html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(name)} - ${escHtml(site.siteName)}</title>
<meta name="description" content="${escHtml(desc)}">
<link rel="canonical" href="${escHtml(fullUrl)}">
<link rel="stylesheet" href="/style.css">

<!-- Google AdSense (replace ca-pub-XXXX with yours) -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" crossorigin="anonymous"></script>

<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: name,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: fullUrl,
  })}</script>
</head><body>
<header><a href="/">${escHtml(site.siteName)}</a></header>

<div class="wrap">
  <div class="card" id="app"></div>

  <div class="card">
    <h2>More calculators</h2>
    <p><a href="/categories/${slugify(cat)}/">${escHtml(cat)} calculators</a></p>
    <p><a href="/">All categories</a></p>
  </div>
</div>

<script>
const c=${JSON.stringify(c)};
let html='<h1>'+c.name+'</h1>';
if(c.description){ html+='<p style="color:#555;margin-top:-6px">'+c.description+'</p>'; }

c.fields.forEach(f=>{
  html+='<label>'+f[1]+'</label><input id="'+f[0]+'" type="number" inputmode="decimal" />';
});

html+='<button onclick="calc()">Calculate</button><div class="result" id="res"></div>';
document.getElementById('app').innerHTML=html;

function calc(){
  let expr=c.formula;
  c.fields.forEach(f=>{
    const v=parseFloat(document.getElementById(f[0]).value)||0;
    expr=expr.replaceAll(f[0],v);
  });
  const out = eval(expr);
  const shown = (typeof out === "number" && isFinite(out)) ? out : 0;
  document.getElementById('res').textContent = '$' + shown.toFixed(2);
}
</script>
</body></html>`;

  fs.writeFileSync(path.join(dir, "index.html"), html);

  toolsOut.push({ name, cat, urlPath, desc });

  if (!categories[cat]) categories[cat] = [];
  categories[cat].push({ name, urlPath, desc });
}

// Sort categories + tools
for (const cat of Object.keys(categories)) {
  categories[cat].sort((a, b) => a.name.localeCompare(b.name));
}

// Build category hub pages
const categoryUrls = [];
for (const cat of Object.keys(categories).sort()) {
  const catSlug = slugify(cat);
  const dir = `categories/${catSlug}`;
  fs.mkdirSync(dir, { recursive: true });

  const urlPath = `/${dir}/`;
  const fullUrl = `${site.siteUrl}${urlPath}`;
  categoryUrls.push({ cat, urlPath });

  const links = categories[cat]
    .map(
      (t) =>
        `<p><a href="${t.urlPath}">${escHtml(t.name)}</a><br><span style="color:#666;font-size:13px">${escHtml(t.desc)}</span></p>`
    )
    .join("");

  const html = `<!doctype html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(cat)} Calculators - ${escHtml(site.siteName)}</title>
<meta name="description" content="Browse ${escHtml(cat)} calculators to estimate profits, earnings and costs.">
<link rel="canonical" href="${escHtml(fullUrl)}">
<link rel="stylesheet" href="/style.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" crossorigin="anonymous"></script>
</head><body>
<header><a href="/">${escHtml(site.siteName)}</a></header>
<div class="wrap">
  <div class="card">
    <h1>${escHtml(cat)} calculators</h1>
    <p style="color:#555">Quick tools to help you decide if something is worth it.</p>
  </div>

  <div class="card">${links}</div>

  <div class="card">
    <a href="/">← Back to all categories</a>
  </div>
</div></body></html>`;

  fs.writeFileSync(path.join(dir, "index.html"), html);
}

// Build homepage grouped by category
let homeBlocks = "";
for (const cat of Object.keys(categories).sort()) {
  const catSlug = slugify(cat);
  const catLink = `/categories/${catSlug}/`;
  const items = categories[cat]
    .map((t) => `<li><a href="${t.urlPath}">${escHtml(t.name)}</a></li>`)
    .join("");
  homeBlocks += `
    <div class="card">
      <h2 style="margin-top:0"><a href="${catLink}">${escHtml(cat)}</a></h2>
      <ul style="margin:0;padding-left:18px">${items}</ul>
    </div>
  `;
}

const indexHtml = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(site.siteName)} — Money Decision Calculators</title>
<meta name="description" content="Free calculators to estimate profits, earnings and costs. Pick a category and calculate instantly.">
<link rel="canonical" href="${escHtml(site.siteUrl)}/">
<link rel="stylesheet" href="/style.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" crossorigin="anonymous"></script>
</head><body>
<header>${escHtml(site.siteName)}</header>
<div class="wrap">
  <div class="card">
    <h1>Money calculators</h1>
    <p style="color:#555">Estimate earnings, profits and costs in seconds. Built for quick decisions.</p>
  </div>
  ${homeBlocks}
</div></body></html>`;

fs.writeFileSync("index.html", indexHtml);

// Build sitemap (FULL URLs)
let sm = `<?xml version="1.0" encoding="UTF-8"?>` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

function addUrl(pathname) {
  sm += `<url><loc>${site.siteUrl}${pathname}</loc></url>`;
}

addUrl("/");
for (const t of toolsOut) addUrl(t.urlPath);
for (const c of categoryUrls) addUrl(c.urlPath);

sm += `</urlset>`;
fs.writeFileSync("sitemap.xml", sm);

// robots
fs.writeFileSync(
  "robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${site.siteUrl}/sitemap.xml\n`
);

console.log("Generated tools:", toolsOut.length, "categories:", Object.keys(categories).length);
