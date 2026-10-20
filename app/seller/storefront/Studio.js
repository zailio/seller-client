'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiMonitor, FiTablet, FiSmartphone, FiRotateCcw, FiRotateCw, FiEye, FiUploadCloud, FiCheck, FiLayout, FiDroplet, FiShoppingBag,
  FiGrid, FiCopy, FiX, FiAlertTriangle, FiCheckCircle, FiZap, FiExternalLink, FiMousePointer,
} from 'react-icons/fi';
import Storefront from './renderer/Storefront';
import { defaultConfig, normalizeConfig, createSection } from './lib/schema';
import { buildTemplate, TEMPLATES } from './lib/templates';
import { loadStorefront, saveDraft, publishStorefront, uploadImage } from './lib/api';
import { useSellerProducts } from './lib/products';
import { useHistory } from './lib/useHistory';
import { stableStringify, move, uid, clone, timeLabel } from './lib/utils';
import { StudioContext } from './ui/context';
import ProductPicker from './ui/ProductPicker';
import ConfirmDialog from './ui/ConfirmDialog';
import { st, cx } from './ui/controls';
import { StructurePanel, AddSectionPanel } from './panels/StructurePanel';
import SectionEditor from './panels/SectionEditor';
import { AnnouncementEditor, HeaderEditor, FooterEditor } from './panels/ChromePanels';
import ThemePanel from './panels/ThemePanel';
import BrandPanel from './panels/BrandPanel';
import CategoriesPanel from './panels/CategoriesPanel';
import TemplatesPanel from './panels/TemplatesPanel';
import config from '../../../utils/config';
import s from './studio.module.css';

const TABS = [
  { id: 'page', label: 'Page', icon: FiLayout },
  { id: 'theme', label: 'Theme', icon: FiDroplet },
  { id: 'shop', label: 'Shop', icon: FiShoppingBag },
  { id: 'categories', label: 'Categories', icon: FiGrid },
  { id: 'templates', label: 'Templates', icon: FiCopy },
];
const DEVICES = [
  { id: 'desktop', icon: FiMonitor, label: 'Desktop' },
  { id: 'tablet', icon: FiTablet, label: 'Tablet' },
  { id: 'mobile', icon: FiSmartphone, label: 'Mobile' },
];

function brandSeedFrom(store) {
  const o = store && typeof store === 'object' ? store : {};
  return { name: o.name || o.shop_name || 'My Store', bio: o.bio || o.desc || '', logo: o.icon || o.img || '' };
}

