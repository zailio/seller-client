'use client';
import { TEMPLATES, buildTemplate } from '../lib/templates';
import { PanelHeader, Notice, st } from '../ui/controls';
import { useStudio } from '../ui/context';
import pal from './panels.module.css';

export default function TemplatesPanel({ cfg, edit }) {
  const studio = useStudio();
  const apply = (tpl) => studio.confirm({
    title: `Switch to “${tpl.name}”?`, confirmText: 'Apply template',
    message: <>This replaces your theme, header, footer and page sections. Your <b>shop details, logo and categories</b> are kept. You can undo this right after.</>,
    onConfirm: () => edit((c) => {
      const t = buildTemplate(tpl.id, c.brand);
      c.theme = t.theme; c.header = t.header; c.footer = t.footer; c.announcement = t.announcement; c.sections = t.sections;
      c.header.logoHeight = t.header.logoHeight;
      if (!c.categories.length) c.categories = t.categories;
    }),
  });
  return (
    <>
      <PanelHeader title="Templates" subtitle="A great starting point in one click" />
      <div className={st.panelBody}>
        <Notice>Pick a look, then make it yours — every colour, font, section and link stays fully editable.</Notice>
        {TEMPLATES.map((t) => (
          <button key={t.id} type="button" className={pal.tpl} onClick={() => apply(t)}>
            <div className={pal.tplArt} style={{ background: t.colors[2] }}>
              <i style={{ background: t.colors[0] }} /><i style={{ background: t.colors[1] }} /><i style={{ background: t.colors[3], opacity: 0.85 }} />
            </div>
            <div className={pal.tplBody}>
              <span className={pal.tplName}>{t.name}</span>
              <span className={pal.tplTag}>{t.tagline}</span>
              <span className={pal.tplTags}>{t.tags.map((x) => <span key={x} className={st.pill}>{x}</span>)}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
