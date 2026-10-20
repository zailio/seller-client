// Resolve a link object -> href. Portable: used by the preview and by the public shop.
import { slugify } from './utils';

/** ctx = { base, productBase, categories, editor } — in the editor every link is inert. */
export function resolveLink(l, ctx = {}) {
  if (ctx.editor) return '#';
  if (!l || !l.type || l.type === 'none') return undefined;
  const base = (ctx.base || '').replace(/\/$/, '');
  const v = (l.value || '').trim();
  switch (l.type) {
    case 'home': return base || '/';
    case 'all': return `${base}/?view=all`;
    case 'category': {
      const cat = (ctx.categories || []).find((c) => c.id === v);
      return `${base}/?category=${encodeURIComponent(cat?.slug || slugify(cat?.name || v))}`;
    }
    case 'product': return v ? `${ctx.productBase || '/product'}/${encodeURIComponent(v)}` : undefined;
    case 'whatsapp': return v ? `https://wa.me/${v.replace(/[^\d]/g, '')}` : undefined;
    case 'tel': return v ? `tel:${v.replace(/\s/g, '')}` : undefined;
    case 'email': return v ? `mailto:${v}` : undefined;
    case 'url': return v || undefined;
    default: return undefined;
  }
}

export function describeLink(l, categories = []) {
  if (!l || l.type === 'none') return 'No link';
  switch (l.type) {
    case 'home': return 'Home page';
    case 'all': return 'All products';
    case 'category': return `Category · ${categories.find((c) => c.id === l.value)?.name || 'not set'}`;
    case 'product': return l.value ? 'A product' : 'Product · not set';
    case 'url': return l.value || 'Custom URL · not set';
    case 'whatsapp': return `WhatsApp · ${l.value || 'not set'}`;
    case 'tel': return `Call · ${l.value || 'not set'}`;
    case 'email': return `Email · ${l.value || 'not set'}`;
    default: return 'No link';
  }
}
