'use client';
import { FiMail, FiPhone, FiMapPin, FiClock } from 'react-icons/fi';
import { Block, SfLink, cx } from './parts';
import { BrandLogo } from './Header';
import { SOCIAL_ICON_MAP } from './icons';
import { readableOn } from '../lib/utils';
import s from './chrome.module.css';

function ContactBlock({ brand }) {
  const rows = [
    brand.email && { Icon: FiMail, text: brand.email, href: `mailto:${brand.email}` },
    brand.phone && { Icon: FiPhone, text: brand.phone, href: `tel:${brand.phone.replace(/\s/g, '')}` },
    brand.address && { Icon: FiMapPin, text: brand.address },
    brand.hours && { Icon: FiClock, text: brand.hours },
  ].filter(Boolean);
  if (!rows.length) return null;
  return (
    <div className={s.contact}>
      {rows.map(({ Icon, text, href }) => href ? <a key={text} href={href}><Icon /> {text}</a> : <span key={text}><Icon /> {text}</span>)}
    </div>
  );
}

function Socials({ items }) {
  const list = (items || []).filter((x) => x.url);
  if (!list.length) return null;
  return (
    <div className={s.socials}>
      {list.map((x) => {
        const Icon = SOCIAL_ICON_MAP[x.type] || SOCIAL_ICON_MAP.website;
        return <a key={x.id} href={x.url} className={s.social} target="_blank" rel="noopener noreferrer" aria-label={x.type}><Icon /></a>;
      })}
    </div>
  );
}

export default function Footer({ data, brand }) {
  if (!data.enabled) return null;
  const style = {};
  if (data.bg) {
    style['--sf-ft-bg'] = data.bg;
    style['--sf-ft-color'] = data.color || readableOn(data.bg);
  } else if (data.color) style['--sf-ft-color'] = data.color;

  const copyright = (data.copyright || '').replace('{year}', new Date().getFullYear()).replace('{shop}', brand.name || '');
  const about = data.about || brand.bio;
  const cols = data.columns || [];
  const allLinks = cols.flatMap((c) => c.links || []);

  const bottom = (
    <div className={s.ftBottom}>
      <span>{copyright}</span>
      {data.showPayments && data.payments?.length ? <div className={s.pays}>{data.payments.map((p) => <span key={p} className={s.pay}>{p}</span>)}</div> : null}
      {data.poweredBy && <span className={s.powered}>Powered by <b>Zailio</b></span>}
    </div>
  );

  const newsletter = data.newsletter?.enabled ? (
    <div className={s.newsletter}>
      <div><h3>{data.newsletter.title}</h3><p>{data.newsletter.text}</p></div>
      <div className={s.nlForm}><input readOnly tabIndex={-1} placeholder="Your email address" /><span>{data.newsletter.button || 'Subscribe'}</span></div>
    </div>
  ) : null;

  const brandBlock = (
    <div className={s.ftBrand}>
      {data.showLogo && <div className={s.logo} style={{ '--logo-h': '34px' }}><BrandLogo brand={brand} header={{ logoMode: 'both' }} /></div>}
      {about ? <p className={s.ftAbout}>{about}</p> : null}
      <Socials items={data.socials} />
      {data.contact?.show && <ContactBlock brand={brand} />}
    </div>
  );

  let body;
  if (data.layout === 'centered') {
    body = (<>{newsletter}{brandBlock}<div className={s.ftNavRow}>{allLinks.map((l) => <SfLink key={l.id} link={l.link}>{l.label}</SfLink>)}</div>{bottom}</>);
  } else if (data.layout === 'minimal') {
    body = (
      <>
        <div className={s.ftRow}>
          <div className={s.logo} style={{ '--logo-h': '30px' }}><BrandLogo brand={brand} header={{ logoMode: 'both' }} /></div>
          <div className={s.ftNavRow}>{allLinks.map((l) => <SfLink key={l.id} link={l.link}>{l.label}</SfLink>)}</div>
          <Socials items={data.socials} />
        </div>
        {bottom}
      </>
    );
  } else {
    body = (
      <>
        {newsletter}
        <div className={s.ftGrid} style={{ '--cols': Math.max(1, cols.length) }}>
          {brandBlock}
          {cols.map((c) => (
            <div key={c.id}>
              <h4 className={s.ftTitle}>{c.title}</h4>
              <div className={s.ftLinks}>{(c.links || []).map((l) => <SfLink key={l.id} link={l.link}>{l.label}</SfLink>)}</div>
            </div>
          ))}
        </div>
        {bottom}
      </>
    );
  }

  return (
    <Block target={{ type: 'footer' }} label="Footer">
      <footer className={cx(s.footer, data.layout === 'centered' && s.ftCentered, data.layout === 'minimal' && s.ftMinimal)} style={style}>
        <div className={s.ftInner}>{body}</div>
      </footer>
    </Block>
  );
}
