'use client';
import { useId, useRef, useState } from 'react';
import { FiChevronDown, FiPlus, FiTrash2, FiCopy, FiArrowUp, FiArrowDown, FiUploadCloud, FiRefreshCw, FiLink, FiEye, FiEyeOff, FiInfo, FiAlertTriangle, FiCheckCircle, FiArrowLeft, FiX } from 'react-icons/fi';
import { RiDraggable } from 'react-icons/ri';
import { useStudio } from './context';
import { LINK_KINDS } from '../lib/schema';
import { isHex, normalizeHex, clamp, move } from '../lib/utils';
import st from './controls.module.css';

export const cx = (...a) => a.filter(Boolean).join(' ');
export { st };

/* ------------------------------- primitives ------------------------------ */

export function Field({ label, hint, error, right, children, htmlFor }) {
  return (
    <div className={st.field}>
      {label ? <label className={st.label} htmlFor={htmlFor}><span>{label}</span>{right ? <span className={st.labelHint}>{right}</span> : null}</label> : null}
      {children}
      {error ? <div className={st.error}>{error}</div> : hint ? <div className={st.hint}>{hint}</div> : null}
    </div>
  );
}

export function Text({ label, hint, value, onChange, placeholder, maxLength, icon: Icon, type = 'text', error, disabled }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} right={maxLength ? `${(value || '').length}/${maxLength}` : null}>
      <div className={Icon ? st.inputWrap : undefined}>
        {Icon ? <Icon className={st.inputIcon} /> : null}
        <input id={id} className={st.input} type={type} value={value ?? ''} placeholder={placeholder} maxLength={maxLength} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  );
}

export function Area({ label, hint, value, onChange, placeholder, rows = 4, maxLength }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id} right={maxLength ? `${(value || '').length}/${maxLength}` : null}>
      <textarea id={id} className={st.textarea} rows={rows} value={value ?? ''} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function Select({ label, hint, value, onChange, options }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <select id={id} className={st.select} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function Toggle({ label, hint, checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} className={st.toggleRow} onClick={() => onChange(!checked)}>
      <span className={st.toggleText}>
        <span className={st.toggleLabel}>{label}</span>
        {hint ? <span className={st.hint}>{hint}</span> : null}
      </span>
      <span className={cx(st.switch, checked && st.switchOn)} />
    </button>
  );
}

