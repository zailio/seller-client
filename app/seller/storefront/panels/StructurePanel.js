'use client';
import { FiBell, FiNavigation, FiColumns, FiImage, FiTag, FiGrid, FiShoppingBag, FiSquare, FiClock, FiShield, FiAlignLeft, FiMessageSquare, FiMinus, FiChevronRight, FiPlus } from 'react-icons/fi';
import { createSection } from '../lib/schema';
import { SECTION_LABELS } from '../renderer/Storefront';
import { uid } from '../lib/utils';
import { SortableList, AddButton, PanelHeader, Notice, Btn, st, cx } from '../ui/controls';
import pal from './panels.module.css';

export const SECTION_META = {
  hero: { icon: FiImage, desc: 'Big banner slider with headline and button' },
  offers: { icon: FiTag, desc: 'Deals, coupon codes and promotions' },
  categories: { icon: FiGrid, desc: 'Let shoppers browse by category' },
  products: { icon: FiShoppingBag, desc: 'Latest, discounted or hand-picked products' },
  banner: { icon: FiSquare, desc: 'A single promotional banner' },
  countdown: { icon: FiClock, desc: 'Flash-sale timer to create urgency' },
  features: { icon: FiShield, desc: 'Delivery, returns and trust badges' },
  text: { icon: FiAlignLeft, desc: 'Tell your story with text and a picture' },
  testimonials: { icon: FiMessageSquare, desc: 'Real customer reviews' },
  spacer: { icon: FiMinus, desc: 'Extra space or a divider line' },
};

const summary = (s) => {
  const d = s.settings;
  switch (s.type) {
    case 'hero': return `${d.slides.length} slide${d.slides.length === 1 ? '' : 's'}`;
    case 'offers': return `${d.items.length} offers · ${d.style}`;
    case 'categories': return `${d.style} style`;
    case 'products': return d.title || 'Products';
    case 'banner': return d.title || 'Banner';
    case 'countdown': return d.title;
    case 'features': return `${d.items.length} badges`;
    case 'text': return d.heading;
    case 'testimonials': return `${d.items.length} reviews`;
    default: return `${d.height}px`;
  }
};

export function StructurePanel({ cfg, edit, select, openAdd }) {
  const setSections = (list) => edit((c) => { c.sections = list; });
  const dup = (s) => edit((c) => { const i = c.sections.findIndex((x) => x.id === s.id); const copy = JSON.parse(JSON.stringify(s)); copy.id = uid('sec'); c.sections.splice(i + 1, 0, copy); });
  return (
    <>
      <PanelHeader title="Your home page" subtitle="Click anything to edit it. Drag to reorder." />
      <div className={st.panelBody}>
        <div className={st.sectionLabel}>Top of page</div>
        <button type="button" className={pal.layer} onClick={() => select({ type: 'announcement' })}>
          <span className={pal.layerIcon}><FiBell /></span>
          <span className={pal.layerMeta}><span className={pal.layerName}>Announcement bar</span><span className={pal.layerSub}>{cfg.announcement.enabled ? `${cfg.announcement.items.length} message(s)` : 'Hidden'}</span></span>
          <FiChevronRight className={pal.layerChev} />
        </button>
        <button type="button" className={pal.layer} onClick={() => select({ type: 'header' })}>
          <span className={pal.layerIcon}><FiNavigation /></span>
          <span className={pal.layerMeta}><span className={pal.layerName}>Header & app bar</span><span className={pal.layerSub}>{cfg.header.layout} · {cfg.header.nav.length} links</span></span>
          <FiChevronRight className={pal.layerChev} />
        </button>

        <div className={st.sectionLabel}>Page sections</div>
        {cfg.sections.length === 0 && <Notice>Your page has no sections yet. Add one to get started.</Notice>}
        <SortableList items={cfg.sections} onReorder={setSections} openId={null} onOpen={(id) => id && select({ type: 'section', id })}
          onRemove={(s) => edit((c) => { c.sections = c.sections.filter((x) => x.id !== s.id); })}
          onDuplicate={dup} onToggle={(s) => edit((c) => { const x = c.sections.find((y) => y.id === s.id); if (x) x.enabled = !x.enabled; })}
          isOff={(s) => !s.enabled}
          thumb={(s) => { const I = SECTION_META[s.type]?.icon; return I ? <I /> : null; }}
          renderTitle={(s) => <>{SECTION_LABELS[s.type]} <span style={{ color: 'var(--st-faint)', fontWeight: 500 }}>· {summary(s)}</span></>} />
        <AddButton onClick={openAdd}>Add section</AddButton>

        <div className={st.sectionLabel}>Bottom of page</div>
        <button type="button" className={pal.layer} onClick={() => select({ type: 'footer' })}>
          <span className={pal.layerIcon}><FiColumns /></span>
          <span className={pal.layerMeta}><span className={pal.layerName}>Footer</span><span className={pal.layerSub}>{cfg.footer.enabled ? `${cfg.footer.layout} · ${cfg.footer.columns.length} columns` : 'Hidden'}</span></span>
          <FiChevronRight className={pal.layerChev} />
        </button>
      </div>
    </>
  );
}

export function AddSectionPanel({ onAdd, onBack }) {
  return (
    <>
      <PanelHeader title="Add a section" subtitle="Choose a building block" onBack={onBack} />
      <div className={st.panelBody}>
        <div className={pal.libGrid}>
          {Object.keys(SECTION_META).map((type) => {
            const I = SECTION_META[type].icon;
            return (
              <button key={type} type="button" className={pal.libItem} onClick={() => onAdd(type)}>
                <span className={pal.libIcon}><I /></span>
                <span className={pal.libName}>{SECTION_LABELS[type]}</span>
                <span className={pal.libDesc}>{SECTION_META[type].desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
