'use client';
import { FiLayout, FiSearch, FiShoppingBag, FiMenu, FiNavigation, FiType, FiBell, FiGrid, FiShare2, FiMail, FiCreditCard, FiLink, FiImage } from 'react-icons/fi';
import { headerIcons } from '../renderer/icons';
import { SOCIAL_TYPES, PAYMENT_BADGES, link } from '../lib/schema';
import { uid } from '../lib/utils';
import { Text, Area, Select, Toggle, Segmented, OptionCards, Slider, ColorField, IconPicker, LinkField, ImageField, Group, SortableList, AddButton, PanelHeader, Notice, Btn, Field, st, cx } from '../ui/controls';
import { makeBind } from './bind';
import pal from './panels.module.css';

/* tiny layout thumbnails */
const Thumb = ({ children }) => <svg viewBox="0 0 60 30" width="100%" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{children}</svg>;

/* ------------------------------ announcement ------------------------------ */
export function AnnouncementEditor({ cfg, edit, onBack }) {
  const b = makeBind(cfg, edit);
  const a = cfg.announcement;
  const setItems = (items) => edit((c) => { c.announcement.items = items; });
  const upd = (id, patch, key) => edit((c) => { const it = c.announcement.items.find((x) => x.id === id); if (it) Object.assign(it, patch); }, key);
  return (
    <>
      <PanelHeader title="Announcement bar" subtitle="The thin strip above your header" onBack={onBack} />
      <div className={st.panelBody}>
        <Toggle label="Show announcement bar" checked={a.enabled} onChange={(v) => edit((c) => { c.announcement.enabled = v; })} />
        {a.enabled && (
          <>
            <Segmented label="Animation" value={a.style} onChange={(v) => edit((c) => { c.announcement.style = v; })}
              options={[{ id: 'static', label: 'Static' }, { id: 'rotate', label: 'Rotate' }, { id: 'marquee', label: 'Scroll' }]} />
            <div className={st.grid2}>
              <ColorField label="Background" value={a.bg} onChange={b('announcement.bg').onChange} />
              <ColorField label="Text" value={a.color} onChange={b('announcement.color').onChange} />
            </div>
            <Toggle label="Allow visitors to dismiss" checked={a.dismissible} onChange={(v) => edit((c) => { c.announcement.dismissible = v; })} />
            <Field label="Messages" hint="Tip: emoji work great. Keep each message short.">
              <SortableList items={a.items} onReorder={setItems} minItems={1}
                onRemove={(it) => setItems(a.items.filter((x) => x.id !== it.id))}
                renderTitle={(it) => it.text || 'Empty message'}
                renderBody={(it) => (
                  <>
                    <Text label="Message" value={it.text} maxLength={110} onChange={(v) => upd(it.id, { text: v }, `an.${it.id}`)} />
                    <LinkField label="Clicking opens" value={it.link} onChange={(v) => upd(it.id, { link: v })} />
                  </>
                )} />
              <AddButton onClick={() => setItems([...a.items, { id: uid('an'), text: 'New announcement', link: link() }])}>Add message</AddButton>
            </Field>
          </>
        )}
      </div>
    </>
  );
}

