import { CiShoppingCart, CiMenuBurger, CiSliderHorizontal, CiFilter } from "react-icons/ci";
import { FaOpencart } from "react-icons/fa";
import { BsCart3, BsBagHeart, BsSearchHeart, BsFilterLeft } from "react-icons/bs";
import { BiSolidCart } from "react-icons/bi";
import { PiShoppingCartLight } from "react-icons/pi";
import { SlHandbag } from "react-icons/sl";
import { TfiBag } from "react-icons/tfi";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { IoBagOutline, IoSearchSharp, IoSearch, IoMenuOutline, IoFilter, IoFilterOutline } from "react-icons/io5";
import { FcSearch } from "react-icons/fc";
import { MdImagesearchRoller, MdOutlineFilterAlt } from "react-icons/md";
import { LuSearchCode } from "react-icons/lu";
import { RiSearchEyeLine, RiMenu4Line } from "react-icons/ri";
import { AiOutlineMenu } from "react-icons/ai";
import { RxHamburgerMenu } from "react-icons/rx";
import { GiHamburgerMenu } from "react-icons/gi";

export const icons = {
    cart: [
        { id: "CiShoppingCart", icon: CiShoppingCart, code: 'ci' },
        { id: "FaOpencart", icon: FaOpencart, code: 'fa' },
        { id: "BsCart3", icon: BsCart3, code: 'bs' },
        { id: "BsBagHeart", icon: BsBagHeart, code: 'bs' },
        { id: "BiSolidCart", icon: BiSolidCart, code: 'bi' },
        { id: "PiShoppingCartLight", icon: PiShoppingCartLight, code: 'pi' },
        { id: "SlHandbag", icon: SlHandbag, code: 'sl' },
        { id: "TfiBag", icon: TfiBag, code: 'tfi' },
        { id: "HiOutlineShoppingBag", icon: HiOutlineShoppingBag, code: 'hi' },
        { id: "IoBagOutline", icon: IoBagOutline, code: 'io' }
    ],
    search: [
        { id: "IoSearchSharp", icon: IoSearchSharp, code: 'io' },
        { id: "IoSearch", icon: IoSearch, code: 'io' },
        { id: "BsSearchHeart", icon: BsSearchHeart, code: 'bs' },
        { id: "FcSearch", icon: FcSearch, code: 'fc' },
        { id: "MdImagesearchRoller", icon: MdImagesearchRoller, code: 'md' },
        { id: "LuSearchCode", icon: LuSearchCode, code: 'lu' },
        { id: "RiSearchEyeLine", icon: RiSearchEyeLine, code: 'ri' }
    ],
    menu: [
        { id: "CiMenuBurger", icon: CiMenuBurger, code: 'ci' },
        { id: "AiOutlineMenu", icon: AiOutlineMenu, code: 'ai' },
        { id: "RiMenu4Line", icon: RiMenu4Line, code: 'ri' },
        { id: "RxHamburgerMenu", icon: RxHamburgerMenu, code: 'rx' },
        { id: "GiHamburgerMenu", icon: GiHamburgerMenu, code: 'gi' },
        { id: "IoMenuOutline", icon: IoMenuOutline, code: 'io' }
    ],
    filter: [
        { id: "CiSliderHorizontal", icon: CiSliderHorizontal, code: 'ci' },
        { id: "CiFilter", icon: CiFilter, code: 'ci' },
        { id: "IoFilter", icon: IoFilter, code: 'io' },
        { id: "MdOutlineFilterAlt", icon: MdOutlineFilterAlt, code: 'md' },
        { id: "BsFilterLeft", icon: BsFilterLeft, code: 'bs' },
        { id: "IoFilterOutline", icon: IoFilterOutline, code: 'io' }
    ]
};
