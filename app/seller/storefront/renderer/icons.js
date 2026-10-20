import { icons as headerIcons } from '../../../../utils/icons';
import { FiTruck, FiShield, FiRefreshCw, FiHeadphones, FiGift, FiHeart, FiStar, FiTag, FiClock, FiAward, FiZap, FiGlobe } from 'react-icons/fi';
import { LuLeaf } from 'react-icons/lu';
import { FaInstagram, FaFacebookF, FaXTwitter, FaYoutube, FaWhatsapp, FaTelegram, FaLinkedinIn, FaPinterestP } from 'react-icons/fa6';

/** header icon id (see utils/icons.js) -> component */
export const HEADER_ICON_MAP = Object.fromEntries(Object.values(headerIcons).flat().map((i) => [i.id, i.icon]));

export const FEATURE_ICON_MAP = {
  truck: FiTruck, shield: FiShield, refresh: FiRefreshCw, headset: FiHeadphones, gift: FiGift, heart: FiHeart,
  star: FiStar, tag: FiTag, clock: FiClock, leaf: LuLeaf, award: FiAward, zap: FiZap,
};

export const SOCIAL_ICON_MAP = {
  instagram: FaInstagram, facebook: FaFacebookF, x: FaXTwitter, youtube: FaYoutube, whatsapp: FaWhatsapp,
  telegram: FaTelegram, linkedin: FaLinkedinIn, pinterest: FaPinterestP, website: FiGlobe,
};

export { headerIcons };
