'use client';
import { FiShoppingBag, FiMail, FiPhone, FiMapPin, FiClock, FiSearch, FiSun } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Text, Area, ImageField, Group, Toggle, PanelHeader, Notice, st } from '../ui/controls';
import { makeBind } from './bind';

export default function BrandPanel({ cfg, edit }) {
  const b = makeBind(cfg, edit);
  return (
    <>
      <PanelHeader title="Shop details" subtitle="Your brand, contact info and SEO" />
      <div className={st.panelBody}>
        <Group title="Brand & logo" icon={<FiShoppingBag />} defaultOpen>
          <Text label="Shop name" icon={FiShoppingBag} maxLength={40} {...b('brand.name')} />
          <Text label="Tagline" placeholder="A short line under your name" maxLength={80} {...b('brand.tagline')} />
          <ImageField label="Logo" shape="square" contain recommended="Square or wide PNG with transparent background" {...b('brand.logo')} />
          <ImageField label="Favicon" shape="square" contain recommended="Small square icon, 64×64 or larger" {...b('brand.favicon')} />
          <Area label="About your shop" rows={4} maxLength={300} placeholder="Shown in the footer and used as the default meta description" {...b('brand.bio')} />
        </Group>

        <Group title="Contact & hours" icon={<FiPhone />}>
          <Text label="Email" type="email" icon={FiMail} placeholder="hello@yourstore.com" {...b('brand.email')} />
          <Text label="Phone" icon={FiPhone} placeholder="+91 98765 43210" {...b('brand.phone')} />
          <Text label="WhatsApp number" icon={FaWhatsapp} placeholder="919876543210" hint="With country code, no + or spaces." {...b('brand.whatsapp')} />
          <Text label="Address" icon={FiMapPin} placeholder="Street, city, state, PIN" {...b('brand.address')} />
          <Text label="Opening hours" icon={FiClock} placeholder="Mon–Sat · 9am – 7pm" {...b('brand.hours')} />
        </Group>

        <Group title="Vacation mode" icon={<FiSun />}>
          <Toggle label="Show a notice bar" hint="Let customers know you are away." checked={!!cfg.brand.vacation?.enabled} onChange={(v) => edit((c) => { c.brand.vacation.enabled = v; })} />
          {cfg.brand.vacation?.enabled && <Text label="Message" maxLength={120} {...b('brand.vacation.message')} />}
        </Group>

        <Group title="Search engines (SEO)" icon={<FiSearch />}>
          <Text label="Page title" maxLength={60} placeholder={cfg.brand.name} {...b('seo.title')} />
          <Area label="Description" rows={3} maxLength={160} placeholder={cfg.brand.bio || 'Describe your shop in one or two sentences'} {...b('seo.description')} />
          <ImageField label="Share image" shape="wide" recommended="1200×630 · shown on WhatsApp, Facebook, X" {...b('seo.image')} />
        </Group>

        <Notice>Business address, GST and store hours used for orders are still managed in the <b>Shop</b> section of the seller panel.</Notice>
      </div>
    </>
  );
}
