import { SAMPLE_PRODUCTS, SAMPLE_CATEGORIES } from './sample';

const inCatalog = (config, id, products) => {
  const snap = config.catalog?.[id];
  if (snap) return { id, ...snap, isAvailable: snap.isAvailable !== false };
  return products.find((p) => p.id === id) || null;
};

/** Which products should a "products" section show? Falls back to samples so previews never look empty. */
export function resolveProducts(settings, config, products = []) {
  const limit = Math.max(1, Number(settings.limit) || 8);
  let list = [];
  if (settings.source === 'manual') {
    list = (settings.productIds || []).map((id) => inCatalog(config, id, products)).filter(Boolean);
  } else if (settings.source === 'category') {
    const cat = (config.categories || []).find((c) => c.id === settings.categoryId);
    list = (cat?.productIds || []).map((id) => inCatalog(config, id, products)).filter(Boolean);
  } else if (settings.source === 'discounted') {
    list = products.filter((p) => p.price > p.discount).sort((a, b) => (b.price - b.discount) / b.price - (a.price - a.discount) / a.price);
    if (!list.length) list = products;
  } else {
    list = products;
  }
  if (!list.length && products.length === 0 && settings.source !== 'manual' && settings.source !== 'category') {
    const demo = settings.source === 'discounted' ? SAMPLE_PRODUCTS.filter((p) => p.price > p.discount) : SAMPLE_PRODUCTS;
    return { list: demo.slice(0, limit), placeholder: true };
  }
  return { list: list.slice(0, limit), placeholder: false };
}

export function resolveCategories(settings, config) {
  const all = (config.categories || []).filter((c) => c.visible !== false);
  let list = all;
  if (settings.source === 'selected') list = (settings.categoryIds || []).map((id) => all.find((c) => c.id === id)).filter(Boolean);
  if (!list.length) return { list: SAMPLE_CATEGORIES, placeholder: true };
  return { list, placeholder: false };
}