/* --------------------------------- header --------------------------------- */
export function HeaderEditor({ cfg, edit, onBack }) {
  const b = makeBind(cfg, edit);
  const h = cfg.header;
  const setNav = (nav) => edit((c) => { c.header.nav = nav; });
  const updNav = (id, patch, key) => edit((c) => { const it = c.header.nav.find((x) => x.id === id); if (it) Object.assign(it, patch); }, key);
  const t = (k) => (v) => edit((c) => { c.header[k] = v; });

  return (
    <>
      <PanelHeader title="Header & app bar" subtitle="Logo, menu, search and cart" onBack={onBack} />
      <div className={st.panelBody}>
        <Toggle label="Show header" checked={h.enabled} onChange={t('enabled')} />
        {h.enabled && (
          <>
            <Group title="Layout" icon={<FiLayout />} defaultOpen>
              <OptionCards label="Header style" cols={3} value={h.layout} onChange={t('layout')} options={[
                { id: 'classic', label: 'Classic', thumb: <Thumb><rect x="2" y="9" width="10" height="12" rx="2" /><path d="M18 15h12M34 15h10" /><circle cx="52" cy="15" r="3" /></Thumb> },
                { id: 'centered', label: 'Centered', thumb: <Thumb><path d="M3 8h12" /><rect x="24" y="5" width="12" height="9" rx="2" /><circle cx="52" cy="9" r="3" /><path d="M18 24h24" /></Thumb> },
                { id: 'minimal', label: 'Minimal', thumb: <Thumb><rect x="2" y="9" width="10" height="12" rx="2" /><path d="M32 15h8" /><circle cx="52" cy="15" r="3" /></Thumb> },
              ]} />
              <Segmented label="Height" value={h.height} onChange={t('height')} options={[{ id: 'compact', label: 'Compact' }, { id: 'regular', label: 'Regular' }, { id: 'tall', label: 'Tall' }]} />
              <Toggle label="Stick to top while scrolling" checked={h.sticky} onChange={t('sticky')} />
              <Segmented label="Border" value={h.border} onChange={t('border')} options={[{ id: 'none', label: 'None' }, { id: 'line', label: 'Line' }, { id: 'shadow', label: 'Shadow' }]} />
              <Segmented label="Background" value={h.background} onChange={t('background')} options={[{ id: 'solid', label: 'Solid' }, { id: 'blur', label: 'Frosted' }, { id: 'transparent', label: 'Clear' }]} />
              <ColorField label="Custom background" allowClear fallback={cfg.theme.background} {...b('header.bg')} />
              <ColorField label="Custom text colour" allowClear fallback={cfg.theme.text} {...b('header.color')} />
            </Group>

            <Group title="Logo" icon={<FiImage />}>
              <Segmented label="Show" value={h.logoMode} onChange={t('logoMode')} options={[{ id: 'both', label: 'Logo + name' }, { id: 'image', label: 'Logo' }, { id: 'text', label: 'Name' }]} />
              <Slider label="Logo size" min={20} max={72} unit="px" value={h.logoHeight} onChange={(v) => edit((c) => { c.header.logoHeight = v; }, 'header.logoHeight')} />
              <ImageField label="Logo image" shape="square" contain {...b('brand.logo')} />
              <Text label="Shop name" maxLength={40} {...b('brand.name')} />
            </Group>

            <Group title="Menu links" icon={<FiNavigation />}>
              <Segmented label="Menu source" value={h.navSource} onChange={t('navSource')} options={[{ id: 'custom', label: 'My links' }, { id: 'categories', label: 'Categories' }]} />
              {h.navSource === 'categories' ? (
                <Notice>The menu shows your visible categories automatically. Manage them in the <b>Categories</b> tab.</Notice>
              ) : (
                <>
                  <SortableList items={h.nav} onReorder={setNav} onRemove={(it) => setNav(h.nav.filter((x) => x.id !== it.id))}
                    renderTitle={(it) => it.label || 'Untitled link'}
                    renderBody={(it) => (
                      <>
                        <Text label="Label" maxLength={24} value={it.label} onChange={(v) => updNav(it.id, { label: v }, `nv.${it.id}`)} />
                        <LinkField value={it.link} onChange={(v) => updNav(it.id, { link: v })} />
                      </>
                    )} />
                  <AddButton onClick={() => setNav([...h.nav, { id: uid('nv'), label: 'New link', link: link('all') }])}>Add menu link</AddButton>
                </>
              )}
              <IconPicker label="Mobile menu icon" value={h.menuIcon} onChange={t('menuIcon')} options={headerIcons.menu} />
            </Group>

            <Group title="Search" icon={<FiSearch />}>
              <Toggle label="Show search" checked={h.search.enabled} onChange={(v) => edit((c) => { c.header.search.enabled = v; })} />
              {h.search.enabled && (
                <>
                  <Text label="Placeholder" maxLength={36} {...b('header.search.placeholder')} />
                  <Segmented label="Style" value={h.search.style} onChange={(v) => edit((c) => { c.header.search.style = v; })} options={[{ id: 'pill', label: 'Pill' }, { id: 'box', label: 'Box' }, { id: 'underline', label: 'Line' }]} />
                  <IconPicker label="Icon" value={h.search.icon} onChange={(v) => edit((c) => { c.header.search.icon = v; })} options={headerIcons.search} />
                </>
              )}
            </Group>

            <Group title="Cart & account" icon={<FiShoppingBag />}>
              <Toggle label="Cart button" checked={h.cart.enabled} onChange={(v) => edit((c) => { c.header.cart.enabled = v; })} />
              {h.cart.enabled && <IconPicker label="Cart icon" value={h.cart.icon} onChange={(v) => edit((c) => { c.header.cart.icon = v; })} options={headerIcons.cart} />}
              <Toggle label="Wishlist button" checked={h.wishlist.enabled} onChange={(v) => edit((c) => { c.header.wishlist.enabled = v; })} />
              <Toggle label="Account button" checked={h.account.enabled} onChange={(v) => edit((c) => { c.header.account.enabled = v; })} />
            </Group>
          </>
        )}
      </div>
    </>
  );
}

