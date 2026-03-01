import fs from "fs";
import path from "path";

const calcs = JSON.parse(fs.readFileSync("data/calculators.json", "utf8"));
const site = JSON.parse(fs.readFileSync("data/site.json", "utf8"));

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function escHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Google AdSense (your real publisher id)
const ADSENSE = `<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9182414203594254"
  crossorigin="anonymous"></script>`;

// Favicons (place these files in repo root)
const FAVICON_TAGS = `
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
`.trim();

// Footer (on every page)
const SITE_FOOTER_HTML = `
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">© 2026 ProfitCheck.uk</div>
    <div class="footer-links">
      <a href="/about.html">About</a>
      <a href="/privacy.html">Privacy Policy</a>
      <a href="/terms.html">Terms of Service</a>
    </div>
  </div>
</footer>
`.trim();

// Auto intro text for AdSense trust + “not just generated pages”
function toolIntro({ name, cat }) {
  const n = name;
  const c = cat || "General";

  const base =
    `This calculator helps you estimate results using the numbers you enter below. ` +
    `It’s designed for quick decisions when you’re comparing costs, earnings, or profit. ` +
    `Results are estimates and can vary depending on fees, taxes, platform rules, and other real-world factors.`;

  const extraByCat = {
    Creator:
      " If you’re a creator, try different view/CPM assumptions to see a realistic range.",
    Reselling:
      " If you’re reselling, include all fees and costs so your profit estimate is realistic.",
    "Money Basics":
      " For money planning, use conservative numbers and treat results as a guide—not advice.",
    "Travel & Costs":
      " For trips and expenses, add a buffer for price changes and unexpected costs.",
  };

  return base + (extraByCat[c] || "");
}

const toolsOut = []; // {name, cat, urlPath, desc}
const categories = {}; // {cat: [{name,urlPath,desc}]}

for (const key of Object.keys(calcs)) {
  const c = calcs[key];
  const name = (c.name || key).trim();
  const cat = (c.category || "General").trim();

  const slug = (c.slug && slugify(c.slug)) || slugify(name);
  const dir = `tools/${slug}`;
  fs.mkdirSync(dir, { recursive: true });

  const urlPath = `/${dir}/`;
  const fullUrl = `${site.siteUrl}${urlPath}`;

  const desc =
    c.description ||
    `Use the ${name} to estimate results instantly. Free online calculator.`;

  // ---- Auto FAQ (on every tool) ----
  const faq = [
    {
      question: `How does the ${name} work?`,
      answer:
        "Enter your numbers and press Calculate. The tool uses the formula shown by its inputs to estimate a result instantly.",
    },
    {
      question: "Is this calculator free to use?",
      answer: "Yes — all calculators on this site are free.",
    },
    {
      question: "Are these results exact?",
      answer:
        "They’re estimates. Real-world results can vary based on fees, taxes, platform rules, location, and other costs.",
    },
  ];

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const appLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: fullUrl,
  };

  // Tool page HTML
  const html = `<!doctype html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(name)} - ${escHtml(site.siteName)}</title>
<meta name="description" content="${escHtml(desc)}">
<link rel="canonical" href="${escHtml(fullUrl)}">
<link rel="stylesheet" href="/style.css">
${FAVICON_TAGS}
${ADSENSE}

<script type="application/ld+json">${JSON.stringify(appLd)}</script>
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
</head><body>
<header><a href="/">${escHtml(site.siteName)}</a></header>

<div class="wrap">

  <div class="card">
    <h1 style="margin-top:0">${escHtml(name)}</h1>
    <p class="muted">${escHtml(toolIntro({ name, cat }))}</p>
  </div>

  <div class="card" id="app"></div>

  <div class="card">
    <h2>FAQ</h2>
    ${faq
      .map(
        (f) =>
          `<details><summary><strong>${escHtml(
            f.question
          )}</strong></summary><p style="color:#555">${escHtml(
            f.answer
          )}</p></details>`
      )
      .join("")}
  </div>

  <div class="card">
    <h2>More calculators</h2>
    <p><a href="/categories/${slugify(cat)}/">${escHtml(cat)} calculators</a></p>
    <p><a href="/tools/">All calculators (A–Z)</a></p>
    <p><a href="/">All categories</a></p>
  </div>

</div>

${SITE_FOOTER_HTML}

<script>
const c=${JSON.stringify(c)};

let html='';
if(c.description){ html+='<p style="color:#555;margin-top:0">'+c.description+'</p>'; }

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
toolsOut.sort((a, b) => a.name.localeCompare(b.name));

// ---- Category hub pages ----
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
        `<p class="tool-row"><a href="${t.urlPath}">${escHtml(
          t.name
        )}</a><br><span class="muted">${escHtml(t.desc)}</span></p>`
    )
    .join("");

  const html = `<!doctype html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(cat)} Calculators - ${escHtml(site.siteName)}</title>
<meta name="description" content="Browse ${escHtml(cat)} calculators to estimate profits, earnings and costs.">
<link rel="canonical" href="${escHtml(fullUrl)}">
<link rel="stylesheet" href="/style.css">
${FAVICON_TAGS}
${ADSENSE}
</head><body>
<header><a href="/">${escHtml(site.siteName)}</a></header>

<div class="wrap">
  <div class="card">
    <h1>${escHtml(cat)} calculators</h1>
    <p class="muted">Browse calculators in this category.</p>
  </div>

  <div class="card">${links}</div>

  <div class="card">
    <a href="/tools/">All calculators (A–Z)</a> · <a href="/">All categories</a>
  </div>
</div>