export function Segmented({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <div className={st.seg} role="tablist">
        {options.map((o) => (
          <button key={o.id} type="button" role="tab" aria-selected={value === o.id} className={cx(st.segBtn, value === o.id && st.segOn)} onClick={() => onChange(o.id)}>
            {o.icon || null}{o.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function OptionCards({ label, value, onChange, options, cols = 3 }) {
  return (
    <Field label={label}>
      <div className={st.cards} style={{ '--n': cols }}>
        {options.map((o) => (
          <button key={o.id} type="button" className={cx(st.optCard, value === o.id && st.optOn)} onClick={() => onChange(o.id)}>
            {o.thumb ? <span className={st.optThumb}>{o.thumb}</span> : null}
            {o.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function Slider({ label, value, onChange, min = 0, max = 100, step = 1, unit = '' }) {
  const v = clamp(Number(value) || 0, min, max);
  return (
    <Field label={label}>
      <div className={st.sliderRow}>
        <input type="range" className={st.range} min={min} max={max} step={step} value={v} style={{ '--p': `${((v - min) / (max - min)) * 100}%` }} onChange={(e) => onChange(Number(e.target.value))} />
        <span className={st.sliderVal}>{v}{unit}</span>
      </div>
    </Field>
  );
}

export function ColorField({ label, hint, value, onChange, fallback = '#000000', allowClear = false, clearLabel = 'Use theme' }) {
  const shown = isHex(value) ? normalizeHex(value) : fallback;
  const [draft, setDraft] = useState(null);
  return (
    <Field label={label} hint={hint}>
      <div className={st.color}>
        <label className={st.swatch} style={{ background: value ? shown : `repeating-conic-gradient(#e5e7ee 0% 25%, #fff 0% 50%) 50% / 10px 10px` }}>
          <input type="color" value={shown} onChange={(e) => onChange(e.target.value)} aria-label={label || 'Colour'} />
        </label>
        <input
          className={cx(st.input, st.colorHex)}
          value={draft ?? (value || '')}
          placeholder={allowClear ? 'Theme default' : shown}
          maxLength={7}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft(raw);
            if (isHex(raw)) onChange(normalizeHex(raw));
          }}
          onBlur={() => setDraft(null)}
        />
        {allowClear && value ? <button type="button" className={st.clear} onClick={() => { setDraft(null); onChange(''); }}>{clearLabel}</button> : null}
      </div>
    </Field>
  );
}

/* --------------------------------- image --------------------------------- */

export function ImageField({ label, hint, value, onChange, shape = 'wide', contain = false, recommended }) {
  const studio = useStudio();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const shapeCls = { wide: st.imgWide, square: st.imgSquare, tall: st.imgTall, banner: st.imgBanner }[shape];

  const pick = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await studio.uploadImage(file));
    } catch (e) {
      studio.notify('Upload failed', e.message || 'Please try another image.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Field label={label} hint={hint}>
      <div
        className={cx(st.img, shapeCls, value ? st.imgFilled : '', contain && st.imgContain, drag && st.imgDrag)}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
      >
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => pick(e.target.files?.[0])} />
        {value ? (
          <>
            <img src={value} alt="" draggable={false} />
            <div className={st.imgBar}>
              <button type="button" className={st.imgBtn} onClick={() => inputRef.current?.click()}><FiRefreshCw /> Replace</button>
              <button type="button" className={cx(st.imgBtn, st.imgBtnDanger)} onClick={() => onChange('')}><FiTrash2 /> Remove</button>
            </div>
          </>
        ) : (
          <button type="button" className={st.imgEmpty} onClick={() => inputRef.current?.click()}>
            <span className={st.imgEmptyIcon}><FiUploadCloud /></span>
            <span><strong>Upload image</strong> or drop it here</span>
            {recommended ? <small>{recommended}</small> : <small>JPG, PNG or WebP · up to 8 MB</small>}
          </button>
        )}
        {busy ? <div className={st.imgBusy}><span className={st.spin} /></div> : null}
      </div>
    </Field>
  );
}

export function IconPicker({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <div className={st.iconGrid}>
        {options.map(({ id, icon: Icon }) => (
          <button key={id} type="button" title={id} className={cx(st.iconBtn, value === id && st.iconOn)} onClick={() => onChange(id)}><Icon /></button>
        ))}
      </div>
    </Field>
  );
}

/* ---------------------------------- link --------------------------------- */

export function LinkField({ label = 'Links to', value, onChange }) {
  const studio = useStudio();
  const v = value || { type: 'none', value: '' };
  const cats = studio.categories || [];
  const set = (patch) => onChange({ ...v, ...patch });

  return (
    <Field label={label}>
      <div className={st.stackTight}>
        <select className={st.select} value={v.type} onChange={(e) => onChange({ type: e.target.value, value: '' })}>
          {LINK_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
        {v.type === 'category' && (
          cats.length ? (
            <select className={st.select} value={v.value} onChange={(e) => set({ value: e.target.value })}>
              <option value="">Choose a category…</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : <div className={st.hint}>Create a category first (Categories tab).</div>
        )}
        {v.type === 'product' && (
          <div className={st.row}>
            <input className={cx(st.input, st.grow)} readOnly value={v.label || v.value || ''} placeholder="No product chosen" />
            <button type="button" className={cx(st.btn, st.btnSm)} onClick={() => studio.pickProducts({ title: 'Choose a product', multiple: false, selected: v.value ? [v.value] : [], onConfirm: (list) => list[0] && set({ value: list[0].id, label: list[0].title }) })}>Choose</button>
          </div>
        )}
        {v.type === 'url' && <input className={st.input} value={v.value} placeholder="https://… or /page or #section" onChange={(e) => set({ value: e.target.value })} />}
        {v.type === 'whatsapp' && <input className={st.input} value={v.value} placeholder="Phone with country code, e.g. 919876543210" onChange={(e) => set({ value: e.target.value })} />}
        {v.type === 'tel' && <input className={st.input} value={v.value} placeholder="+91 98765 43210" onChange={(e) => set({ value: e.target.value })} />}
        {v.type === 'email' && <input className={st.input} type="email" value={v.value} placeholder="hello@yourstore.com" onChange={(e) => set({ value: e.target.value })} />}
      </div>
    </Field>
  );
}

/* ------------------------------ layout widgets ---------------------------- */

export function Group({ title, icon, defaultOpen = false, children, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cx(st.group, open && st.groupOpen)}>
      <button type="button" className={st.groupHead} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className={st.groupTitle}>{icon ? <span className={st.groupIcon}>{icon}</span> : null}{title}{badge ? <span className={cx(st.pill, st.pillAccent)}>{badge}</span> : null}</span>
        <FiChevronDown className={st.groupChevron} />
      </button>
      {open ? <div className={st.groupBody}>{children}</div> : null}
    </div>
  );
}

export function Btn({ children, variant, size, block, ...rest }) {
  return (
    <button type="button" {...rest} className={cx(st.btn, variant === 'primary' && st.btnPrimary, variant === 'ghost' && st.btnGhost, variant === 'danger' && st.btnDanger, size === 'sm' && st.btnSm, block && st.btnBlock, rest.className)}>
      {children}
    </button>
  );
}

export const AddButton = ({ children, ...rest }) => (
  <button type="button" className={st.addBtn} {...rest}><FiPlus /> {children}</button>
);

export const IconAction = ({ title, danger, children, ...rest }) => (
  <button type="button" title={title} aria-label={title} className={cx(st.iconAction, danger && st.iconActionDanger)} {...rest}>{children}</button>
);

export function Notice({ tone = 'info', children }) {
  const Icon = tone === 'warn' ? FiAlertTriangle : tone === 'ok' ? FiCheckCircle : FiInfo;
  return <div className={cx(st.notice, tone === 'warn' && st.noticeWarn, tone === 'ok' && st.noticeOk)}><Icon className={st.noticeIcon} /><div>{children}</div></div>;
}

export function Empty({ title, children, action }) {
  return <div className={st.empty}><strong>{title}</strong>{children ? <span>{children}</span> : null}{action}</div>;
}

export function PanelHeader({ title, subtitle, onBack, right }) {
  return (
    <div className={st.panelHead}>
      {onBack ? <button type="button" className={st.back} onClick={onBack} aria-label="Back"><FiArrowLeft /></button> : null}
      <div className={st.grow}>
        <h3 className={st.panelTitle}>{title}</h3>
        {subtitle ? <div className={st.panelSub}>{subtitle}</div> : null}
      </div>
      {right}
    </div>
  );
}

export const SectionLabel = ({ children }) => <div className={st.sectionLabel}>{children}</div>;

/**
 * Drag-to-reorder list with expandable bodies.
 *  items       : array with `id`
 *  onReorder   : (nextItems) => void
 *  renderTitle : (item, index) => node       renderBody : (item, index) => node
 *  thumb       : (item) => node|null
 *  onRemove / onDuplicate / onToggle (optional)   isOff(item) dims an item
 */
export function SortableList({ items, onReorder, renderTitle, renderBody, thumb, onRemove, onDuplicate, onToggle, isOff, openId, onOpen, minItems = 0 }) {
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const [localOpen, setLocalOpen] = useState(null);
  const open = openId !== undefined ? openId : localOpen;
  const setOpen = (id) => (onOpen ? onOpen(id) : setLocalOpen(id));

  const drop = (to) => {
    if (drag == null || to == null) return;
    onReorder(move(items, drag, to));
  };

  return (
    <div className={st.list}>
      {items.map((it, i) => {
        const isOpen = open === it.id;
        return (
          <div
            key={it.id}
            className={cx(st.item, drag === i && st.itemDragging, over === i && drag !== i && st.itemOver, isOff?.(it) && st.itemMuted)}
            onDragOver={(e) => { if (drag != null) { e.preventDefault(); setOver(i); } }}
            onDrop={(e) => { e.preventDefault(); drop(i); setDrag(null); setOver(null); }}
          >
            <div className={st.itemHead}>
              <span className={st.grip} draggable onDragStart={(e) => { setDrag(i); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch {} }} onDragEnd={() => { setDrag(null); setOver(null); }} title="Drag to reorder"><RiDraggable /></span>
              <button type="button" className={st.itemTitle} onClick={() => setOpen(isOpen ? null : it.id)}>
                {thumb ? <span className={st.itemThumb}>{thumb(it)}</span> : null}
                <span>{renderTitle(it, i)}</span>
              </button>
              <div className={st.itemBtns}>
                <IconAction title="Move up" disabled={i === 0} onClick={() => onReorder(move(items, i, i - 1))}><FiArrowUp /></IconAction>
                <IconAction title="Move down" disabled={i === items.length - 1} onClick={() => onReorder(move(items, i, i + 1))}><FiArrowDown /></IconAction>
                {onToggle ? <IconAction title={isOff?.(it) ? 'Show' : 'Hide'} onClick={() => onToggle(it)}>{isOff?.(it) ? <FiEyeOff /> : <FiEye />}</IconAction> : null}
                {onDuplicate ? <IconAction title="Duplicate" onClick={() => onDuplicate(it)}><FiCopy /></IconAction> : null}
                {onRemove ? <IconAction title="Delete" danger disabled={items.length <= minItems} onClick={() => onRemove(it)}><FiTrash2 /></IconAction> : null}
              </div>
            </div>
            {isOpen && renderBody ? <div className={st.itemBody}>{renderBody(it, i)}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
