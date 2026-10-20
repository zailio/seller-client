'use client';
import { useEffect, useState } from 'react';
import { FiTruck } from 'react-icons/fi';
import { SfLink, Media, Stars, cx, seedOf, sectionTitleBlock } from './parts';
import { FEATURE_ICON_MAP } from './icons';
import s from './sections.module.css';
import b from './base.module.css';

const toneCls = { primary: s.tonePrimary, accent: s.toneAccent, dark: s.toneDark, surface: s.toneSurface };
const btnForTone = (tone) => (tone === 'accent' ? b.btnAccent : tone === 'surface' ? '' : b.btnLight);

export function BannerSection({ section }) {
  const d = section.settings;
  const hCls = d.height === 'sm' ? s.bnSm : d.height === 'lg' ? s.bnLg : s.bnMd;
  const text = (
    <>
      {d.eyebrow ? <span className={cx(s.eyebrow, d.style === 'split' && s.eyebrowDark)}>{d.eyebrow}</span> : null}
      {d.title ? <h2 className={s.bnTitle}>{d.title}</h2> : null}
      {d.subtitle ? <p className={s.bnSub}>{d.subtitle}</p> : null}
      {d.cta ? <SfLink link={d.link} className={cx(b.btn, d.style === 'split' ? '' : btnForTone(d.tone))}>{d.cta}</SfLink> : null}
    </>
  );

  if (d.style === 'split') {
    return (
      <section className={s.bnWrap}>
        <div className={s.inner}>
          <div className={cx(s.bn, s.bnSplit, hCls)}>
            <Media className={s.bnSplitMedia} src={d.image} seed={seedOf(section.id)} />
            <div className={s.bnSplitBody}>{text}</div>
          </div>
        </div>
      </section>
    );
  }
  const card = (
    <div className={cx(s.bn, d.style === 'full' && s.bnFull, toneCls[d.tone] || s.tonePrimary, hCls)}>
      {d.image ? <div className={s.bnBg}><img src={d.image} alt="" draggable={false} /></div> : null}
      <div className={s.bnBody}>{text}</div>
    </div>
  );
  return (
    <section className={d.style === 'full' ? undefined : s.bnWrap} style={d.style === 'full' ? { padding: 'calc(var(--sf-section-y) * .6) 0' } : undefined}>
      {d.style === 'full' ? card : <div className={s.inner}>{card}</div>}
    </section>
  );
}

function useCountdown(endsAt) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = endsAt ? new Date(endsAt).getTime() : 0;
  const diff = Math.max(0, end - now);
  const sec = Math.floor(diff / 1000);
  return { ended: !!end && diff === 0, d: Math.floor(sec / 86400), h: Math.floor((sec % 86400) / 3600), m: Math.floor((sec % 3600) / 60), s: sec % 60 };
}

export function CountdownSection({ section }) {
  const d = section.settings;
  const t = useCountdown(d.endsAt);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <section className={s.bnWrap}>
      <div className={s.inner}>
        <div className={cx(s.cd, toneCls[d.tone] || s.toneDark)}>
          <div className={s.cdText}>
            <h2 className={s.cdTitle}>{d.title}</h2>
            {d.subtitle ? <p style={{ opacity: 0.88 }}>{d.subtitle}</p> : null}
          </div>
          <div className={s.cdRight}>
            {t.ended ? <span className={s.cdEnded}>This sale has ended</span> : (
              <div className={s.cdBoxes}>
                {[['d', 'Days'], ['h', 'Hours'], ['m', 'Mins'], ['s', 'Secs']].map(([k, l]) => (
                  <div key={k} className={s.cdBox}><span className={s.cdNum}>{pad(t[k])}</span><span className={s.cdLabel}>{l}</span></div>
                ))}
              </div>
            )}
            {d.cta ? <SfLink link={d.link} className={cx(b.btn, btnForTone(d.tone))}>{d.cta}</SfLink> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection({ section }) {
  const d = section.settings;
  const items = d.items || [];
  if (!items.length) return null;
  return (
    <section className={cx(d.style !== 'cards' && s.fBand)} style={{ padding: 'calc(var(--sf-section-y) * .55) 0' }}>
      <div className={s.inner}>
        <div className={cx(s.fRow, d.style === 'cards' && s.fCards)}>
          {items.map((it) => {
            const Icon = FEATURE_ICON_MAP[it.icon] || FiTruck;
            return (
              <div key={it.id} className={s.fItem}>
                <span className={s.fIcon}><Icon /></span>
                <div><div className={s.fTitle}>{it.title}</div>{it.text ? <div className={s.fText}>{it.text}</div> : null}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TextSection({ section }) {
  const d = section.settings;
  const paragraphs = String(d.body || '').split(/\n{2,}/).filter(Boolean);
  const hasImage = d.layout === 'image-left' || d.layout === 'image-right';
  const center = !hasImage && d.align === 'center';
  const body = (
    <div className={cx(s.storyBody, center && s.storyCenter)}>
      {d.eyebrow ? <span className={s.eyebrowPlain}>{d.eyebrow}</span> : null}
      {d.heading ? <h2 className={s.storyHeading}>{d.heading}</h2> : null}
      {paragraphs.map((p, i) => <p key={i} className={s.storyP}>{p}</p>)}
      {d.cta ? <SfLink link={d.link} className={b.btn} style={{ marginTop: 6 }}>{d.cta}</SfLink> : null}
    </div>
  );
  const img = <Media className={s.storyImg} src={d.image} seed={seedOf(section.id)} />;
  return (
    <section className={s.pad}>
      <div className={s.inner}>
        {hasImage ? <div className={cx(s.story, s.storyTwo)}>{d.layout === 'image-left' ? <>{img}{body}</> : <>{body}{img}</>}</div> : body}
      </div>
    </section>
  );
}

export function TestimonialsSection({ section }) {
  const d = section.settings;
  const items = d.items || [];
  const [i, setI] = useState(0);
  if (!items.length) return null;
  const cur = items[Math.min(i, items.length - 1)];
  return (
    <section className={s.pad}>
      <div className={s.inner}>
        {sectionTitleBlock(d.title, null)}
        {d.style === 'quote' ? (
          <div className={s.qBig}>
            <span className={s.qMark}>“</span>
            <p className={s.qText}>{cur.quote}</p>
            <Stars value={cur.rating} />
            <div><div className={s.tName}>{cur.name}</div><div className={s.tRole}>{cur.role}</div></div>
            {items.length > 1 && (
              <div className={s.qDots}>
                {items.map((it, k) => <button key={it.id} type="button" aria-label={`Review ${k + 1}`} className={cx(s.qDot, k === i && s.qDotOn)} onClick={(e) => { e.stopPropagation(); setI(k); }} />)}
              </div>
            )}
          </div>
        ) : (
          <div className={s.tGrid}>
            {items.map((it) => (
              <div key={it.id} className={s.tCard}>
                <Stars value={it.rating} />
                <p className={s.tQuote}>{it.quote}</p>
                <div className={s.tWho}>
                  <span className={s.tAvatar}>{it.avatar ? <img src={it.avatar} alt="" draggable={false} /> : (it.name || '?').charAt(0)}</span>
                  <div><div className={s.tName}>{it.name}</div><div className={s.tRole}>{it.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function SpacerSection({ section }) {
  const d = section.settings;
  return (
    <div style={{ height: Number(d.height) || 40, display: 'flex', alignItems: 'center' }}>
      {d.line ? <div className={s.spacerLine} style={{ width: '100%' }} /> : null}
    </div>
  );
}
