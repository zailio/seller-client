'use client';
import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { useSf } from './ctx';
import { Block, SfLink } from './parts';
import s from './chrome.module.css';

export default function Announcement({ data }) {
  const { editor } = useSf();
  const items = (data.items || []).filter((i) => i.text);
  const [idx, setIdx] = useState(0);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (editor || data.style !== 'rotate' || items.length < 2) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 4200);
    return () => clearInterval(t);
  }, [editor, data.style, items.length]);

  if (!data.enabled || !items.length) return null;
  if (closed && !editor) return null;

  const focusIdx = editor?.focus?.type === 'announcement' ? items.findIndex((i) => i.id === editor.focus.itemId) : -1;
  const current = items[focusIdx >= 0 ? focusIdx : idx % items.length];

  return (
    <Block target={{ type: 'announcement' }} label="Announcement bar">
      <div className={s.announce} style={{ background: data.bg, color: data.color }}>
        {data.style === 'marquee' ? (
          <div className={s.marquee}>
            {[0, 1].map((k) => (
              <div className={s.marqueeRow} key={k} aria-hidden={k === 1}>
                {[...items, ...items].map((it, i) => (
                  <span key={`${it.id}-${i}`}><SfLink link={it.link}>{it.text}</SfLink></span>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className={s.announceItem} key={current.id}><SfLink link={current.link}>{current.text}</SfLink></div>
        )}
        {data.dismissible && (
          <button type="button" className={s.announceClose} aria-label="Dismiss" onClick={() => setClosed(true)}><FiX /></button>
        )}
      </div>
    </Block>
  );
}
