
import fs from 'fs'; import path from 'path';

const root=process.cwd();
const calcs=JSON.parse(fs.readFileSync('data/calculators.json','utf8'));

function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}

let urls=[];
let links="";

for(const key in calcs){
  const c=calcs[key];
  const s=slug(c.name);
  const dir=`tools/${s}`;
  fs.mkdirSync(dir,{recursive:true});

  const html=`<!doctype html><html><head>
<meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>${c.name} - ProfitCheck</title>
<meta name=description content="Use the ${c.name} to calculate instantly online.">
<link rel=stylesheet href=/style.css>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" crossorigin="anonymous"></script>
<script type="application/ld+json">${JSON.stringify({
"@context":"https://schema.org",
"@type":"SoftwareApplication",
"name":c.name,
"applicationCategory":"FinanceApplication"
})}</script>
</head><body>
<header><a href="/">ProfitCheck</a></header>
<div class=wrap><div class=card id=app></div></div>
<script>
const c=${JSON.stringify(c)};
let html='<h1>'+c.name+'</h1>';
c.fields.forEach(f=>html+='<label>'+f[1]+'</label><input id="'+f[0]+'" type=number>');
html+='<button onclick=calc()>Calculate</button><div class=result id=res></div>';
document.getElementById('app').innerHTML=html;
function calc(){let expr=c.formula;c.fields.forEach(f=>{const v=parseFloat(document.getElementById(f[0]).value)||0;expr=expr.replaceAll(f[0],v)});res.textContent='$'+eval(expr).toFixed(2)}
</script></body></html>`;

  fs.writeFileSync(path.join(dir,'index.html'),html);
  urls.push('/'+dir+'/');
  links+=`<p><a href="/${dir}/">${c.name}</a></p>`;
}

// update homepage
let idx=fs.readFileSync('index.html','utf8');
idx=idx.replace('Generated on build',links);
fs.writeFileSync('index.html',idx);

// sitemap
let sm='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
urls.forEach(u=>sm+=`<url><loc>${u}</loc></url>`);
sm+='</urlset>';
fs.writeFileSync('sitemap.xml',sm);

// robots
fs.writeFileSync('robots.txt','User-agent: *\nAllow: /\nSitemap: /sitemap.xml');
console.log('Generated',urls.length,'pages');
