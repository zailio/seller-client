'use client';
import { FiType, FiLayout, FiGrid, FiSettings, FiImage, FiTag, FiPackage } from 'react-icons/fi';
import { uid } from '../lib/utils';
import { link, FEATURE_ICONS } from '../lib/schema';
import { FEATURE_ICON_MAP } from '../renderer/icons';
import { SECTION_LABELS } from '../renderer/Storefront';
import { Text, Area, Select, Toggle, Segmented, OptionCards, Slider, ColorField, LinkField, ImageField, IconPicker, Group, SortableList, AddButton, PanelHeader, Notice, Btn, Field, st, cx } from '../ui/controls';
import DateTime from '../ui/DateTime';
import { useStudio } from '../ui/context';
import pal from './panels.module.css';

const Thumb = ({ children }) => <svg viewBox="0 0 60 30" width="100%" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{children}</svg>;
const TONES = [{ id: 'primary', label: 'Primary' }, { id: 'accent', label: 'Accent' }, { id: 'dark', label: 'Dark' }, { id: 'surface', label: 'Light' }];

/* ------------------------------------------------------------------ hero */
function Hero({ d, set, upd, setFocus, sectionId }) {
  const slides = d.slides;
  const setSlides = (v) => set('slides', v);
  const edit = (id, patch, key) => upd((s) => { const x = s.slides.find((y) => y.id === id); if (x) Object.assign(x, patch); }, key);
  return (
    <>
      <Group title="Layout" icon={<FiLayout />} defaultOpen>
        <OptionCards label="Style" cols={2} value={d.layout} onChange={(v) => set('layout', v)} options={[
          { id: 'slider', label: 'Full-width slider', thumb: <Thumb><rect x="2" y="3" width="56" height="24" rx="3" /><path d="M12 15h18M12 20h10" /></Thumb> },
          { id: 'split', label: 'Text + image', thumb: <Thumb><rect x="2" y="3" width="56" height="24" rx="3" /><path d="M30 3v24M8 13h14M8 18h8" /></Thumb> },
        ]} />
        <Segmented label="Height" value={d.height} onChange={(v) => set('height', v)} options={[{ id: 'sm', label: 'Short' }, { id: 'md', label: 'Medium' }, { id: 'lg', label: 'Tall' }]} />
        <Toggle label="Auto-play slides" checked={d.autoplay} onChange={(v) => set('autoplay', v)} />
        {d.autoplay && <Slider label="Seconds per slide" min={2} max={12} unit="s" value={d.interval} onChange={(v) => set('interval', v)} />}
        <Toggle label="Arrows" checked={d.arrows} onChange={(v) => set('arrows', v)} />
        <Toggle label="Dots" checked={d.dots} onChange={(v) => set('dots', v)} />
      </Group>
      <Field label="Slides" hint="Tip: wide images (1600×600) look best. Text stays readable with the overlay.">
        <SortableList items={slides} onReorder={setSlides} minItems={1}
          onOpen={(id) => setFocus(id ? { sectionId, slideId: id } : null)}
          onRemove={(sl) => setSlides(slides.filter((x) => x.id !== sl.id))}
          onDuplicate={(sl) => setSlides([...slides, { ...sl, id: uid('sl') }])}
          thumb={(sl) => (sl.image ? <img src={sl.image} alt="" /> : <FiImage />)}
          renderTitle={(sl, i) => sl.title || `Slide ${i + 1}`}
          renderBody={(sl) => (
            <>
              <ImageField label="Background image" shape="wide" recommended="1600×600 or larger" value={sl.image} onChange={(v) => edit(sl.id, { image: v })} />
              <Text label="Small label" maxLength={32} value={sl.eyebrow} onChange={(v) => edit(sl.id, { eyebrow: v }, `${sl.id}.e`)} />
              <Text label="Headline" maxLength={80} value={sl.title} onChange={(v) => edit(sl.id, { title: v }, `${sl.id}.t`)} />
              <Area label="Sub-text" rows={2} maxLength={160} value={sl.subtitle} onChange={(v) => edit(sl.id, { subtitle: v }, `${sl.id}.s`)} />
              <Text label="Button text" maxLength={24} value={sl.cta} onChange={(v) => edit(sl.id, { cta: v }, `${sl.id}.c`)} />
              <LinkField label="Button opens" value={sl.ctaLink} onChange={(v) => edit(sl.id, { ctaLink: v })} />
              {d.layout !== 'split' && (
                <>
                  <Segmented label="Text position" value={sl.align} onChange={(v) => edit(sl.id, { align: v })} options={[{ id: 'left', label: 'Left' }, { id: 'center', label: 'Centre' }, { id: 'right', label: 'Right' }]} />
                  <Segmented label="Text colour" value={sl.tone} onChange={(v) => edit(sl.id, { tone: v })} options={[{ id: 'auto', label: 'Auto' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]} />
                  {sl.image ? <Slider label="Image darkening" unit="%" value={sl.overlay} onChange={(v) => edit(sl.id, { overlay: v }, `${sl.id}.o`)} /> : null}
                </>
              )}
              {d.layout === 'split' && <Segmented label="Text colour" value={sl.tone} onChange={(v) => edit(sl.id, { tone: v })} options={[{ id: 'auto', label: 'Auto' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]} />}
            </>
          )} />
        <AddButton onClick={() => setSlides([...slides, { id: uid('sl'), image: '', eyebrow: '', title: 'New slide', subtitle: '', cta: 'Shop now', ctaLink: link('all'), align: 'left', overlay: 35, tone: 'auto' }])}>Add slide</AddButton>
      </Field>
    </>
  );
}

/* ---------------------------------------------------------------- offers */
function Offers({ d, set, upd }) {
  const items = d.items;
  const edit = (id, patch, key) => upd((s) => { const x = s.items.find((y) => y.id === id); if (x) Object.assign(x, patch); }, key);
  return (
    <>
      <Text label="Section title" maxLength={60} value={d.title} onChange={(v) => set('title', v)} />
      <Text label="Sub-title" maxLength={100} value={d.subtitle} onChange={(v) => set('subtitle', v)} />
      <OptionCards label="Display style" cols={3} value={d.style} onChange={(v) => set('style', v)} options={[
        { id: 'cards', label: 'Cards', thumb: <Thumb><rect x="2" y="6" width="16" height="18" rx="3" /><rect x="22" y="6" width="16" height="18" rx="3" /><rect x="42" y="6" width="16" height="18" rx="3" /></Thumb> },
        { id: 'coupons', label: 'Coupons', thumb: <Thumb><rect x="2" y="7" width="26" height="16" rx="3" /><rect x="32" y="7" width="26" height="16" rx="3" /><path d="M20 9v12M50 9v12" strokeDasharray="2 3" /></Thumb> },
        { id: 'ticker', label: 'Ticker', thumb: <Thumb><rect x="2" y="10" width="20" height="10" rx="5" /><rect x="26" y="10" width="20" height="10" rx="5" /><path d="M50 15h8" /></Thumb> },
      ]} />
      <Field label="Offers">
        <SortableList items={items} onReorder={(v) => set('items', v)} onRemove={(it) => set('items', items.filter((x) => x.id !== it.id))}
          onDuplicate={(it) => set('items', [...items, { ...it, id: uid('of') }])}
          renderTitle={(it) => it.title || 'Untitled offer'}
          renderBody={(it) => (
            <>
              <Text label="Badge" placeholder="Flat 20% OFF" maxLength={24} value={it.badge} onChange={(v) => edit(it.id, { badge: v }, `${it.id}.b`)} />
              <Text label="Title" maxLength={50} value={it.title} onChange={(v) => edit(it.id, { title: v }, `${it.id}.t`)} />
              <Text label="Details" maxLength={80} value={it.subtitle} onChange={(v) => edit(it.id, { subtitle: v }, `${it.id}.s`)} />
              <Text label="Coupon code" hint="Optional — shown as a copyable code." maxLength={20} value={it.code} onChange={(v) => edit(it.id, { code: v.toUpperCase() }, `${it.id}.c`)} />
              {d.style === 'cards' && (
                <>
                  <Segmented label="Colour" value={it.tone} onChange={(v) => edit(it.id, { tone: v })} options={TONES} />
                  <ImageField label="Picture (optional)" shape="wide" value={it.image} onChange={(v) => edit(it.id, { image: v })} />
                </>
              )}
              <LinkField label="Clicking opens" value={it.link} onChange={(v) => edit(it.id, { link: v })} />
            </>
          )} />
        <AddButton onClick={() => set('items', [...items, { id: uid('of'), badge: 'New offer', title: 'Offer title', subtitle: 'Describe the deal', code: '', tone: 'primary', image: '', link: link('all') }])}>Add offer</AddButton>
      </Field>
    </>
  );
}

/* ------------------------------------------------------------ categories */
function CategoriesSec({ d, set, categories, goto }) {
  const toggle = (id) => set('categoryIds', d.categoryIds.includes(id) ? d.categoryIds.filter((x) => x !== id) : [...d.categoryIds, id]);
  return (
    <>
      <Text label="Section title" maxLength={60} value={d.title} onChange={(v) => set('title', v)} />
      <Text label="Sub-title" maxLength={100} value={d.subtitle} onChange={(v) => set('subtitle', v)} />
      <OptionCards label="Display style" cols={4} value={d.style} onChange={(v) => set('style', v)} options={[
        { id: 'circles', label: 'Circles', thumb: <Thumb><circle cx="9" cy="15" r="6" /><circle cx="30" cy="15" r="6" /><circle cx="51" cy="15" r="6" /></Thumb> },
        { id: 'cards', label: 'Cards', thumb: <Thumb><rect x="2" y="4" width="16" height="22" rx="3" /><rect x="22" y="4" width="16" height="22" rx="3" /><rect x="42" y="4" width="16" height="22" rx="3" /></Thumb> },
        { id: 'tiles', label: 'Tiles', thumb: <Thumb><rect x="3" y="5" width="25" height="9" rx="2" /><rect x="32" y="5" width="25" height="9" rx="2" /><rect x="3" y="18" width="25" height="9" rx="2" /><rect x="32" y="18" width="25" height="9" rx="2" /></Thumb> },
        { id: 'chips', label: 'Chips', thumb: <Thumb><rect x="2" y="11" width="16" height="8" rx="4" /><rect x="21" y="11" width="18" height="8" rx="4" /><rect x="42" y="11" width="16" height="8" rx="4" /></Thumb> },
      ]} />
      <Toggle label="Show product counts" checked={d.showCount} onChange={(v) => set('showCount', v)} />
      <Segmented label="Which categories" value={d.source} onChange={(v) => set('source', v)} options={[{ id: 'all', label: 'All visible' }, { id: 'selected', label: 'Choose' }]} />
      {d.source === 'selected' && (
        categories.length ? (
          <div className={st.stackTight}>
            {categories.map((c) => (
              <button key={c.id} type="button" className={cx(pal.pick, d.categoryIds.includes(c.id) && pal.pickOn)} onClick={() => toggle(c.id)}>
                <span className={pal.pickImg}>{c.image ? <img src={c.image} alt="" /> : c.emoji || c.name.charAt(0)}</span>
                <span className={pal.pickMeta}><span className={pal.pickTitle}>{c.name}</span></span>
                <span className={cx(pal.check, d.categoryIds.includes(c.id) && pal.checkOn)}>{d.categoryIds.includes(c.id) ? '✓' : ''}</span>
              </button>
            ))}
          </div>
        ) : null
      )}
      {!categories.length && <Notice tone="warn">You have no categories yet, so sample ones are shown. <button type="button" className={st.urlLink} onClick={() => goto('categories')}>Create categories →</button></Notice>}
      {categories.length > 0 && <Btn size="sm" onClick={() => goto('categories')}>Manage categories</Btn>}
    </>
  );
}

/* -------------------------------------------------------------- products */
function Products({ d, set, upd, categories, goto, cfg, edit }) {
  const studio = useStudio();
  const chosen = d.productIds.map((id) => cfg.catalog?.[id] && { id, ...cfg.catalog[id] }).filter(Boolean);
  const pick = () => studio.pickProducts({
    title: 'Choose products to feature', multiple: true, selected: d.productIds,
    onConfirm: (list) => upd((s, c) => {
      s.productIds = list.map((p) => p.id);
      c.catalog = c.catalog || {};
      list.forEach((p) => { c.catalog[p.id] = { title: p.title, image: p.image, price: p.price, discount: p.discount, isAvailable: p.isAvailable }; });
    }),
  });
  return (
    <>
      <Text label="Section title" maxLength={60} value={d.title} onChange={(v) => set('title', v)} />
      <Text label="Sub-title" maxLength={100} value={d.subtitle} onChange={(v) => set('subtitle', v)} />

      <Group title="What to show" icon={<FiPackage />} defaultOpen>
        <Select label="Products" value={d.source} onChange={(v) => set('source', v)} options={[
          { id: 'latest', label: 'Latest products (automatic)' }, { id: 'discounted', label: 'Biggest discounts (automatic)' },
          { id: 'manual', label: 'Hand-picked products' }, { id: 'category', label: 'From one category' },
        ]} />
        {d.source === 'manual' && (
          <>
            <Btn variant="primary" block onClick={pick}><FiPackage /> {d.productIds.length ? 'Change selection' : 'Choose products'}</Btn>
            {chosen.length > 0 && (
              <div className={pal.chipsRow}>
                {chosen.map((p) => (
                  <span key={p.id} className={pal.miniChip}>
                    {p.image ? <img src={p.image} alt="" /> : <em>{p.title.charAt(0)}</em>}
                    <span>{p.title}</span>
                    <button type="button" aria-label={`Remove ${p.title}`} onClick={() => set('productIds', d.productIds.filter((x) => x !== p.id))}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </>
        )}
        {d.source === 'category' && (
          categories.length ? (
            <Select label="Category" value={d.categoryId} onChange={(v) => set('categoryId', v)} options={[{ id: '', label: 'Choose a category…' }, ...categories.map((c) => ({ id: c.id, label: `${c.name} (${c.productIds.length})` }))]} />
          ) : <Notice tone="warn">No categories yet. <button type="button" className={st.urlLink} onClick={() => goto('categories')}>Create one →</button></Notice>
        )}
        <Slider label="How many" min={2} max={24} value={d.limit} onChange={(v) => set('limit', v)} />
      </Group>

      <Group title="Layout" icon={<FiGrid />}>
        <Segmented label="Arrangement" value={d.layout} onChange={(v) => set('layout', v)} options={[{ id: 'grid', label: 'Grid' }, { id: 'carousel', label: 'Scrolling row' }]} />
        <Slider label="Columns (desktop)" min={2} max={6} value={d.columns} onChange={(v) => set('columns', v)} />
        <OptionCards label="Card style" cols={3} value={d.cardStyle} onChange={(v) => set('cardStyle', v)} options={[
          { id: 'card', label: 'Card', thumb: <Thumb><rect x="14" y="2" width="32" height="26" rx="4" /><path d="M14 20h32" /></Thumb> },
          { id: 'minimal', label: 'Minimal', thumb: <Thumb><rect x="16" y="2" width="28" height="18" rx="3" /><path d="M16 25h20" /></Thumb> },
          { id: 'overlay', label: 'Overlay', thumb: <Thumb><rect x="14" y="2" width="32" height="26" rx="4" /><path d="M20 22h14" /></Thumb> },
        ]} />
        <Toggle label="Show discount badge" checked={d.showDiscount} onChange={(v) => set('showDiscount', v)} />
        <Toggle label="Show “Add to cart”" checked={d.showAddToCart} onChange={(v) => set('showAddToCart', v)} />
      </Group>

      <Group title="“View all” link" icon={<FiSettings />}>
        <Toggle label="Show link" checked={d.viewAll.enabled} onChange={(v) => set('viewAll.enabled', v)} />
        {d.viewAll.enabled && (
          <>
            <Text label="Label" maxLength={20} value={d.viewAll.label} onChange={(v) => set('viewAll.label', v)} />
            <LinkField value={d.viewAll.link} onChange={(v) => set('viewAll.link', v)} />
          </>
        )}
      </Group>
    </>
  );
}

/* ---------------------------------------------------------------- others */
function Banner({ d, set }) {
  return (
    <>
      <OptionCards label="Style" cols={3} value={d.style} onChange={(v) => set('style', v)} options={[
        { id: 'contained', label: 'Boxed', thumb: <Thumb><rect x="8" y="5" width="44" height="20" rx="4" /></Thumb> },
        { id: 'full', label: 'Full width', thumb: <Thumb><rect x="0" y="6" width="60" height="18" /></Thumb> },
        { id: 'split', label: 'Split', thumb: <Thumb><rect x="4" y="5" width="52" height="20" rx="3" /><path d="M30 5v20" /></Thumb> },
      ]} />
      <Segmented label="Height" value={d.height} onChange={(v) => set('height', v)} options={[{ id: 'sm', label: 'Short' }, { id: 'md', label: 'Medium' }, { id: 'lg', label: 'Tall' }]} />
      {d.style !== 'split' && <Segmented label="Colour" value={d.tone} onChange={(v) => set('tone', v)} options={TONES} />}
      <ImageField label={d.style === 'split' ? 'Picture' : 'Background image (optional)'} shape="wide" value={d.image} onChange={(v) => set('image', v)} />
      <Text label="Small label" maxLength={32} value={d.eyebrow} onChange={(v) => set('eyebrow', v)} />
      <Text label="Headline" maxLength={80} value={d.title} onChange={(v) => set('title', v)} />
      <Text label="Sub-text" maxLength={120} value={d.subtitle} onChange={(v) => set('subtitle', v)} />
      <Text label="Button text" maxLength={24} value={d.cta} onChange={(v) => set('cta', v)} />
      <LinkField label="Button opens" value={d.link} onChange={(v) => set('link', v)} />
    </>
  );
}

function Countdown({ d, set }) {
  return (
    <>
      <Text label="Title" maxLength={60} value={d.title} onChange={(v) => set('title', v)} />
      <Text label="Sub-text" maxLength={100} value={d.subtitle} onChange={(v) => set('subtitle', v)} />
      <DateTime label="Sale ends at" hint="The timer counts down to this date and time." value={d.endsAt} onChange={(v) => set('endsAt', v)} />
      <Segmented label="Colour" value={d.tone} onChange={(v) => set('tone', v)} options={TONES} />
      <Text label="Button text" maxLength={24} value={d.cta} onChange={(v) => set('cta', v)} />
      <LinkField label="Button opens" value={d.link} onChange={(v) => set('link', v)} />
    </>
  );
}

function Features({ d, set, upd }) {
  const items = d.items;
  const edit = (id, patch, key) => upd((s) => { const x = s.items.find((y) => y.id === id); if (x) Object.assign(x, patch); }, key);
  const iconOptions = FEATURE_ICONS.map((id) => ({ id, icon: FEATURE_ICON_MAP[id] }));
  return (
    <>
      <Segmented label="Style" value={d.style} onChange={(v) => set('style', v)} options={[{ id: 'row', label: 'Slim band' }, { id: 'cards', label: 'Cards' }]} />
      <Field label="Badges">
        <SortableList items={items} onReorder={(v) => set('items', v)} onRemove={(it) => set('items', items.filter((x) => x.id !== it.id))}
          thumb={(it) => { const I = FEATURE_ICON_MAP[it.icon]; return I ? <I /> : null; }}
          renderTitle={(it) => it.title || 'Untitled'}
          renderBody={(it) => (
            <>
              <IconPicker label="Icon" value={it.icon} onChange={(v) => edit(it.id, { icon: v })} options={iconOptions} />
              <Text label="Title" maxLength={28} value={it.title} onChange={(v) => edit(it.id, { title: v }, `${it.id}.t`)} />
              <Text label="Text" maxLength={50} value={it.text} onChange={(v) => edit(it.id, { text: v }, `${it.id}.x`)} />
            </>
          )} />
        <AddButton onClick={() => set('items', [...items, { id: uid('ft'), icon: 'star', title: 'New badge', text: '' }])}>Add badge</AddButton>
      </Field>
    </>
  );
}

function TextSec({ d, set }) {
  return (
    <>
      <OptionCards label="Layout" cols={3} value={d.layout} onChange={(v) => set('layout', v)} options={[
        { id: 'text', label: 'Text only', thumb: <Thumb><path d="M14 8h32M10 15h40M14 22h32" /></Thumb> },
        { id: 'image-left', label: 'Image left', thumb: <Thumb><rect x="3" y="5" width="22" height="20" rx="3" /><path d="M32 9h24M32 15h24M32 21h16" /></Thumb> },
        { id: 'image-right', label: 'Image right', thumb: <Thumb><rect x="35" y="5" width="22" height="20" rx="3" /><path d="M4 9h24M4 15h24M4 21h16" /></Thumb> },
      ]} />
      {d.layout === 'text' && <Segmented label="Alignment" value={d.align} onChange={(v) => set('align', v)} options={[{ id: 'left', label: 'Left' }, { id: 'center', label: 'Centre' }]} />}
      {d.layout !== 'text' && <ImageField label="Picture" shape="wide" value={d.image} onChange={(v) => set('image', v)} />}
      <Text label="Small label" maxLength={32} value={d.eyebrow} onChange={(v) => set('eyebrow', v)} />
      <Text label="Heading" maxLength={80} value={d.heading} onChange={(v) => set('heading', v)} />
      <Area label="Body" hint="Leave a blank line to start a new paragraph." rows={6} maxLength={900} value={d.body} onChange={(v) => set('body', v)} />
      <Text label="Button text (optional)" maxLength={24} value={d.cta} onChange={(v) => set('cta', v)} />
      {d.cta ? <LinkField label="Button opens" value={d.link} onChange={(v) => set('link', v)} /> : null}
    </>
  );
}

function Testimonials({ d, set, upd }) {
  const items = d.items;
  const edit = (id, patch, key) => upd((s) => { const x = s.items.find((y) => y.id === id); if (x) Object.assign(x, patch); }, key);
  return (
    <>
      <Text label="Title" maxLength={60} value={d.title} onChange={(v) => set('title', v)} />
      <Segmented label="Style" value={d.style} onChange={(v) => set('style', v)} options={[{ id: 'cards', label: 'Cards' }, { id: 'quote', label: 'Big quote' }]} />
      <Notice tone="warn">Only add reviews from real customers. Made-up testimonials mislead shoppers and can break marketplace rules.</Notice>
      <Field label="Reviews">
        <SortableList items={items} onReorder={(v) => set('items', v)} onRemove={(it) => set('items', items.filter((x) => x.id !== it.id))}
          renderTitle={(it) => it.name || 'Customer'}
          renderBody={(it) => (
            <>
              <Text label="Name" maxLength={30} value={it.name} onChange={(v) => edit(it.id, { name: v }, `${it.id}.n`)} />
              <Text label="Label" placeholder="Verified buyer" maxLength={30} value={it.role} onChange={(v) => edit(it.id, { role: v }, `${it.id}.r`)} />
              <Area label="Review" rows={3} maxLength={240} value={it.quote} onChange={(v) => edit(it.id, { quote: v }, `${it.id}.q`)} />
              <Slider label="Rating" min={1} max={5} unit="★" value={it.rating} onChange={(v) => edit(it.id, { rating: v }, `${it.id}.s`)} />
              <ImageField label="Photo (optional)" shape="square" value={it.avatar} onChange={(v) => edit(it.id, { avatar: v })} />
            </>
          )} />
        <AddButton onClick={() => set('items', [...items, { id: uid('ts'), name: 'Customer name', role: 'Verified buyer', quote: '', rating: 5, avatar: '' }])}>Add review</AddButton>
      </Field>
    </>
  );
}

function Spacer({ d, set }) {
  return (
    <>
      <Slider label="Height" min={8} max={160} unit="px" value={d.height} onChange={(v) => set('height', v)} />
      <Toggle label="Show divider line" checked={d.line} onChange={(v) => set('line', v)} />
    </>
  );
}

/* ----------------------------------------------------------------- shell */
export default function SectionEditor({ cfg, edit, sectionId, onBack, setFocus, goto }) {
  const idx = cfg.sections.findIndex((s) => s.id === sectionId);
  const section = cfg.sections[idx];
  if (!section) return <><PanelHeader title="Section" onBack={onBack} /><div className={st.panelBody}><Notice tone="warn">This section no longer exists.</Notice></div></>;

  const d = section.settings;
  const base = `sections.${idx}.settings`;
  const set = (path, value) => edit((c) => {
    const keys = `${base}.${path}`.split('.');
    let cur = c;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
    cur[keys[keys.length - 1]] = value;
  }, `${section.id}.${path}`);
  const upd = (fn, key) => edit((c) => fn(c.sections[idx].settings, c), key ? `${section.id}.${key}` : undefined);
  const props = { d, set, upd, cfg, edit, categories: cfg.categories, goto, setFocus, sectionId };
  const body = {
    hero: <Hero {...props} />, offers: <Offers {...props} />, categories: <CategoriesSec {...props} />, products: <Products {...props} />,
    banner: <Banner {...props} />, countdown: <Countdown {...props} />, features: <Features {...props} />, text: <TextSec {...props} />,
    testimonials: <Testimonials {...props} />, spacer: <Spacer {...props} />,
  }[section.type];

  return (
    <>
      <PanelHeader title={SECTION_LABELS[section.type]} subtitle="Changes appear instantly in the preview" onBack={onBack} />
      <div className={st.panelBody}>{body}</div>
    </>
  );
}
