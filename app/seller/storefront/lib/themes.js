// Theme tokens: palettes, font pairs, radius, density -> CSS variables.
import { normalizeHex, readableOn, isHex } from './utils';

export const PALETTES = [
  { id: 'indigo', name: 'Indigo', primary: '#4f46e5', accent: '#f59e0b', background: '#ffffff', surface: '#f5f6fb', text: '#0f172a', muted: '#64748b' },
  { id: 'emerald', name: 'Emerald', primary: '#059669', accent: '#f59e0b', background: '#ffffff', surface: '#f1f8f5', text: '#0b1f1a', muted: '#5b7a70' },
  { id: 'rose', name: 'Rose', primary: '#e11d48', accent: '#fb923c', background: '#fffafa', surface: '#fff1f3', text: '#2a0f16', muted: '#85616a' },
  { id: 'ocean', name: 'Ocean', primary: '#0284c7', accent: '#22d3ee', background: '#ffffff', surface: '#f0f8fd', text: '#0b2233', muted: '#5a7587' },
  { id: 'sunset', name: 'Sunset', primary: '#ea580c', accent: '#db2777', background: '#fffaf5', surface: '#fff1e6', text: '#2b1405', muted: '#8a6a55' },
  { id: 'violet', name: 'Violet', primary: '#7c3aed', accent: '#ec4899', background: '#ffffff', surface: '#f6f2ff', text: '#1a0f33', muted: '#6f6490' },
  { id: 'forest', name: 'Forest', primary: '#166534', accent: '#ca8a04', background: '#fbfbf7', surface: '#f1f3e8', text: '#14231a', muted: '#66705f' },
  { id: 'gold', name: 'Gold luxe', primary: '#a16207', accent: '#1c1917', background: '#fffdf7', surface: '#faf4e4', text: '#1c1917', muted: '#7a7066' },
  { id: 'blush', name: 'Blush', primary: '#be185d', accent: '#f9a8d4', background: '#fff8fb', surface: '#ffeaf3', text: '#2d0f1e', muted: '#8d6478' },
  { id: 'mono', name: 'Monochrome', primary: '#111827', accent: '#6b7280', background: '#ffffff', surface: '#f4f4f5', text: '#09090b', muted: '#71717a' },
  { id: 'midnight', name: 'Midnight', primary: '#818cf8', accent: '#f472b6', background: '#0b1020', surface: '#131a2e', text: '#e8ecf8', muted: '#8b94b2' },
  { id: 'carbon', name: 'Carbon', primary: '#22d3ee', accent: '#a3e635', background: '#0a0a0a', surface: '#151515', text: '#f5f5f5', muted: '#8a8a8a' },
];

export const FONT_PAIRS = [
  { id: 'modern', name: 'Modern', heading: 'Inter', body: 'Inter', gf: ['Inter:wght@400;500;600;700;800'] },
  { id: 'elegant', name: 'Elegant', heading: 'Playfair Display', body: 'Inter', gf: ['Playfair+Display:wght@500;600;700', 'Inter:wght@400;500;600'] },
  { id: 'friendly', name: 'Friendly', heading: 'Poppins', body: 'Poppins', gf: ['Poppins:wght@400;500;600;700'] },
  { id: 'editorial', name: 'Editorial', heading: 'DM Serif Display', body: 'DM Sans', gf: ['DM+Serif+Display', 'DM+Sans:wght@400;500;700'] },
  { id: 'tech', name: 'Tech', heading: 'Space Grotesk', body: 'Inter', gf: ['Space+Grotesk:wght@500;600;700', 'Inter:wght@400;500;600'] },
  { id: 'boutique', name: 'Boutique', heading: 'Cormorant Garamond', body: 'Jost', gf: ['Cormorant+Garamond:wght@500;600;700', 'Jost:wght@400;500;600'] },
  { id: 'bold', name: 'Bold', heading: 'Sora', body: 'Manrope', gf: ['Sora:wght@600;700;800', 'Manrope:wght@400;500;600;700'] },
  { id: 'classic', name: 'Classic', heading: 'Merriweather', body: 'Source Sans 3', gf: ['Merriweather:wght@400;700', 'Source+Sans+3:wght@400;600;700'] },
];

export const RADII = {
  sharp: { label: 'Sharp', sm: '2px', md: '3px', lg: '4px', btn: '2px' },
  soft: { label: 'Soft', sm: '8px', md: '12px', lg: '18px', btn: '10px' },
  round: { label: 'Round', sm: '12px', md: '18px', lg: '26px', btn: '14px' },
  pill: { label: 'Pill', sm: '12px', md: '18px', lg: '26px', btn: '999px' },
};

export const DENSITY = {
  compact: { label: 'Compact', y: '36px', gap: '12px' },
  comfortable: { label: 'Comfortable', y: '56px', gap: '18px' },
  spacious: { label: 'Spacious', y: '84px', gap: '26px' },
};

const SYSTEM = `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
const SERIF = `Georgia, 'Times New Roman', serif`;
const SERIF_FONTS = ['Playfair Display', 'DM Serif Display', 'Cormorant Garamond', 'Merriweather'];

export const fontStack = (name) => `'${name}', ${SERIF_FONTS.includes(name) ? SERIF : SYSTEM}`;
export const getFontPair = (id) => FONT_PAIRS.find((f) => f.id === id) || FONT_PAIRS[0];

export function fontHref(theme) {
  const pair = getFontPair(theme?.fonts);
  return `https://fonts.googleapis.com/css2?${pair.gf.map((f) => `family=${f}`).join('&')}&display=swap`;
}

/** Convert a theme config into CSS custom properties for the storefront root. */
export function themeToVars(theme = {}) {
  const pair = getFontPair(theme.fonts);
  const r = RADII[theme.radius] || RADII.soft;
  const d = DENSITY[theme.density] || DENSITY.comfortable;
  const primary = normalizeHex(theme.primary, '#4f46e5');
  const accent = normalizeHex(theme.accent, '#f59e0b');
  const bg = normalizeHex(theme.background, '#ffffff');
  const surface = normalizeHex(theme.surface, '#f8fafc');
  const text = normalizeHex(theme.text, '#0f172a');
  const muted = normalizeHex(theme.muted, '#64748b');
  return {
    '--sf-primary': primary,
    '--sf-on-primary': readableOn(primary),
    '--sf-accent': accent,
    '--sf-on-accent': readableOn(accent),
    '--sf-bg': bg,
    '--sf-surface': surface,
    '--sf-text': text,
    '--sf-muted': muted,
    '--sf-border': `color-mix(in srgb, ${text} 12%, ${bg})`,
    '--sf-border-strong': `color-mix(in srgb, ${text} 22%, ${bg})`,
    '--sf-primary-soft': `color-mix(in srgb, ${primary} 12%, ${bg})`,
    '--sf-font-heading': fontStack(pair.heading),
    '--sf-font-body': fontStack(pair.body),
    '--sf-r-sm': r.sm,
    '--sf-r-md': r.md,
    '--sf-r-lg': r.lg,
    '--sf-r-btn': r.btn,
    '--sf-section-y': d.y,
    '--sf-gap': d.gap,
  };
}

export const isDarkTheme = (theme) => readableOn(normalizeHex(theme?.background, '#ffffff')) === '#ffffff';

export { isHex };
