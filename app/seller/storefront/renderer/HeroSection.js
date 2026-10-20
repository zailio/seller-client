'use client';
import { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useSf } from './ctx';
import { SfLink, cx } from './parts';
import s from './sections.module.css';
import b from './base.module.css';

const grads = [s.gradA, s.gradB, s.gradC];
const alignCls = { left: s.alignLeft, center: s.alignCenter, right: s.alignRight };

function Slide({ slide, i, active, split }) {
  const hasImg = !!slide.image;
  const tone = slide.tone === 'dark' ? 'dark' : slide.tone === 'light' ? 'light' : hasImg ? 'light' : 'auto';
  const color = tone === 'dark' ? '#0f172a' : tone === 'light' ? '#fff' : 'var(--sf-on-primary)';
  const body = (
    <div className={cx(s.slideText, active && s.slideAnim)} style={{ color: split ? undefined : color }}>
      {slide.eyebrow ? <span className={cx(s.eyebrow, (split || tone === 'dark') && s.eyebrowDark)}>{slide.eyebrow}</span> : null}
      {slide.title ? <h1 className={s.slideTitle}>{slide.title}</h1> : null}
      {slide.subtitle ? <p className={s.slideSub}>{slide.subtitle}</p> : null}
      {slide.cta ? <SfLink link={slide.ctaLink} className={cx(b.btn, !split && tone !== 'dark' && b.btnLight)}>{slide.cta}</SfLink> : null}
    </div>
  );

  if (split) {
    return (
      <div className={cx(s.slide, active && s.slideOn)} aria-hidden={!active}>
        <div className={s.split}>
          <div className={s.splitText}>{body}</div>
          <div className={cx(s.splitMedia, !hasImg && grads[i % 3])}>{hasImg ? <img src={slide.image} alt="" draggable={false} /> : null}</div>
        </div>
      </div>
    );
  }
  return (
    <div className={cx(s.slide, active && s.slideOn)} aria-hidden={!active}>
      <div className={cx(s.slideBg, !hasImg && grads[i % 3])}>{hasImg ? <img src={slide.image} alt="" draggable={false} /> : null}</div>
      {hasImg && slide.overlay > 0 ? <div className={s.shade} style={{ opacity: slide.overlay / 100 }} /> : null}
      <div className={cx(s.slideContent, alignCls[slide.align] || s.alignLeft)}>{body}</div>
    </div>
  );
}

export default function HeroSection({ section }) {
  const { editor } = useSf();
  const d = section.settings;
  const slides = d.slides || [];
  const [idx, setIdx] = useState(0);

  const focusIdx = editor?.focus?.sectionId === section.id ? slides.findIndex((x) => x.id === editor.focus.slideId) : -1;
  const current = focusIdx >= 0 ? focusIdx : Math.min(idx, Math.max(0, slides.length - 1));

  useEffect(() => {
    if (editor || !d.autoplay || slides.length < 2) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), Math.max(2, d.interval || 5) * 1000);
    return () => clearInterval(t);
  }, [editor, d.autoplay, d.interval, slides.length]);

  if (!slides.length) return null;
  const hCls = d.height === 'sm' ? s.hSm : d.height === 'lg' ? s.hLg : s.hMd;

  return (
    <section className={cx(s.hero, hCls)}>
      <div className={s.slides}>
        {slides.map((sl, i) => <Slide key={sl.id} slide={sl} i={i} active={i === current} split={d.layout === 'split'} />)}
      </div>
      {slides.length > 1 && d.arrows && (
        <>
          <button type="button" className={cx(s.arrow, s.prev)} aria-label="Previous" onClick={(e) => { e.stopPropagation(); setIdx((current - 1 + slides.length) % slides.length); }}><FiChevronLeft /></button>
          <button type="button" className={cx(s.arrow, s.next)} aria-label="Next" onClick={(e) => { e.stopPropagation(); setIdx((current + 1) % slides.length); }}><FiChevronRight /></button>
        </>
      )}
      {slides.length > 1 && d.dots && (
        <div className={s.dots}>
          {slides.map((sl, i) => <button key={sl.id} type="button" aria-label={`Slide ${i + 1}`} className={cx(s.dot, i === current && s.dotOn)} onClick={(e) => { e.stopPropagation(); setIdx(i); }} />)}
        </div>
      )}
    </section>
  );
}