${SITE_FOOTER_HTML}

</body></html>`;

  fs.writeFileSync(path.join(dir, "index.html"), html);
}

// ---- Tools Index page (/tools/) ----
{
  const dir = `tools`;
  fs.mkdirSync(dir, { recursive: true });

  const urlPath = `/tools/`;
  const fullUrl = `${site.siteUrl}${urlPath}`;

  const list = toolsOut
    .map(
      (t) => `<p class="tool-row">
        <a href="${t.urlPath}">${escHtml(t.name)}</a>
        <br><span class="muted">${escHtml(t.desc)}</span>
        <br><span class="muted">Category: <a href="/categories/${slugify(
          t.cat
        )}/">${escHtml(t.cat)}</a></span>
      </p>`
    )
    .join("");

  const html = `<!doctype html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>All Calculators (A–Z) - ${escHtml(site.siteName)}</title>
<meta name="description" content="Browse all ProfitCheck calculators (A–Z) and calculate instantly.">
<link rel="canonical" href="${escHtml(fullUrl)}">
<link rel="stylesheet" href="/style.css">
${FAVICON_TAGS}
${ADSENSE}
</head><body>
<header><a href="/">${escHtml(site.siteName)}</a></header>

<div class="wrap">
  <div class="card">
    <h1>All calculators (A–Z)</h1>
    <p class="muted">Search any calculator below.</p>

    <input id="search" class="search" placeholder="Search calculators (e.g. YouTube, eBay, loan…)" />
    <div id="results">${list}</div>
  </div>

  <div class="card">
    <a href="/">← Back to categories</a>
  </div>
</div>

${SITE_FOOTER_HTML}

<script>
const input=document.getElementById('search');
const rows=[...document.querySelectorAll('.tool-row')];
input.addEventListener('input', ()=>{
  const q=input.value.toLowerCase().trim();
  rows.forEach(r=>{
    const txt=r.innerText.toLowerCase();
    r.style.display = txt.includes(q) ? '' : 'none';
  });
});
</script>
</body></html>`;

  fs.writeFileSync(path.join(dir, "index.html"), html);
}

// ---- Homepage grouped + SEARCH across all tools ----
let homeBlocks = "";
for (const cat of Object.keys(categories).sort()) {
  const catSlug = slugify(cat);
  const catLink = `/categories/${catSlug}/`;
  const items = categories[cat]
    .slice(0, 8)
    .map((t) => `<li><a href="${t.urlPath}">${escHtml(t.name)}</a></li>`)
    .join("");

  const more =
    categories[cat].length > 8
      ? `<p class="muted"><a href="${catLink}">View all ${escHtml(
          cat
        )} calculators →</a></p>`
      : "";

  homeBlocks += `
    <div class="card">
      <h2 style="margin-top:0"><a href="${catLink}">${escHtml(cat)}</a></h2>
      <ul style="margin:0;padding-left:18px">${items}</ul>
      ${more}
    </div>
  `;
}

const searchData = toolsOut.map((t) => ({
  name: t.name,
  url: t.urlPath,
  cat: t.cat,
}));

const indexHtml = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(site.siteName)} — Money Decision Calculators</title>
<meta name="description" content="Free calculators to estimate profits, earnings and costs. Search and calculate instantly.">
<link rel="canonical" href="${escHtml(site.siteUrl)}/">
<link rel="stylesheet" href="/style.css">
${FAVICON_TAGS}
${ADSENSE}
</head><body>
<header>${escHtml(site.siteName)}</header>

<div class="wrap">
  <div class="card">
    <h1>Money calculators</h1>
    <p class="muted">
      ProfitCheck is a free collection of financial decision calculators that help you estimate earnings, costs and profitability for everyday situations
      like creator income, reselling, loans and expenses.
    </p>
    <p class="muted">Estimate earnings, profits and costs in seconds.</p>

    <input id="homeSearch" class="search" placeholder="Search calculators (e.g. TikTok, eBay, loan…)" />
    <div id="homeResults" class="results"></div>

    <p class="muted" style="margin-top:12px">
      Or browse categories below · <a href="/tools/">All calculators (A–Z)</a>
    </p>
  </div>

  ${homeBlocks}
</div>

${SITE_FOOTER_HTML}

<script>
const DATA=${JSON.stringify(searchData)};
const input=document.getElementById('homeSearch');
const box=document.getElementById('homeResults');

function render(q){
  const qq=q.toLowerCase().trim();
  if(!qq){ box.innerHTML=''; return; }
  const hits=DATA.filter(x => (x.name+x.cat).toLowerCase().includes(qq)).slice(0, 10);
  box.innerHTML = hits.map(h => 
    '<div class="hit"><a href="'+h.url+'">'+h.name+'</a><div class="muted">'+h.cat+'</div></div>'
  ).join('');
}

input.addEventListener('input', ()=>render(input.value));
</script>

</body></html>`;

fs.writeFileSync("index.html", indexHtml);

// ---- Sitemap (FULL URLs) ----
let sm =
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

function addUrl(pathname) {
  sm += `<url><loc>${site.siteUrl}${pathname}</loc></url>`;
}

addUrl("/");
addUrl("/tools/");
for (const t of toolsOut) addUrl(t.urlPath);
for (const c of categoryUrls) addUrl(c.urlPath);

sm += `</urlset>`;
fs.writeFileSync("sitemap.xml", sm);

// robots.txt
fs.writeFileSync(
  "robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${site.siteUrl}/sitemap.xml\n`
);

console.log(
  "Generated tools:",
  toolsOut.length,
  "categories:",
  Object.keys(categories).length
);
