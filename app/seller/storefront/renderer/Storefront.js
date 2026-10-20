'use client';
import { useEffect, useMemo } from 'react';
import { SfContext } from './ctx';
import { themeToVars, fontHref } from '../lib/themes';
import { Block, cx } from './parts';
import Announcement from './Announcement';
import Header from './Header';
import Footer from './Footer';
import HeroSection from './HeroSection';
import OffersSection from './OffersSection';
import CategoriesSection from './CategoriesSection';
import ProductsSection from './ProductsSection';
import { BannerSection, CountdownSection, FeaturesSection, TextSection, TestimonialsSection, SpacerSection } from './ContentSections';
import base from './base.module.css';
import chrome from './chrome.module.css';

export const SECTION_COMPONENTS = {
  hero: HeroSection, offers: OffersSection, categories: CategoriesSection, products: ProductsSection,
  banner: BannerSection, countdown: CountdownSection, features: FeaturesSection, text: TextSection,
  testimonials: TestimonialsSection, spacer: SpacerSection,
};

export const SECTION_LABELS = {
  hero: 'Hero banner', offers: 'Offers & deals', categories: 'Categories', products: 'Product collection',
  banner: 'Promo banner', countdown: 'Flash-sale countdown', features: 'Trust badges', text: 'Story / text',
  testimonials: 'Testimonials', spacer: 'Spacer',
};

function useThemeFonts(theme) {
  const href = fontHref(theme);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = `sf-font-${href}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, [href]);
}

/**
 * <Storefront config products editor? shopUrl? />
 *  config   : storefront configuration (lib/schema.js)
 *  products : normalised seller products for auto collections
 *  editor   : { selected, focus, onSelect, actions } – click-to-edit overlays (Studio only)
 *  shopUrl  : base url used to resolve links on the public shop
 */
export default function Storefront({ config, products = [], editor = null, shopUrl = '', productBase = '/product' }) {
  useThemeFonts(config.theme);
  const vars = useMemo(() => themeToVars(config.theme), [config.theme]);
  const ctx = useMemo(
    () => ({ config, products, editor, linkCtx: { base: shopUrl, productBase, categories: config.categories, editor: !!editor } }),
    [config, products, editor, shopUrl, productBase]
  );
  const btn = config.theme.buttonStyle === 'outline' ? base.btnOutline : config.theme.buttonStyle === 'soft' ? base.btnSoft : '';

  return (
    <SfContext.Provider value={ctx}>
      <div className={cx(base.root, btn)} style={vars} onClickCapture={(e) => { if (editor && e.target.closest('a')) e.preventDefault(); }}>
        <Announcement data={config.announcement} />
        <Header data={config.header} brand={config.brand} categories={config.categories || []} />
        {config.brand.vacation?.enabled ? <div className={chrome.vacation}>🏖️ {config.brand.vacation.message}</div> : null}
        <main>
          {config.sections.map((sec) => {
            const Cmp = SECTION_COMPONENTS[sec.type];
            if (!Cmp) return null;
            if (!sec.enabled && !editor) return null;
            return (
              <Block key={sec.id} target={{ type: 'section', id: sec.id }} label={SECTION_LABELS[sec.type]} hidden={!sec.enabled}>
                <Cmp section={sec} />
              </Block>
            );
          })}
          {editor && config.sections.length === 0 ? (
            <div style={{ padding: '120px 24px', textAlign: 'center', color: 'var(--sf-muted)' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--sf-text)' }}>Your page is empty</p>
              <p style={{ marginTop: 6 }}>Add your first section from the left panel.</p>
            </div>
          ) : null}
        </main>
        <Footer data={config.footer} brand={config.brand} />
      </div>
    </SfContext.Provider>
  );
}
