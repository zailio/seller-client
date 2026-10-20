'use client';
import { FiHeart, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { useSf } from './ctx';
import { SfLink, Media, cx, seedOf, priceInfo } from './parts';
import { resolveProducts } from './data';
import s from './sections.module.css';
import b from './base.module.css';

function Card({ p, d, i }) {
  const { editor } = useSf();
  const info = priceInfo(p);
  const style = d.cardStyle || 'card';
  const link = p.sample || editor ? { type: 'none' } : { type: 'product', value: p.id };
  return (
    <div className={cx(s.pCard, style === 'card' && s.pCardCard, style === 'minimal' && s.pCardMinimal, style === 'overlay' && s.pCardOverlay)}>
      <SfLink link={link}>
        <Media className={s.pImg} src={p.image} seed={seedOf(p.id) + i}>
          {!p.image ? <div className={s.pImgInner}>{(p.title || '?').charAt(0)}</div> : null}
          {d.showDiscount && info.off > 0 ? <span className={s.pBadge}>{info.off}% OFF</span> : null}
          <button type="button" className={s.pHeart} aria-label="Wishlist" onClick={(e) => e.preventDefault()}><FiHeart /></button>
          {p.isAvailable === false ? <div className={s.pSold}>Sold out</div> : null}
        </Media>
      </SfLink>
      <div className={s.pBody}>
        <SfLink link={link} className={s.pTitle}>{p.title}</SfLink>
        <div className={s.pPrice}>
          <span className={s.sell}>{info.sellText}</span>
          {info.mrpText ? <span className={s.mrp}>{info.mrpText}</span> : null}
          {style === 'overlay' && info.off > 0 ? <span className={s.off}>{info.off}% off</span> : null}
        </div>
        {d.showAddToCart && style !== 'overlay' ? (
          <button type="button" className={cx(b.btn, b.btnSm, s.addBtn)} onClick={(e) => e.preventDefault()}><FiShoppingBag /> Add to cart</button>
        ) : null}
      </div>
    </div>
  );
}

export default function ProductsSection({ section }) {
  const { config, products } = useSf();
  const d = section.settings;
  const { list } = resolveProducts(d, config, products);
  if (!list.length) return null;
  const cols = Math.min(6, Math.max(1, Number(d.columns) || 4));

  return (
    <section className={s.pad} id={d.source === 'latest' ? 'new' : undefined}>
      <div className={s.inner}>
        {d.title || d.subtitle || d.viewAll?.enabled ? (
          <div className={b.headRow}>
            <div className={b.head}>
              {d.title ? <h2 className={b.title}>{d.title}</h2> : null}
              {d.subtitle ? <p className={b.subtitle}>{d.subtitle}</p> : null}
            </div>
            {d.viewAll?.enabled ? <SfLink link={d.viewAll.link} className={b.viewAll}>{d.viewAll.label || 'View all'} <FiArrowRight /></SfLink> : null}
          </div>
        ) : null}
        <div className={d.layout === 'carousel' ? s.pCar : s.pGrid} data-c={cols}>
          {list.map((p, i) => <Card key={p.id + i} p={p} d={d} i={i} />)}
        </div>
      </div>
    </section>
  );
}
