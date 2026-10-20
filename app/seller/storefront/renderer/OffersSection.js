'use client';
import { FiArrowRight, FiCopy } from 'react-icons/fi';
import { SfLink, cx, sectionTitleBlock } from './parts';
import s from './sections.module.css';

const toneCls = { primary: s.tonePrimary, accent: s.toneAccent, dark: s.toneDark, surface: s.toneSurface };

export default function OffersSection({ section }) {
  const d = section.settings;
  const items = d.items || [];
  if (!items.length) return null;

  let body;
  if (d.style === 'coupons') {
    body = (
      <div className={s.offerGrid}>
        {items.map((it) => (
          <SfLink key={it.id} link={it.link} className={s.ticket}>
            <div className={s.ticketMain}>
              {it.badge ? <span className={s.eyebrowPlain}>{it.badge}</span> : null}
              <h3 className={s.offerTitle} style={{ color: 'var(--sf-text)' }}>{it.title}</h3>
              {it.subtitle ? <p className={s.offerSub} style={{ color: 'var(--sf-muted)' }}>{it.subtitle}</p> : null}
            </div>
            <div className={s.ticketSide}><small>{it.code ? 'Use code' : 'Offer'}</small><b>{it.code || 'AUTO'}</b></div>
          </SfLink>
        ))}
      </div>
    );
  } else if (d.style === 'ticker') {
    const row = [...items, ...items, ...items, ...items];
    body = (
      <div className={s.ticker}>
        <div className={s.tickerTrack}>
          {row.map((it, i) => (
            <SfLink key={`${it.id}-${i}`} link={it.link} className={s.chip}>
              <b>{it.badge || '★'}</b> {it.title}{it.code ? <i>{it.code}</i> : null}
            </SfLink>
          ))}
        </div>
      </div>
    );
  } else {
    body = (
      <div className={s.offerGrid}>
        {items.map((it) => (
          <SfLink key={it.id} link={it.link} className={cx(s.offer, toneCls[it.tone] || s.tonePrimary)}>
            {it.image ? <div className={s.offerImg}><img src={it.image} alt="" draggable={false} /></div> : null}
            <div className={s.offerBody}>
              {it.badge ? <span className={s.offerBadge}>{it.badge}</span> : null}
              <h3 className={s.offerTitle}>{it.title}</h3>
              {it.subtitle ? <p className={s.offerSub}>{it.subtitle}</p> : null}
              {it.code
                ? <span className={s.code}><FiCopy /> {it.code}</span>
                : <span className={s.offerSub} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontWeight: 700 }}>Shop now <FiArrowRight /></span>}
            </div>
          </SfLink>
        ))}
      </div>
    );
  }

  return (
    <section className={s.pad} id="offers">
      <div className={s.inner}>{sectionTitleBlock(d.title, d.subtitle)}{body}</div>
    </section>
  );
}
