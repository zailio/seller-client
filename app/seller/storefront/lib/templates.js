// Starter templates. Each one builds a complete storefront configuration.
import { defaultConfig, createSection, link, defaultFooter, createCategory } from './schema';
import { PALETTES } from './themes';
import { uid } from './utils';

const palette = (id) => PALETTES.find((p) => p.id === id) || PALETTES[0];

function themeFrom(paletteId, extra = {}) {
  const p = palette(paletteId);
  return {
    palette: p.id, primary: p.primary, accent: p.accent, background: p.background, surface: p.surface,
    text: p.text, muted: p.muted, fonts: 'modern', radius: 'soft', density: 'comfortable', buttonStyle: 'solid',
    ...extra,
  };
}

function sec(type, patch = {}) {
  const s = createSection(type);
  Object.assign(s.settings, patch);
  return s;
}

function slide(patch) {
  return { id: uid('sl'), image: '', eyebrow: '', title: '', subtitle: '', cta: 'Shop now', ctaLink: link('all'), align: 'left', overlay: 35, tone: 'auto', ...patch };
}

const base = (brand, patch) => Object.assign(defaultConfig(brand), patch);
const ann = (patch) => ({ ...defaultConfig().announcement, ...patch });
const hdr = (patch) => ({ ...defaultConfig().header, ...patch });
const msg = (text) => [{ id: uid('an'), text, link: link() }];

