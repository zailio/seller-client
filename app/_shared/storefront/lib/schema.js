// Storefront configuration schema (v1).
// Framework-free: copy this file + /renderer into the customer-facing app to render a published storefront.

import { uid, clone, mergeDefaults } from './utils';

export const SCHEMA_VERSION = 1;
export const link = (type = 'none', value = '') => ({ type, value });

export const defaultTheme = () => ({
  palette: 'indigo',
  primary: '#4f46e5',
  accent: '#f59e0b',
  background: '#ffffff',
  surface: '#f5f6fb',
  text: '#0f172a',
  muted: '#64748b',
  fonts: 'modern',
  radius: 'soft',
  density: 'comfortable',
  buttonStyle: 'solid', // solid | outline | soft
});

export const defaultBrand = () => ({
  name: 'My Store',
  tagline: '',
  bio: '',
  logo: '',
  favicon: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  hours: '',
  vacation: { enabled: false, message: 'We are on a short break. Orders resume soon!' },
});

export const defaultAnnouncement = () => ({
  enabled: true,
  style: 'rotate', // static | rotate | marquee
  items: [
    { id: uid('an'), text: '🚚 Free delivery on orders above ₹499', link: link() },
    { id: uid('an'), text: '✨ New arrivals are live — shop the latest drop', link: link() },
  ],
  bg: '#0f172a',
  color: '#ffffff',
  dismissible: false,
});

export const defaultHeader = () => ({
  enabled: true,
  layout: 'classic', // classic | centered | minimal
  sticky: true,
  background: 'solid', // solid | blur | transparent
  bg: '',
  color: '',
  border: 'line', // none | line | shadow
  height: 'regular', // compact | regular | tall
  logoMode: 'both', // image | text | both
  logoHeight: 36,
  search: { enabled: true, placeholder: 'Search products…', style: 'pill', icon: 'IoSearch' },
  cart: { enabled: true, icon: 'HiOutlineShoppingBag' },
  wishlist: { enabled: true },
  account: { enabled: true },
  menuIcon: 'RxHamburgerMenu',
  navSource: 'custom', // custom | categories
  nav: [
    { id: uid('nv'), label: 'Home', link: link('home') },
    { id: uid('nv'), label: 'All products', link: link('all') },
    { id: uid('nv'), label: 'New arrivals', link: link('url', '#new') },
  ],
});

export const defaultFooter = () => ({
  enabled: true,
  layout: 'columns', // columns | centered | minimal
  bg: '',
  color: '',
  showLogo: true,
  about: '',
  columns: [
    {
      id: uid('fc'),
      title: 'Shop',
      links: [
        { id: uid('fl'), label: 'All products', link: link('all') },
        { id: uid('fl'), label: 'New arrivals', link: link('url', '#new') },
        { id: uid('fl'), label: 'Offers', link: link('url', '#offers') },
      ],
    },
    {
      id: uid('fc'),
      title: 'Help',
      links: [
        { id: uid('fl'), label: 'Track order', link: link('url', '/track-order') },
        { id: uid('fl'), label: 'Shipping & returns', link: link('url', '#') },
        { id: uid('fl'), label: 'Contact us', link: link('url', '#') },
      ],
    },
  ],
  contact: { show: true },
  socials: [],
  newsletter: { enabled: false, title: 'Join the list', text: 'Be the first to hear about new drops and offers.', button: 'Subscribe' },
  payments: ['UPI', 'Visa', 'Mastercard', 'RuPay', 'COD'],
  showPayments: true,
  copyright: '© {year} {shop}. All rights reserved.',
  poweredBy: true,
});

export const defaultSeo = () => ({ title: '', description: '', image: '' });

export const createCategory = (name = 'New category') => ({
  id: uid('cat'),
  name,
  slug: '',
  description: '',
  image: '',
  emoji: '',
  visible: true,
  productIds: [],
});

const section = (type, settings) => ({ id: uid('sec'), type, enabled: true, settings });

