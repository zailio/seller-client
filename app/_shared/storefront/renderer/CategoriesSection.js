'use client';
import { useSf } from './ctx';
import { SfLink, Media, seedOf, sectionTitleBlock } from './parts';
import { resolveCategories } from './data';
import s from './sections.module.css';

const label = (c) => (c.emoji ? c.emoji : (c.name || '?').charAt(0).toUpperCase());

export default function CategoriesSection({ section }) {
  const { config } = useSf();
  const d = section.settings;
  const { list } = resolveCategories(d, config);
  const link = (c) => ({ type: 'category', value: c.id });
  const count = (c) => (d.showCount && c.productIds?.length ? `${c.productIds.length} items` : null);
  let body;

  if (d.style === 'cards') {
    body = (
      <div className={s.catCards}>
        {list.map((c) => (
          <SfLink key={c.id} link={link(c)} className={s.catCard}>
            <Media src={c.image} seed={seedOf(c.id)} />
            {!c.image && c.emoji ? <span className={s.catEmojiBig}>{c.emoji}</span> : null}
            <div className={s.catCardLabel}><span className={s.catName}>{c.name}</span>{count(c) ? <span className={s.catCount}>{count(c)}</span> : null}</div>
          </SfLink>
        ))}
      </div>
    );
  } else if (d.style === 'tiles') {
    body = (
      <div className={s.tiles}>
        {list.map((c) => (
          <SfLink key={c.id} link={link(c)} className={s.tile}>
            <div className={s.tileIcon}>{c.image ? <img src={c.image} alt="" draggable={false} /> : label(c)}</div>
            <div><div className={s.catName}>{c.name}</div>{count(c) ? <div className={s.catCount}>{count(c)}</div> : null}</div>
          </SfLink>
        ))}
      </div>
    );
  } else if (d.style === 'chips') {
    body = (
      <div className={s.chips}>
        {list.map((c) => <SfLink key={c.id} link={link(c)} className={s.catChip}>{c.emoji ? <span>{c.emoji}</span> : null}{c.name}</SfLink>)}
      </div>
    );
  } else {
    body = (
      <div className={s.circles}>
        {list.map((c) => (
          <SfLink key={c.id} link={link(c)} className={s.circle}>
            <Media className={s.circleImg} src={c.image} seed={seedOf(c.id)}>{!c.image ? <span style={{ position: 'relative' }}>{label(c)}</span> : null}</Media>
            <div><div className={s.catName}>{c.name}</div>{count(c) ? <div className={s.catCount}>{count(c)}</div> : null}</div>
          </SfLink>
        ))}
      </div>
    );
  }

  return (
    <section className={s.pad}>
      <div className={s.inner}>{sectionTitleBlock(d.title, d.subtitle)}{body}</div>
    </section>
  );
}