export default function Studio({ auth, session, store, addNotification }) {
  const seed = useMemo(() => brandSeedFrom(store), [store]);
  const subdomain = store?.sub_dom || '';
  const hist = useHistory(useMemo(() => defaultConfig(seed), [])); // eslint-disable-line react-hooks/exhaustive-deps
  const cfg = hist.config;

  const [phase, setPhase] = useState('loading'); // loading | welcome | ready
  const [mode, setMode] = useState('local');
  const [tab, setTab] = useState('page');
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [focus, setFocus] = useState(null);
  const [device, setDevice] = useState('desktop');
  const [mobileView, setMobileView] = useState('edit');
  const [save, setSave] = useState({ state: 'saved', at: null });
  const [published, setPublished] = useState({ hash: null, at: null });
  const [publishing, setPublishing] = useState(false);
  const [fullPreview, setFullPreview] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [pickReq, setPickReq] = useState(null);
  const [confirmReq, setConfirmReq] = useState(null);
  const [hint, setHint] = useState(true);

  const lastSaved = useRef(null);
  const frameRef = useRef(null);
  const apiCtx = useMemo(() => ({ auth, session, mode, sub: subdomain }), [auth, session, mode, subdomain]);
  const products = useSellerProducts(apiCtx, { enabled: phase !== 'loading' });

  /* ---------------------------- boot ---------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await loadStorefront({ auth, session, sub: subdomain });
      if (!alive) return;
      setMode(res.mode);
      if (res.draft) {
        const n = normalizeConfig(res.draft, seed);
        hist.reset(n);
        lastSaved.current = stableStringify(n);
        setPublished({ hash: res.published ? stableStringify(normalizeConfig(res.published, seed)) : null, at: res.publishedAt });
        setSave({ state: 'saved', at: res.updatedAt });
        setPhase('ready');
      } else {
        setPhase('welcome');
      }
    })();
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* --------------------------- toasts --------------------------- */
  const notify = useCallback((title, message, tone = 'warn') => {
    const id = uid('t');
    setToasts((t) => [...t, { id, title, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4800);
  }, []);

  /* ------------------------- edit helpers ------------------------ */
  const edit = hist.commit;
  const hash = useMemo(() => stableStringify(cfg), [cfg]);
  const dirty = phase === 'ready' && hash !== lastSaved.current;
  const unpublished = phase === 'ready' && hash !== published.hash;

  /* ----------------------------- save ---------------------------- */
  const doSave = useCallback(async (silent = true) => {
    if (phase !== 'ready') return true;
    const h = stableStringify(cfg);
    if (h === lastSaved.current) return true;
    setSave((x) => ({ ...x, state: 'saving' }));
    try {
      const r = await saveDraft(apiCtx, cfg);
      lastSaved.current = h;
      setSave({ state: 'saved', at: r.updatedAt });
      return true;
    } catch (e) {
      setSave((x) => ({ ...x, state: 'error' }));
      if (!silent || e.code === 'QUOTA') notify('Could not save', e.message || 'Check your connection and try again.', 'err');
      return false;
    }
  }, [phase, cfg, apiCtx, notify]);

  useEffect(() => {
    if (!dirty) return undefined;
    setSave((x) => (x.state === 'saving' ? x : { ...x, state: 'dirty' }));
    const t = setTimeout(() => doSave(true), 1600);
    return () => clearTimeout(t);
  }, [hash]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onBefore = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', onBefore);
    return () => window.removeEventListener('beforeunload', onBefore);
  }, [dirty]);

  const publish = async () => {
    setPublishing(true);
    try {
      const r = await publishStorefront(apiCtx, cfg);
      lastSaved.current = stableStringify(cfg);
      setPublished({ hash: stableStringify(cfg), at: r.publishedAt });
      setSave({ state: 'saved', at: r.updatedAt });
      notify('Published', mode === 'server' ? 'Your storefront is live.' : 'Published locally. Connect the backend to go live on your sub-domain.', 'ok');
      addNotification?.({ h2: 'Storefront published', desc: 'Your changes are now live.' });
    } catch (e) {
      notify('Publish failed', e.message || 'Please try again.', 'err');
    } finally {
      setPublishing(false);
    }
  };

  /* --------------------------- shortcuts ------------------------- */
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || phase !== 'ready') return;
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
      if (e.key.toLowerCase() === 's') { e.preventDefault(); doSave(false).then((ok) => ok && notify('Saved', 'Draft saved.', 'ok')); }
      else if (e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? hist.redo() : hist.undo(); }
      else if (e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); hist.redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, doSave, hist, notify]);

  /* --------------------------- selection ------------------------- */
  const select = useCallback((target) => {
    setAdding(false);
    setSelected(target);
    setMobileView('edit');
    if (target?.type !== 'section') setFocus(null);
  }, []);
  const back = () => { setSelected(null); setFocus(null); setAdding(false); };
  const goto = (t) => { setTab(t); back(); };

  useEffect(() => {
    if (!selected || !frameRef.current) return;
    const el = frameRef.current.querySelector(`[data-sf-block="${selected.type}"][data-sf-id="${selected.id || ''}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: selected.type === 'footer' ? 'end' : 'start' });
  }, [selected]);

  /* -------------------- section actions (canvas) ------------------ */
  const actions = useMemo(() => ({
    move: (id, dir) => edit((c) => { const i = c.sections.findIndex((x) => x.id === id); c.sections = move(c.sections, i, i + dir); }),
    toggle: (id) => edit((c) => { const x = c.sections.find((y) => y.id === id); if (x) x.enabled = !x.enabled; }),
    duplicate: (id) => edit((c) => { const i = c.sections.findIndex((x) => x.id === id); const copy = clone(c.sections[i]); copy.id = uid('sec'); c.sections.splice(i + 1, 0, copy); }),
    remove: (id) => setConfirmReq({
      title: 'Delete this section?', danger: true, confirmText: 'Delete', message: 'You can undo this straight afterwards with the undo button.',
      onConfirm: () => { edit((c) => { c.sections = c.sections.filter((x) => x.id !== id); }); setSelected(null); },
    }),
  }), [edit]);

  const addSection = (type) => {
    const sec = createSection(type);
    edit((c) => { c.sections.push(sec); });
    setAdding(false);
    setSelected({ type: 'section', id: sec.id });
  };

  const editorProp = useMemo(() => ({ selected, focus, onSelect: select, actions }), [selected, focus, select, actions]);

  /* ---------------------------- services ------------------------- */
  const services = useMemo(() => ({
    uploadImage: (file) => uploadImage(apiCtx, file),
    notify: (t, m) => notify(t, m, 'err'),
    confirm: (r) => setConfirmReq(r),
    pickProducts: (r) => setPickReq(r),
    categories: cfg.categories,
    mode,
  }), [apiCtx, notify, cfg.categories, mode]);

  const startFrom = (id) => {
    const t = buildTemplate(id, seed);
    hist.reset(t);
    lastSaved.current = null;
    setPhase('ready');
  };

  const publicUrl = subdomain ? `https://${subdomain}.${config.domain}` : '';

  /* ---------------------------- panels --------------------------- */
  let panel;
  if (adding) panel = <AddSectionPanel onAdd={addSection} onBack={back} />;
  else if (selected?.type === 'section') panel = <SectionEditor cfg={cfg} edit={edit} sectionId={selected.id} onBack={back} setFocus={setFocus} goto={goto} />;
  else if (selected?.type === 'header') panel = <HeaderEditor cfg={cfg} edit={edit} onBack={back} />;
  else if (selected?.type === 'footer') panel = <FooterEditor cfg={cfg} edit={edit} onBack={back} />;
  else if (selected?.type === 'announcement') panel = <AnnouncementEditor cfg={cfg} edit={edit} onBack={back} />;
  else if (tab === 'theme') panel = <ThemePanel cfg={cfg} edit={edit} />;
  else if (tab === 'shop') panel = <BrandPanel cfg={cfg} edit={edit} />;
  else if (tab === 'categories') panel = <CategoriesPanel cfg={cfg} edit={edit} />;
  else if (tab === 'templates') panel = <TemplatesPanel cfg={cfg} edit={edit} />;
  else panel = <StructurePanel cfg={cfg} edit={edit} select={select} openAdd={() => setAdding(true)} />;

  const statusText = save.state === 'saving' ? 'Saving…' : save.state === 'error' ? 'Save failed — retrying' : dirty || save.state === 'dirty' ? 'Unsaved changes' : save.at ? `Saved ${timeLabel(save.at)}` : 'All changes saved';
  const dotCls = save.state === 'saving' ? s.dotPulse : save.state === 'error' ? s.dotErr : dirty ? s.dotWarn : '';

  /* ---------------------------- render --------------------------- */
  if (phase === 'loading') {
    return <div className={s.studio}><div className={s.loading}><span className={st.spin} style={{ width: 30, height: 30 }} /><span>Opening Storefront Studio…</span></div></div>;
  }

  if (phase === 'welcome') {
    return (
      <StudioContext.Provider value={services}>
        <div className={s.studio}>
          <div className={s.center}>
            <div className={s.welcome}>
              <div className={s.welcomeHead}>
                <span className={s.eyebrow}><FiZap /> Storefront Studio</span>
                <h1>Design a shop customers remember</h1>
                <p>Pick a starting look. You can change every colour, font, section, link and image afterwards — and switch template any time.</p>
              </div>
              <div className={s.tplGrid}>
                {TEMPLATES.map((t) => {
                  const preview = t.build(seed);
                  return (
                    <div key={t.id} role="button" tabIndex={0} className={s.tplCard} onClick={() => startFrom(t.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && startFrom(t.id)}>
                      <div className={s.tplPreview}>
                        <div className={s.tplPreviewInner} style={{ width: 1240, maxWidth: "none" }}><Storefront config={preview} products={[]} /></div>
                      </div>
                      <div className={s.tplMeta}><span className={s.tplName}>{t.name}</span><span className={s.tplDesc}>{t.tagline}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </StudioContext.Provider>
    );
  }

  return (
    <StudioContext.Provider value={services}>
      <div className={cx(s.studio, mobileView === 'preview' ? s.viewPreview : s.viewEdit)}>
        <header className={s.top}>
          <div className={s.brand}>
            <span className={s.mark}><FiZap /></span>
            <div className={s.brandText}>
              <span className={s.brandTitle}>Storefront Studio</span>
              <span className={s.status}>
                <i className={cx(s.dot, dotCls)} />{statusText}
                {mode === 'local' && <span className={s.localTag} title="The backend isn’t connected, so drafts are stored in this browser only.">Local mode</span>}
              </span>
            </div>
          </div>

          <div className={s.mobileSwitch}>
            <button type="button" className={mobileView === 'edit' ? s.msOn : ''} onClick={() => setMobileView('edit')}>Edit</button>
            <button type="button" className={mobileView === 'preview' ? s.msOn : ''} onClick={() => setMobileView('preview')}>Preview</button>
          </div>

          <div className={s.topCenter}>
            <div className={s.devices} role="tablist" aria-label="Preview device">
              {DEVICES.map(({ id, icon: I, label }) => (
                <button key={id} type="button" role="tab" aria-selected={device === id} title={label} className={cx(s.dev, device === id && s.devOn)} onClick={() => setDevice(id)}><I /></button>
              ))}
            </div>
          </div>

          <div className={s.topRight}>
            <button type="button" className={cx(s.tbtn, s.tIcon)} title="Undo (Ctrl+Z)" aria-label="Undo" disabled={!hist.canUndo} onClick={hist.undo}><FiRotateCcw /></button>
            <button type="button" className={cx(s.tbtn, s.tIcon)} title="Redo (Ctrl+Shift+Z)" aria-label="Redo" disabled={!hist.canRedo} onClick={hist.redo}><FiRotateCw /></button>
            <span className={s.sep} />
            <button type="button" className={s.tbtn} onClick={() => setFullPreview(true)}><FiEye /><span className={s.lbl}>Preview</span></button>
            {publicUrl && published.at ? <a className={cx(s.tbtn, s.tIcon)} href={publicUrl} target="_blank" rel="noopener noreferrer" title="Open live shop" aria-label="Open live shop"><FiExternalLink /></a> : null}
            <button type="button" className={cx(s.tbtn, s.publish, !unpublished && s.publishDone)} disabled={publishing || (!unpublished && !dirty)} onClick={publish}>
              {publishing ? <span className={st.spin} style={{ width: 15, height: 15, borderWidth: 2 }} /> : !unpublished ? <FiCheck /> : <FiUploadCloud />}
              <span className={s.lbl}>{publishing ? 'Publishing…' : !unpublished ? 'Published' : published.at ? 'Publish changes' : 'Publish'}</span>
            </button>
          </div>
        </header>

        <div className={s.body}>
          <nav className={s.rail} aria-label="Studio sections">
            {TABS.map(({ id, label, icon: I }) => (
              <button key={id} type="button" className={cx(s.railBtn, tab === id && !selected && !adding && s.railOn)} onClick={() => goto(id)}><I />{label}</button>
            ))}
          </nav>

          <aside className={s.panel}>{panel}</aside>

          <main className={cx(s.canvas, device === 'tablet' && s.devTablet, device === 'mobile' && s.devMobile)} onClick={() => { setHint(false); }}>
            <div className={s.frame} ref={frameRef}>
              <Storefront config={cfg} products={products.items} editor={editorProp} />
            </div>
            {hint && <div className={s.hintBar}><FiMousePointer /> Click anything on the page to edit it</div>}
          </main>
        </div>

        <div className={s.toasts} aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={cx(s.toast, t.tone === 'err' && s.toastErr, t.tone === 'ok' && s.toastOk)}>
              {t.tone === 'ok' ? <FiCheckCircle className={s.toastIcon} /> : <FiAlertTriangle className={s.toastIcon} />}
              <div><div className={s.toastTitle}>{t.title}</div><div className={s.toastMsg}>{t.message}</div></div>
            </div>
          ))}
        </div>

        {pickReq && <ProductPicker request={pickReq} products={products} onClose={() => setPickReq(null)} />}
        {confirmReq && <ConfirmDialog request={confirmReq} onClose={() => setConfirmReq(null)} />}
        {fullPreview && (
          <div className={s.fullPreview}>
            <div className={s.fpBar}>
              <b>Preview</b><span>This is how customers will see your shop. Links are live here.</span>
              <button type="button" className={cx(s.tbtn)} onClick={() => setFullPreview(false)}><FiX /> Close</button>
            </div>
            <div className={s.fpBody}><Storefront config={cfg} products={products.items} /></div>
          </div>
        )}
      </div>
    </StudioContext.Provider>
  );
}
