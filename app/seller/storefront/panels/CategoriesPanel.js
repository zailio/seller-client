'use client';
import { FiGrid, FiPackage } from 'react-icons/fi';
import { createCategory } from '../lib/schema';
import { slugify } from '../lib/utils';
import { Text, Area, Toggle, ImageField, SortableList, AddButton, PanelHeader, Notice, Btn, Field, st } from '../ui/controls';
import { useStudio } from '../ui/context';
import pal from './panels.module.css';

export default function CategoriesPanel({ cfg, edit }) {
  const studio = useStudio();
  const cats = cfg.categories;
  const setCats = (list) => edit((c) => { c.categories = list; });
  const upd = (id, patch, key) => edit((c) => { const x = c.categories.find((y) => y.id === id); if (x) Object.assign(x, patch); }, key);

  const assign = (cat) => studio.pickProducts({
    title: `Products in “${cat.name}”`, multiple: true, selected: cat.productIds,
    onConfirm: (list) => edit((c) => {
      const x = c.categories.find((y) => y.id === cat.id);
      if (x) x.productIds = list.map((p) => p.id);
      c.catalog = c.catalog || {};
      list.forEach((p) => { c.catalog[p.id] = { title: p.title, image: p.image, price: p.price, discount: p.discount, isAvailable: p.isAvailable }; });
    }),
  });

  const remove = (cat) => studio.confirm({
    title: `Delete “${cat.name}”?`, danger: true, confirmText: 'Delete category',
    message: <>Products stay in your shop — they just won’t be grouped here anymore. Sections that use this category will fall back to samples.</>,
    onConfirm: () => edit((c) => {
      c.categories = c.categories.filter((x) => x.id !== cat.id);
      c.sections.forEach((s) => {
        if (s.type === 'categories') s.settings.categoryIds = s.settings.categoryIds.filter((x) => x !== cat.id);
        if (s.type === 'products' && s.settings.categoryId === cat.id) s.settings.categoryId = '';
      });
    }),
  });

  return (
    <>
      <PanelHeader title="Categories" subtitle="Group your products your own way" />
      <div className={st.panelBody}>
        {!cats.length && <Notice>Create categories like <b>New arrivals</b>, <b>Sarees</b> or <b>Gifting</b>, assign products to them, then show them on your home page and in the menu.</Notice>}
        <SortableList items={cats} onReorder={setCats} onRemove={remove}
          onToggle={(cat) => upd(cat.id, { visible: cat.visible === false })} isOff={(cat) => cat.visible === false}
          thumb={(cat) => (cat.image ? <img src={cat.image} alt="" /> : cat.emoji || <FiGrid />)}
          renderTitle={(cat) => `${cat.name || 'Untitled'} · ${cat.productIds.length}`}
          renderBody={(cat) => (
            <>
              <Text label="Name" maxLength={32} value={cat.name} onChange={(v) => upd(cat.id, { name: v }, `${cat.id}.n`)} />
              <div className={st.grid2}>
                <Text label="Emoji" placeholder="✨" maxLength={4} value={cat.emoji} onChange={(v) => upd(cat.id, { emoji: v }, `${cat.id}.e`)} />
                <Text label="Web address" placeholder={slugify(cat.name) || 'category'} hint="Optional" maxLength={40} value={cat.slug} onChange={(v) => upd(cat.id, { slug: slugify(v) }, `${cat.id}.s`)} />
              </div>
              <ImageField label="Cover image" shape="wide" recommended="Shown in card, circle and tile styles" value={cat.image} onChange={(v) => upd(cat.id, { image: v })} />
              <Area label="Description" rows={2} maxLength={160} value={cat.description} onChange={(v) => upd(cat.id, { description: v }, `${cat.id}.d`)} />
              <Field label={`Products (${cat.productIds.length})`}>
                <Btn block onClick={() => assign(cat)}><FiPackage /> {cat.productIds.length ? 'Change products' : 'Add products'}</Btn>
                {cat.productIds.length > 0 && (
                  <div className={pal.chipsRow}>
                    {cat.productIds.slice(0, 12).map((id) => {
                      const p = cfg.catalog?.[id];
                      return (
                        <span key={id} className={pal.miniChip}>
                          {p?.image ? <img src={p.image} alt="" /> : <em>{(p?.title || '?').charAt(0)}</em>}
                          <span>{p?.title || id}</span>
                          <button type="button" aria-label="Remove" onClick={() => upd(cat.id, { productIds: cat.productIds.filter((x) => x !== id) })}>✕</button>
                        </span>
                      );
                    })}
                    {cat.productIds.length > 12 && <span className={pal.miniChip}><span>+{cat.productIds.length - 12} more</span></span>}
                  </div>
                )}
              </Field>
              <Toggle label="Visible on my shop" checked={cat.visible !== false} onChange={(v) => upd(cat.id, { visible: v })} />
            </>
          )} />
        <AddButton onClick={() => setCats([...cats, createCategory(`Category ${cats.length + 1}`)])}>Add category</AddButton>
      </div>
    </>
  );
}
