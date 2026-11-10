'use client';
import { useState } from 'react';
import { FiHeart, FiUser, FiMenu } from 'react-icons/fi';
import { IoSearch } from 'react-icons/io5';
import { HiOutlineShoppingBag } from 'react-icons/hi2';
import { useSf } from './ctx';
import { Block, SfLink, cx } from './parts';
import { HEADER_ICON_MAP } from './icons';
import { readableOn } from '../lib/utils';
import s from './chrome.module.css';

export function BrandLogo({ brand, header }) {
  const mode = header.logoMode || 'both';
  const showImg = (mode === 'image' || mode === 'both') && brand.logo;
  const showText = mode === 'text' || mode === 'both' || !brand.logo;
  const initial = (brand.name || 'S').trim().charAt(0).toUpperCase();
  return (
    <>
      {showImg ? <img src={brand.logo} alt={brand.name} draggable={false} /> : mode !== 'text' ? <span className={s.logoMark}>{initial}</span> : null}
      {showText && <span className={s.logoText}>{brand.name}</span>}
    </>
  );
}

export default function Header({ data, brand, categories }) {
  const [open, setOpen] = useState(false);
  if (!data.enabled) return null;

  const Menu = HEADER_ICON_MAP[data.menuIcon] || FiMenu;
  const SearchIcon = HEADER_ICON_MAP[data.search?.icon] || IoSearch;
  const CartIcon = HEADER_ICON_MAP[data.cart?.icon] || HiOutlineShoppingBag;

  const nav = data.navSource === 'categories'
    ? categories.filter((c) => c.visible !== false).map((c) => ({ id: c.id, label: c.name, link: { type: 'category', value: c.id } }))
    : data.nav || [];

  const style = { '--logo-h': `${data.logoHeight || 36}px` };
  if (data.bg) {
    style['--sf-hd-bg'] = data.bg;
    style['--sf-hd-color'] = data.color || readableOn(data.bg);
  } else if (data.color) style['--sf-hd-color'] = data.color;

  const cls = cx(
    s.header, s[data.layout] || s.classic,
    data.background === 'blur' && s.hdBlur, data.background === 'transparent' && s.hdTransparent,
    data.border === 'line' && s.bLine, data.border === 'shadow' && s.bShadow,
    data.height === 'compact' ? s.hCompact : data.height === 'tall' ? s.hTall : s.hRegular
  );

  return (
    <Block target={{ type: 'header' }} label="Header & app bar" sticky={data.sticky}>
      <header className={cls} style={style}>
        <div className={s.bar}>
          <button type="button" className={s.menuBtn} aria-label="Menu" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}><Menu /></button>
          <SfLink link={{ type: 'home' }} className={s.logo}><BrandLogo brand={brand} header={data} /></SfLink>
          <nav className={s.nav}>
            {nav.map((n) => <SfLink key={n.id} link={n.link} className={s.navLink}>{n.label}</SfLink>)}
          </nav>
          {data.search?.enabled && (
            <div className={cx(s.search, data.search.style === 'box' && s.searchBox, data.search.style === 'underline' && s.searchUnderline)}>
              <SearchIcon className={s.searchIcon} />
              <input readOnly tabIndex={-1} placeholder={data.search.placeholder || 'Search…'} />
            </div>
          )}
          <div className={s.actions}>
            {data.wishlist?.enabled && <button type="button" className={cx(s.iconBtn, s.hideMobile)} aria-label="Wishlist"><FiHeart /></button>}
            {data.account?.enabled && <button type="button" className={cx(s.iconBtn, s.hideMobile)} aria-label="Account"><FiUser /></button>}
            {data.cart?.enabled && (
              <button type="button" className={s.iconBtn} aria-label="Cart"><CartIcon /><span className={s.badge}>2</span></button>
            )}
          </div>
        </div>
        <div className={cx(s.mobileMenu, open && s.open)}>
          {nav.map((n) => <SfLink key={n.id} link={n.link}>{n.label}</SfLink>)}
        </div>
      </header>
    </Block>
  );
}