/* --------------------------------- footer --------------------------------- */
export function FooterEditor({ cfg, edit, onBack }) {
  const b = makeBind(cfg, edit);
  const f = cfg.footer;
  const t = (k) => (v) => edit((c) => { c.footer[k] = v; });
  const setCols = (cols) => edit((c) => { c.footer.columns = cols; });
  const updCol = (id, patch, key) => edit((c) => { const col = c.footer.columns.find((x) => x.id === id); if (col) Object.assign(col, patch); }, key);
  const setLinks = (id, links) => edit((c) => { const col = c.footer.columns.find((x) => x.id === id); if (col) col.links = links; });
  const updLink = (cid, lid, patch, key) => edit((c) => { const l = c.footer.columns.find((x) => x.id === cid)?.links.find((x) => x.id === lid); if (l) Object.assign(l, patch); }, key);
  const setSocials = (s) => edit((c) => { c.footer.socials = s; });
  const togglePay = (p) => edit((c) => { c.footer.payments = c.footer.payments.includes(p) ? c.footer.payments.filter((x) => x !== p) : [...c.footer.payments, p]; });

  return (
    <>
      <PanelHeader title="Footer" subtitle="Links, contact, socials and payments" onBack={onBack} />
      <div className={st.panelBody}>
        <Toggle label="Show footer" checked={f.enabled} onChange={t('enabled')} />
        {f.enabled && (
          <>
            <Group title="Layout & colours" icon={<FiLayout />} defaultOpen>
              <OptionCards label="Footer style" cols={3} value={f.layout} onChange={t('layout')} options={[
                { id: 'columns', label: 'Columns', thumb: <Thumb><path d="M4 6h14M26 6h10M44 6h10M26 14h10M44 14h10M26 22h10M4 14h14M4 22h8" /></Thumb> },
                { id: 'centered', label: 'Centered', thumb: <Thumb><path d="M22 6h16M14 15h32M20 24h20" /></Thumb> },
                { id: 'minimal', label: 'Minimal', thumb: <Thumb><path d="M4 12h12M24 12h18M50 12h6M14 24h32" /></Thumb> },
              ]} />
              <div className={st.grid2}>
                <ColorField label="Background" allowClear fallback={cfg.theme.surface} {...b('footer.bg')} />
                <ColorField label="Text" allowClear fallback={cfg.theme.text} {...b('footer.color')} />
              </div>
              <Toggle label="Show logo" checked={f.showLogo} onChange={t('showLogo')} />
              <Area label="About text" rows={3} maxLength={240} placeholder="Leave empty to use your shop description" {...b('footer.about')} />
            </Group>

            {(
              <Group title="Link columns" icon={<FiLink />}>
                <SortableList items={f.columns} onReorder={setCols} onRemove={(c) => setCols(f.columns.filter((x) => x.id !== c.id))}
                  renderTitle={(c) => `${c.title || 'Untitled'} · ${c.links.length} links`}
                  renderBody={(col) => (
                    <>
                      <Text label="Column title" maxLength={24} value={col.title} onChange={(v) => updCol(col.id, { title: v }, `fc.${col.id}`)} />
                      <SortableList items={col.links} onReorder={(l) => setLinks(col.id, l)} onRemove={(l) => setLinks(col.id, col.links.filter((x) => x.id !== l.id))}
                        renderTitle={(l) => l.label || 'Untitled link'}
                        renderBody={(l) => (
                          <>
                            <Text label="Label" maxLength={32} value={l.label} onChange={(v) => updLink(col.id, l.id, { label: v }, `fl.${l.id}`)} />
                            <LinkField value={l.link} onChange={(v) => updLink(col.id, l.id, { link: v })} />
                          </>
                        )} />
                      <AddButton onClick={() => setLinks(col.id, [...col.links, { id: uid('fl'), label: 'New link', link: link('url', '#') }])}>Add link</AddButton>
                    </>
                  )} />
                {f.columns.length < 4 && <AddButton onClick={() => setCols([...f.columns, { id: uid('fc'), title: 'New column', links: [{ id: uid('fl'), label: 'New link', link: link('url', '#') }] }])}>Add column</AddButton>}
              </Group>
            )}

            <Group title="Contact details" icon={<FiMail />}>
              <Toggle label="Show contact info" hint="Uses the email, phone, address and hours from Shop details." checked={f.contact.show} onChange={(v) => edit((c) => { c.footer.contact.show = v; })} />
            </Group>

            <Group title="Social links" icon={<FiShare2 />} badge={f.socials.length || undefined}>
              <SortableList items={f.socials} onReorder={setSocials} onRemove={(s) => setSocials(f.socials.filter((x) => x.id !== s.id))}
                renderTitle={(s) => SOCIAL_TYPES.find((x) => x.id === s.type)?.label || 'Social'}
                renderBody={(s) => (
                  <>
                    <Select label="Network" value={s.type} onChange={(v) => edit((c) => { const x = c.footer.socials.find((y) => y.id === s.id); if (x) x.type = v; })} options={SOCIAL_TYPES} />
                    <Text label="Profile URL" placeholder={SOCIAL_TYPES.find((x) => x.id === s.type)?.placeholder} value={s.url} onChange={(v) => edit((c) => { const x = c.footer.socials.find((y) => y.id === s.id); if (x) x.url = v; }, `so.${s.id}`)} />
                  </>
                )} />
              <AddButton onClick={() => setSocials([...f.socials, { id: uid('so'), type: 'instagram', url: '' }])}>Add social link</AddButton>
            </Group>

            <Group title="Newsletter" icon={<FiMail />}>
              <Toggle label="Show newsletter sign-up" checked={f.newsletter.enabled} onChange={(v) => edit((c) => { c.footer.newsletter.enabled = v; })} />
              {f.newsletter.enabled && (
                <>
                  <Text label="Title" maxLength={40} {...b('footer.newsletter.title')} />
                  <Text label="Text" maxLength={110} {...b('footer.newsletter.text')} />
                  <Text label="Button label" maxLength={18} {...b('footer.newsletter.button')} />
                </>
              )}
            </Group>

            <Group title="Payments & legal" icon={<FiCreditCard />}>
              <Toggle label="Show payment badges" checked={f.showPayments} onChange={t('showPayments')} />
              {f.showPayments && (
                <div className={pal.chipsRow}>
                  {PAYMENT_BADGES.map((p) => (
                    <button key={p} type="button" className={cx(st.btn, st.btnSm, f.payments.includes(p) && st.btnPrimary)} onClick={() => togglePay(p)}>{p}</button>
                  ))}
                </div>
              )}
              <Text label="Copyright line" hint="Use {year} and {shop} as placeholders." {...b('footer.copyright')} />
              <Toggle label="Show “Powered by Zailio”" checked={f.poweredBy} onChange={t('poweredBy')} />
            </Group>
          </>
        )}
      </div>
    </>
  );
}
