// Storefront persistence layer.
//   SERVER mode -> Express endpoints documented in docs/BACKEND_API.md
//   LOCAL  mode -> automatic fallback (backend not deployed yet / demo): draft + published copies
//                  live in this browser's localStorage so the Studio is fully usable.

import config from '../../../../utils/config';

const headers = (auth) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` });
const unwrap = (json) => (json && typeof json === 'object' && json.data && typeof json.data === 'object' ? json.data : json);
const isOk = (json) => {
  const d = unwrap(json);
  return !!d && d.status !== false && json?.status !== false;
};

const storageKey = (ctx) => `kreya.storefront.v1:${ctx.sub || ctx.session || 'default'}`;

function readLocal(ctx) {
  try {
    const raw = localStorage.getItem(storageKey(ctx));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(ctx, patch) {
  const next = { ...(readLocal(ctx) || {}), ...patch };
  try {
    localStorage.setItem(storageKey(ctx), JSON.stringify(next));
  } catch {
    const err = new Error('Browser storage is full. Remove a few large images or connect the backend.');
    err.code = 'QUOTA';
    throw err;
  }
  return next;
}

async function post(ctx, path, body) {
  const res = await fetch(config.SERVER_URL + path, {
    method: 'POST',
    headers: headers(ctx.auth),
    body: JSON.stringify({ session_id: ctx.session, ...body }),
  });
  if (!res.ok) {
    const err = new Error(`${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function loadStorefront(ctx) {
  if (!config.demo) {
    try {
      const json = await post(ctx, '/seller/storefront/get', {});
      if (isOk(json)) {
        const d = unwrap(json);
        return { mode: 'server', draft: d.draft || d.published || null, published: d.published || null, updatedAt: d.updatedAt || null, publishedAt: d.publishedAt || null };
      }
    } catch {
      /* fall through to local mode */
    }
  }
  const local = readLocal(ctx) || {};
  return { mode: 'local', draft: local.draft || local.published || null, published: local.published || null, updatedAt: local.updatedAt || null, publishedAt: local.publishedAt || null };
}

export async function saveDraft(ctx, cfg) {
  const now = new Date().toISOString();
  if (ctx.mode === 'server') {
    const json = await post(ctx, '/seller/storefront/save', { config: cfg });
    if (!isOk(json)) throw new Error(unwrap(json)?.message || 'Could not save draft');
    return { updatedAt: unwrap(json).updatedAt || now };
  }
  writeLocal(ctx, { draft: cfg, updatedAt: now });
  return { updatedAt: now };
}

export async function publishStorefront(ctx, cfg) {
  const now = new Date().toISOString();
  if (ctx.mode === 'server') {
    const json = await post(ctx, '/seller/storefront/publish', { config: cfg });
    if (!isOk(json)) throw new Error(unwrap(json)?.message || 'Could not publish');
    return { publishedAt: unwrap(json).publishedAt || now, updatedAt: now };
  }
  writeLocal(ctx, { draft: cfg, published: cfg, updatedAt: now, publishedAt: now });
  return { publishedAt: now, updatedAt: now };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

async function compressToDataUrl(file, maxEdge = 1600, quality = 0.82) {
  const src = await fileToDataUrl(file);
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return src;
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const keepPng = file.type === 'image/png' && file.size < 350 * 1024;
    return canvas.toDataURL(keepPng ? 'image/png' : 'image/jpeg', quality);
  } catch {
    return src;
  }
}

/** Upload one image and resolve with its public URL (data-URL in local mode). */
export async function uploadImage(ctx, file) {
  if (!file) throw new Error('No file selected');
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (JPG, PNG or WebP).');
  if (file.size > 8 * 1024 * 1024) throw new Error('Image is larger than 8 MB.');

  if (ctx.mode === 'server') {
    const form = new FormData();
    form.append('file', file, file.name || 'upload.jpg');
    const res = await fetch(`${config.SERVER_URL}/api/get_url`, { method: 'POST', headers: { Authorization: `Bearer ${ctx.auth}` }, body: form });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const json = await res.json();
    const url = json.url || json?.data?.url;
    if (!url) throw new Error('Upload failed: no URL returned');
    return url;
  }
  return compressToDataUrl(file);
}

export const isDataUrl = (v) => typeof v === 'string' && v.startsWith('data:');