export const SECTION_FACTORIES = {
  hero: () =>
    section('hero', {
      layout: 'slider', // slider | split
      height: 'md', // sm | md | lg
      autoplay: true,
      interval: 5,
      arrows: true,
      dots: true,
      slides: [
        {
          id: uid('sl'),
          image: '',
          eyebrow: 'New collection',
          title: 'Discover what you will love',
          subtitle: 'Hand-picked products, delivered fast and priced right.',
          cta: 'Shop now',
          ctaLink: link('all'),
          align: 'left',
          overlay: 35,
          tone: 'auto', // auto | light | dark
        },
      ],
    }),

  offers: () =>
    section('offers', {
      title: 'Offers for you',
      subtitle: 'Limited-time deals, just for our customers',
      style: 'cards', // cards | coupons | ticker
      items: [
        { id: uid('of'), badge: 'Flat 20% OFF', title: 'Welcome offer', subtitle: 'On your first order', code: 'WELCOME20', tone: 'primary', image: '', link: link('all') },
        { id: uid('of'), badge: 'Free shipping', title: 'Orders above ₹499', subtitle: 'Across India', code: '', tone: 'accent', image: '', link: link('all') },
        { id: uid('of'), badge: 'Buy 2 get 1', title: 'Bundle & save', subtitle: 'Mix and match favourites', code: 'BUNDLE', tone: 'dark', image: '', link: link('all') },
      ],
    }),

  categories: () =>
    section('categories', {
      title: 'Shop by category',
      subtitle: '',
      style: 'circles', // circles | cards | tiles | chips
      source: 'all', // all | selected
      categoryIds: [],
      showCount: true,
    }),

  products: () =>
    section('products', {
      title: 'Featured products',
      subtitle: 'Our most-loved picks',
      source: 'latest', // latest | discounted | manual | category
      productIds: [],
      categoryId: '',
      layout: 'grid', // grid | carousel
      columns: 4,
      limit: 8,
      cardStyle: 'card', // card | minimal | overlay
      showDiscount: true,
      showAddToCart: true,
      viewAll: { enabled: true, label: 'View all', link: link('all') },
    }),

  banner: () =>
    section('banner', {
      style: 'contained', // contained | full | split
      image: '',
      eyebrow: 'Limited edition',
      title: 'Season sale is on',
      subtitle: 'Up to 40% off on selected styles',
      cta: 'Shop the sale',
      link: link('all'),
      tone: 'primary', // primary | accent | dark | surface
      height: 'md',
    }),

  countdown: () =>
    section('countdown', {
      title: 'Flash sale ends soon',
      subtitle: 'Grab it before the timer runs out',
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      cta: 'Shop now',
      link: link('all'),
      tone: 'dark',
    }),

  features: () =>
    section('features', {
      style: 'row', // row | cards
      items: [
        { id: uid('ft'), icon: 'truck', title: 'Fast delivery', text: 'Quick shipping across India' },
        { id: uid('ft'), icon: 'shield', title: 'Secure payments', text: '100% protected checkout' },
        { id: uid('ft'), icon: 'refresh', title: 'Easy returns', text: 'Hassle-free replacements' },
        { id: uid('ft'), icon: 'headset', title: 'Friendly support', text: 'We are one message away' },
      ],
    }),

  text: () =>
    section('text', {
      eyebrow: 'Our story',
      heading: 'Made with care, shipped with love',
      body: 'Tell your customers who you are, what you stand for and why they will love shopping with you.\n\nShort paragraphs work best.',
      image: '',
      layout: 'text', // text | image-left | image-right
      align: 'center',
      cta: '',
      link: link(),
    }),

  testimonials: () =>
    section('testimonials', {
      title: 'Loved by customers',
      style: 'cards', // cards | quote
      items: [
        { id: uid('ts'), name: 'Aarav S.', role: 'Verified buyer', quote: 'Superb quality and it reached in two days. Will order again!', rating: 5, avatar: '' },
        { id: uid('ts'), name: 'Meera K.', role: 'Verified buyer', quote: 'Exactly as shown. Packaging was lovely and support was quick.', rating: 5, avatar: '' },
        { id: uid('ts'), name: 'Rohan P.', role: 'Verified buyer', quote: 'Great value for money. Highly recommended.', rating: 4, avatar: '' },
      ],
    }),

  spacer: () => section('spacer', { height: 40, line: false }),
};

export const createSection = (type) => (SECTION_FACTORIES[type] ? SECTION_FACTORIES[type]() : null);

export function defaultConfig(brandSeed = {}) {
  return {
    version: SCHEMA_VERSION,
    theme: defaultTheme(),
    brand: { ...defaultBrand(), ...brandSeed },
    announcement: defaultAnnouncement(),
    header: defaultHeader(),
    sections: ['hero', 'features', 'categories', 'offers', 'products', 'banner', 'testimonials'].map(createSection),
    categories: [],
    footer: defaultFooter(),
    seo: defaultSeo(),
    catalog: {}, // id -> { title, image, price, discount } snapshots of manually-picked products
  };
}

/** Fill any missing keys of a (possibly older / partial) config with defaults. */
export function normalizeConfig(raw, brandSeed = {}) {
  const base = defaultConfig(brandSeed);
  if (!raw || typeof raw !== 'object') return base;
  const merged = mergeDefaults(base, raw);
  merged.sections = Array.isArray(raw.sections)
    ? raw.sections
        .filter((s) => s && SECTION_FACTORIES[s.type])
        .map((s) => ({
          id: s.id || uid('sec'),
          type: s.type,
          enabled: s.enabled !== false,
          settings: mergeDefaults(SECTION_FACTORIES[s.type]().settings, s.settings || {}),
        }))
    : base.sections;
  merged.categories = Array.isArray(raw.categories) ? raw.categories : [];
  merged.version = SCHEMA_VERSION;
  return merged;
}

export const cloneConfig = clone;

export const LINK_KINDS = [
  { id: 'none', label: 'No link' },
  { id: 'home', label: 'Home page' },
  { id: 'all', label: 'All products' },
  { id: 'category', label: 'A category' },
  { id: 'product', label: 'A product' },
  { id: 'url', label: 'Custom URL' },
  { id: 'whatsapp', label: 'WhatsApp chat' },
  { id: 'tel', label: 'Phone call' },
  { id: 'email', label: 'Email' },
];

export const SOCIAL_TYPES = [
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourstore' },
  { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourstore' },
  { id: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/yourstore' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourstore' },
  { id: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/91XXXXXXXXXX' },
  { id: 'telegram', label: 'Telegram', placeholder: 'https://t.me/yourstore' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourstore' },
  { id: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/yourstore' },
  { id: 'website', label: 'Website', placeholder: 'https://yourwebsite.com' },
];

export const PAYMENT_BADGES = ['UPI', 'Visa', 'Mastercard', 'RuPay', 'Amex', 'NetBanking', 'Wallets', 'EMI', 'COD'];
export const FEATURE_ICONS = ['truck', 'shield', 'refresh', 'headset', 'gift', 'heart', 'star', 'tag', 'clock', 'leaf', 'award', 'zap'];
