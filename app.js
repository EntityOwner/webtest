// App (ESM): clipboard, toasts, hash highlight, and actions per variants

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function toast(msg, { timeout = 2200 } = {}) {
  const wrap = $('#toasts');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), timeout);
}

async function writeClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

// Bookmarklet code (as specified, with prompt)
const BOOKMARKLET_SPEC = "javascript:(async()=>{try{const s=await fetch('/api/auth/session',{credentials:'include'});const j=await s.json();if(!j?.accessToken){alert('Зайдите на chatgpt.com под своим аккаунтом и попробуйте снова');return}const a={plan_name:'chatgptplusplan',billing_details:{country:'US',currency:'USD'},promo_code:null,checkout_ui_mode:'redirect'};const r=await fetch('https://chatgpt.com/backend-api/payments/checkout',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','authorization':'Bearer '+j.accessToken},body:JSON.stringify(a)});const d=await r.json();if(!d?.url){alert('Не удалось получить ссылку. Возможно включён новый метод оплаты.');return}prompt('Скопируйте ссылку на оплату (старого образца):',d.url);}catch(e){alert('Ошибка: '+(e&&e.message?e.message:e))}})();";

// Console code: lazy-load from file
let CONSOLE_CODE_CACHE = null;
async function loadConsoleCode() {
  if (CONSOLE_CODE_CACHE) return CONSOLE_CODE_CACHE;
  try {
    const res = await fetch('playcode-code-for-console.txt');
    CONSOLE_CODE_CACHE = await res.text();
  } catch {
    CONSOLE_CODE_CACHE = '';
  }
  return CONSOLE_CODE_CACHE;
}