export const TEMPLATES = [
  {
    id: 'aurora', name: 'Aurora', tagline: 'Clean, airy and conversion-focused', tags: ['General store', 'Home & living'],
    colors: ['#4f46e5', '#f59e0b', '#f5f6fb', '#0f172a'],
    build(brand = {}) {
      return base(brand, {
        theme: themeFrom('indigo'),
        sections: [
          sec('hero', { slides: [
            slide({ eyebrow: 'New season', title: 'Everything you need, beautifully curated', subtitle: 'Quality essentials with fast delivery across India.', cta: 'Explore the collection' }),
            slide({ eyebrow: 'Limited time', title: 'Up to 40% off bestsellers', subtitle: 'Fresh deals every week — don’t miss out.', cta: 'Grab the deals', align: 'center' }),
          ] }),
          sec('features'),
          sec('categories', { style: 'circles' }),
          sec('offers'),
          sec('products', { title: 'Trending right now', source: 'latest' }),
          sec('banner'),
          sec('products', { title: 'Best deals', subtitle: 'Hand-picked discounts', source: 'discounted', layout: 'carousel', columns: 4 }),
          sec('testimonials'),
        ],
      });
    },
  },
  {
    id: 'boutique', name: 'Boutique', tagline: 'Soft, editorial look for fashion & beauty', tags: ['Fashion', 'Beauty', 'Jewellery'],
    colors: ['#be185d', '#f9a8d4', '#ffeaf3', '#2d0f1e'],
    build(brand = {}) {
      return base(brand, {
        theme: themeFrom('blush', { fonts: 'boutique', radius: 'round', density: 'spacious' }),
        sections: [
          sec('hero', { layout: 'split', height: 'lg', slides: [slide({ eyebrow: 'Autumn / Winter', title: 'Dressed in quiet confidence', subtitle: 'Timeless pieces made to be loved for years.', cta: 'Shop the edit', tone: 'dark' })] }),
          sec('categories', { style: 'cards', title: 'Shop the edit' }),
          sec('products', { title: 'New in', subtitle: 'Fresh from the studio', cardStyle: 'overlay', columns: 4, source: 'latest' }),
          sec('text', { eyebrow: 'Our story', heading: 'Crafted slowly, worn forever', layout: 'image-right', align: 'left' }),
          sec('offers', { style: 'coupons', title: 'Little treats for you' }),
          sec('testimonials', { style: 'quote' }),
        ],
        header: hdr({ layout: 'centered', logoMode: 'text', logoHeight: 40, search: { ...defaultConfig().header.search, style: 'underline' } }),
        announcement: ann({ bg: '#be185d', color: '#ffffff', style: 'static', items: msg('Complimentary gift wrap on every order ✦') }),
      });
    },
  },
  {
    id: 'midnight', name: 'Midnight', tagline: 'Dark, sharp and high-energy for tech & gadgets', tags: ['Electronics', 'Gaming', 'Accessories'],
    colors: ['#818cf8', '#f472b6', '#131a2e', '#e8ecf8'],
    build(brand = {}) {
      return base(brand, {
        theme: themeFrom('midnight', { fonts: 'tech' }),
        sections: [
          sec('hero', { height: 'lg', slides: [slide({ eyebrow: 'Just landed', title: 'Next-gen gear, ready to ship', subtitle: 'Premium electronics with warranty and express delivery.', cta: 'Shop gadgets', overlay: 55, tone: 'light' })] }),
          sec('countdown', { title: 'Flash sale — ends in', subtitle: 'Prices drop only while the clock is ticking', tone: 'primary' }),
          sec('categories', { style: 'tiles', title: 'Browse by type' }),
          sec('products', { title: 'Top picks', source: 'latest', layout: 'carousel', columns: 4 }),
          sec('offers', { style: 'cards', title: 'Bank & coupon offers' }),
          sec('features', { style: 'cards' }),
        ],
        announcement: ann({ bg: '#818cf8', color: '#0b1020', style: 'marquee', items: msg('Extra 10% off with UPI • No-cost EMI available • 1-year warranty') }),
      });
    },
  },
  {
    id: 'fresh', name: 'Fresh', tagline: 'Friendly and vibrant for food, grocery & wellness', tags: ['Grocery', 'Organic', 'Wellness'],
    colors: ['#059669', '#f59e0b', '#f1f8f5', '#0b1f1a'],
    build(brand = {}) {
      return base(brand, {
        theme: themeFrom('emerald', { fonts: 'friendly', radius: 'round' }),
        sections: [
          sec('hero', { slides: [slide({ eyebrow: 'Farm to doorstep', title: 'Fresh, natural and delivered today', subtitle: 'Hand-picked produce and pantry staples you can trust.', cta: 'Start shopping' })] }),
          sec('categories', { style: 'tiles', title: 'Shop by aisle' }),
          sec('offers', { style: 'ticker', title: 'Today’s offers' }),
          sec('products', { title: 'Daily essentials', columns: 5, limit: 10, source: 'latest' }),
          sec('features', { style: 'cards' }),
          sec('products', { title: 'Big savings', source: 'discounted', columns: 4, limit: 8 }),
          sec('testimonials'),
        ],
      });
    },
  },
  {
    id: 'bold', name: 'Bold', tagline: 'High-contrast streetwear energy', tags: ['Streetwear', 'Sneakers', 'Lifestyle'],
    colors: ['#111827', '#facc15', '#f4f4f5', '#09090b'],
    build(brand = {}) {
      return base(brand, {
        theme: themeFrom('mono', { fonts: 'bold', radius: 'sharp', accent: '#facc15' }),
        sections: [
          sec('hero', { height: 'lg', slides: [slide({ eyebrow: 'Drop 07', title: 'LOUD. LIMITED. YOURS.', subtitle: 'New pieces every Friday. Once they’re gone, they’re gone.', cta: 'Shop the drop', align: 'center', overlay: 55, tone: 'light' })] }),
          sec('categories', { style: 'chips', title: 'Pick your lane' }),
          sec('products', { title: 'Fresh drops', cardStyle: 'minimal', columns: 4, source: 'latest' }),
          sec('banner', { style: 'full', tone: 'accent', eyebrow: 'Members only', title: 'Free shipping on every order this weekend', subtitle: '', cta: 'Claim it' }),
          sec('products', { title: 'On sale', source: 'discounted', cardStyle: 'minimal', columns: 4 }),
        ],
        header: hdr({ logoMode: 'text', bg: '#111827', color: '#ffffff', border: 'none' }),
        announcement: ann({ bg: '#facc15', color: '#111827', style: 'marquee', items: msg('FREE SHIPPING OVER ₹999  •  NEW DROP EVERY FRIDAY  •  EASY 7-DAY RETURNS') }),
        footer: { ...defaultFooter(), bg: '#111827', color: '#ffffff' },
      });
    },
  },
  {
    id: 'luxe', name: 'Luxe', tagline: 'Understated and elegant for premium brands', tags: ['Jewellery', 'Premium', 'Gifting'],
    colors: ['#a16207', '#1c1917', '#faf4e4', '#1c1917'],
    build(brand = {}) {
      return base(brand, {
        theme: themeFrom('gold', { fonts: 'elegant', radius: 'sharp', density: 'spacious' }),
        sections: [
          sec('hero', { height: 'lg', slides: [slide({ eyebrow: 'The signature collection', title: 'Objects of lasting beauty', subtitle: 'Considered design, exceptional materials.', cta: 'Discover', align: 'center', tone: 'dark', overlay: 20 })] }),
          sec('text', { eyebrow: 'Philosophy', heading: 'Less, but better', body: 'Every piece is made to be kept. We work with small studios and honest materials to create things that age gracefully.', align: 'center' }),
          sec('categories', { style: 'cards', title: 'Collections' }),
          sec('products', { title: 'The essentials', cardStyle: 'minimal', columns: 3, limit: 6, source: 'latest' }),
          sec('banner', { style: 'split', tone: 'surface', eyebrow: 'Gifting', title: 'Beautifully wrapped, thoughtfully delivered', subtitle: 'Add a handwritten note at checkout.', cta: 'Explore gifts' }),
          sec('testimonials', { style: 'quote' }),
        ],
        header: hdr({ layout: 'centered', logoMode: 'text', logoHeight: 40, search: { ...defaultConfig().header.search, style: 'underline' } }),
        announcement: ann({ bg: '#1c1917', color: '#faf4e4', style: 'static', items: msg('Complimentary insured shipping on all orders') }),
      });
    },
  },
];

export function buildTemplate(id, brand) {
  const t = TEMPLATES.find((x) => x.id === id) || TEMPLATES[0];
  const cfg = t.build(brand);
  cfg.categories = ['New arrivals', 'Best sellers', 'Offers', 'Gifting'].map((n, i) => ({ ...createCategory(n), emoji: ['✨', '🔥', '🏷️', '🎁'][i] }));
  return cfg;
}
