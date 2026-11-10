# Zailio Seller

Standalone seller panel for the Zailio marketplace (Next.js 16 · React 19 · CSS Modules), now with **Storefront Studio** — a visual, fully customizable shop home page builder.

## Run
```bash
cp .env.example .env.local     # set NEXT_PUBLIC_SERVER_URL, NEXT_PUBLIC_WS_URL, ...
npm install
npm run dev                    # http://localhost:3001
```
No backend yet? Set `NEXT_PUBLIC_DEMO=1` — a fake seller session is used, the WebSocket is disabled, and Storefront Studio saves to your browser (localStorage).

## Three dashboards, one project
| Subdomain | Folder | Account type |
|---|---|---|
| `seller.uniyel.com` | `app/seller/` | `seller` |
| `brand.uniyel.com` | `app/brand/` | `brand` |
| `distributor.uniyel.com` (also `brand-distributor.`) | `app/distributor/` | `brand_distributor` |

`proxy.js` routes each subdomain to its folder (the address bar keeps `/`). On localhost open `/seller`, `/brand` or `/distributor` (or `brand.localhost:3001`). An account opened on the wrong dashboard is shown a link to its own.

```
app/
  seller/ brand/ distributor/   page.js · <Role>App.js (role-only screens) · nav.js (menu) · role-only pages
  _dashboard/                   shared shell: sign-in, sidebar, top bar, notification bell, roles & menu items
  _shared/                      screens every role uses: sales, orders, upload, inventory, products (+feedback),
                                coupons, event offers, settlements, storefront, ui kit (ui/)
```
Folders starting with `_` never become URLs.

## Storefront Studio (sidebar → "Storefront Studio")
- **Page** – reorder / hide / duplicate / delete sections; click anything on the live preview to edit it. Announcement bar, header & app bar (3 layouts), hero slider, offers, categories, products (auto or hand-picked), banners, countdown, features, text, testimonials, footer (3 layouts, links, socials, payment badges).
- **Theme** – 12 palettes, custom colours with contrast checks, 8 font pairs, corner radius, density.
- **Shop** – logo, name, tagline, favicon, SEO.
- **Categories** – your own custom categories with icon/image, product assignment and ordering.
- **Templates** – 6 starting looks (Aurora, Boutique, Midnight, Fresh, Bold, Luxe).
- Desktop / tablet / mobile preview, undo / redo (Ctrl+Z / Ctrl+Shift+Z), autosave drafts, Ctrl+S, full-screen preview, Publish.

The config is one JSON document (see `app/_shared/storefront/lib/schema.js`). The renderer in `app/_shared/storefront/renderer/` has no seller-panel dependencies — copy it into the customer app to render published shops. Backend contract: `docs/BACKEND_API.md`.

## Other
- `npm run build:obfuscated` builds with JS obfuscation (`OBFUSCATE=1`).
- `/` is rewritten to `/seller`.