// Hash highlight (#var1/#var2/#var3)
function applyHashHighlight() {
  const h = (location.hash || '').toLowerCase();
  const ids = ['#var1', '#var2', '#var3'];
  $$('.card').forEach(el => el.classList.remove('is-highlighted'));
  const idx = ids.indexOf(h);
  const targetId = idx >= 0 ? ids[idx].slice(1) : null;
  if (targetId) {
    const el = document.getElementById(targetId);
    if (el) {
      el.classList.add('is-highlighted');
      el.focus({ preventScroll: true });
      const isMobile = window.matchMedia('(max-width: 980px)').matches;
      if (isMobile) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
}
window.addEventListener('hashchange', applyHashHighlight);

// Variant 3 helpers
let lastToken = '';
function parseSessionJson() {
  const raw = $('#sessionJson').value.trim();
  if (!raw) { $('#sessionStatus').textContent = 'Р’СЃС‚Р°РІСЊС‚Рµ JSON РёР· /api/auth/session'; return; }
  try {
    const obj = JSON.parse(raw);
    const token = obj?.accessToken || '';
    if (!token) throw new Error('accessToken РЅРµ РЅР°Р№РґРµРЅ');
    lastToken = token;
    $('#sessionStatus').textContent = 'РўРѕРєРµРЅ РЅР°Р№РґРµРЅ Рё РіРѕС‚РѕРІ Рє РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЋ.';
    $('[data-action="copy-token"]').disabled = false;
    $('[data-action="copy-api-code"]').disabled = false;
    toast('РўРѕРєРµРЅ РЅР°Р№РґРµРЅ');
  } catch (e) {
    lastToken = '';
    $('#sessionStatus').textContent = 'РћС€РёР±РєР°: ' + e.message;
    $('[data-action="copy-token"]').disabled = true;
    $('[data-action="copy-api-code"]').disabled = true;
  }
}

function buildApiCodeFromToken(token) {
  return `const a = {
  plan_name: 'chatgptplusplan',
  billing_details: { country: 'US', currency: 'USD' },
  promo_code: null,
  checkout_ui_mode: 'redirect'
};

const token = '${token}';
const res = await fetch("https://chatgpt.com/backend-api/payments/checkout", {
  body: JSON.stringify(a),
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json", "authorization": \`Bearer \${token}\` }
});
const data = await res.json();
data.url;`;
}

// Click handlers
function onClick(e) {
  const btn = e.target.closest('button, a');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  if (!action) return;
  if (btn.tagName === 'A') return; // allow normal links
  e.preventDefault();

  switch (action) {
    case 'copy-bookmarklet':
      writeClipboard(BOOKMARKLET_SPEC).then(ok => toast(ok ? 'РљРѕРґ Р·Р°РєР»Р°РґРєРё СЃРєРѕРїРёСЂРѕРІР°РЅ' : 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРєРѕРїРёСЂРѕРІР°С‚СЊ'));
      break;
    case 'how-bookmark':
      alert('РРЅСЃС‚СЂСѓРєС†РёСЏ: СЃРѕР·РґР°Р№С‚Рµ РЅРѕРІСѓСЋ Р·Р°РєР»Р°РґРєСѓ Рё РІСЃС‚Р°РІСЊС‚Рµ СЃРєРѕРїРёСЂРѕРІР°РЅРЅС‹Р№ РєРѕРґ РІ РїРѕР»Рµ URL. Р—Р°С‚РµРј РѕС‚РєСЂРѕР№С‚Рµ chatgpt.com Рё РЅР°Р¶РјРёС‚Рµ Р·Р°РєР»Р°РґРєСѓ.');
      break;
    case 'copy-console':
      loadConsoleCode()
        .then(code => writeClipboard(code))
        .then(ok => toast(ok ? 'РљРѕРґ РґР»СЏ РєРѕРЅСЃРѕР»Рё СЃРєРѕРїРёСЂРѕРІР°РЅ' : 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРєРѕРїРёСЂРѕРІР°С‚СЊ'));
      break;
    case 'parse-json':
      parseSessionJson();
      break;
    case 'clear-json':
      $('#sessionJson').value = '';
      lastToken = '';
      $('#sessionStatus').textContent = '';
      $('[data-action="copy-token"]').disabled = true;
      $('[data-action="copy-api-code"]').disabled = true;
      toast('РџРѕР»Рµ РѕС‡РёС‰РµРЅРѕ');
      break;
    case 'copy-token':
      if (!lastToken) return;
      writeClipboard(lastToken).then(ok => toast(ok ? 'accessToken СЃРєРѕРїРёСЂРѕРІР°РЅ' : 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРєРѕРїРёСЂРѕРІР°С‚СЊ'));
      break;
    case 'copy-api-code':
      if (!lastToken) return;
      writeClipboard(buildApiCodeFromToken(lastToken)).then(ok => toast(ok ? 'РљРѕРґ Р·Р°РїСЂРѕСЃР° СЃРєРѕРїРёСЂРѕРІР°РЅ' : 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРєРѕРїРёСЂРѕРІР°С‚СЊ'));
      break;
    case 'send-to-manager': {
      const raw = $('#sessionJson').value.trim();
      if (!raw) { toast('РџРѕР»Рµ РїСѓСЃС‚РѕРµ вЂ” РІСЃС‚Р°РІСЊС‚Рµ JSON'); return; }
      const wrapped = '```\n' + raw + '\n```';
      writeClipboard(wrapped).then(() => {
        toast('РЎРєРѕРїРёСЂРѕРІР°РЅРѕ. РћС‚РєСЂС‹РІР°СЋ Telegram РјРµРЅРµРґР¶РµСЂР°...');
        window.open('https://t.me/fursovtech', '_blank');
      });
      break;
    }
    default:
      break;
  }
}

document.addEventListener('click', onClick);

// Init
applyHashHighlight();

// Title marquee (cyclic scrolling in the tab)
const BASE_TITLE = ' Fursov - your payment assistance | '; // padded for smooth loop
let marquee = BASE_TITLE;
setInterval(() => {
  marquee = marquee.slice(1) + marquee[0];
  document.title = marquee;
}, 350);

// Inject bookmarklet href for drag-to-bookmarks link
(() => {
  const link = document.querySelector('[data-bookmarklet]');
  if (link) {
    try { link.setAttribute('href', BOOKMARKLET_SPEC); } catch {}
  }
})();




