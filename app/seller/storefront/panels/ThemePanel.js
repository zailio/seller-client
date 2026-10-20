'use client';
import { FiDroplet, FiType, FiSquare, FiMaximize2 } from 'react-icons/fi';
import { PALETTES, FONT_PAIRS, RADII, DENSITY, getFontPair, fontHref } from '../lib/themes';
import { contrastRatio } from '../lib/utils';
import { ColorField, Group, Segmented, OptionCards, PanelHeader, Notice, Field, st, cx } from '../ui/controls';
import { makeBind } from './bind';
import pal from './panels.module.css';

export default function ThemePanel({ cfg, edit }) {
  const b = makeBind(cfg, edit);
  const t = cfg.theme;
  const applyPalette = (p) => edit((c) => { Object.assign(c.theme, { palette: p.id, primary: p.primary, accent: p.accent, background: p.background, surface: p.surface, text: p.text, muted: p.muted }); });
  const ratio = contrastRatio(t.text, t.background);
  const setTheme = (key) => (v) => edit((c) => { c.theme[key] = v; c.theme.palette = key.match(/^(primary|accent|background|surface|text|muted)$/) ? 'custom' : c.theme.palette; }, `theme.${key}`);

  return (
    <>
      <PanelHeader title="Theme" subtitle="Colours, fonts and overall feel" />
      <div className={st.panelBody}>
        <Group title="Colour palette" icon={<FiDroplet />} defaultOpen>
          <div className={pal.palettes}>
            {PALETTES.map((p) => (
              <button key={p.id} type="button" className={cx(pal.palette, t.palette === p.id && pal.paletteOn)} onClick={() => applyPalette(p)} title={p.name}>
                <span className={pal.chips} style={{ background: p.background }}>
                  <i style={{ background: p.primary }} /><i style={{ background: p.accent }} /><i style={{ background: p.surface }} /><i style={{ background: p.text }} />
                </span>
                <span className={pal.paletteName}>{p.name}</span>
              </button>
            ))}
          </div>
        </Group>

        <Group title="Custom colours" icon={<FiDroplet />}>
          <ColorField label="Primary (buttons, links)" value={t.primary} onChange={setTheme('primary')} />
          <ColorField label="Accent (badges, highlights)" value={t.accent} onChange={setTheme('accent')} />
          <ColorField label="Page background" value={t.background} onChange={setTheme('background')} />
          <ColorField label="Surface (cards, bands)" value={t.surface} onChange={setTheme('surface')} />
          <ColorField label="Text" value={t.text} onChange={setTheme('text')} />
          <ColorField label="Muted text" value={t.muted} onChange={setTheme('muted')} />
          {ratio < 4.5 && <Notice tone="warn">Text and background contrast is low ({ratio.toFixed(1)}:1). Aim for at least 4.5:1 so everyone can read your shop.</Notice>}
        </Group>

        <Group title="Typography" icon={<FiType />}>
          <link rel="stylesheet" href={fontHref({ fonts: 'modern' })} />
          {FONT_PAIRS.map((f) => <link key={f.id} rel="stylesheet" href={fontHref({ fonts: f.id })} />)}
          <div className={pal.fonts}>
            {FONT_PAIRS.map((f) => (
              <button key={f.id} type="button" className={cx(pal.font, t.fonts === f.id && pal.fontOn)} onClick={() => edit((c) => { c.theme.fonts = f.id; })}>
                <span className={pal.fontSample} style={{ fontFamily: `'${f.heading}', serif` }}>Aa</span>
                <span className={pal.fontMeta}><b>{f.name}</b><small style={{ fontFamily: `'${f.body}', sans-serif` }}>{f.heading} + {f.body}</small></span>
              </button>
            ))}
          </div>
        </Group>

        <Group title="Shape & spacing" icon={<FiSquare />}>
          <OptionCards label="Corner style" cols={4} value={t.radius} onChange={(v) => edit((c) => { c.theme.radius = v; })}
            options={Object.entries(RADII).map(([id, r]) => ({ id, label: r.label, thumb: <span className={pal.corner} style={{ borderRadius: r.md }} /> }))} />
          <Segmented label="Section spacing" value={t.density} onChange={(v) => edit((c) => { c.theme.density = v; })}
            options={Object.entries(DENSITY).map(([id, d]) => ({ id, label: d.label }))} />
          <Segmented label="Button style" value={t.buttonStyle} onChange={(v) => edit((c) => { c.theme.buttonStyle = v; })}
            options={[{ id: 'solid', label: 'Solid' }, { id: 'outline', label: 'Outline' }, { id: 'soft', label: 'Soft' }]} />
        </Group>
      </div>
    </>
  );
}
