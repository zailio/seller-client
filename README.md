# Zailio Seller

Standalone seller panel for the Zailio marketplace (Next.js 16 · React 19 · CSS Modules), now with **Storefront Studio** — a visual, fully customizable shop home page builder.

## Run
```bash
cp .env.example .env.local     # set NEXT_PUBLIC_SERVER_URL, NEXT_PUBLIC_WS_URL, ...
npm install
npm run dev                    # http://localhost:3001
```
No backend yet? Set `NEXT_PUBLIC_DEMO=1` — a fake seller session is used, the WebSocket is disabled, and Storefront Studio saves to your browser (localStorage).

## Storefront Studio (sidebar → "Storefront Studio")
- **Page** – reorder / hide / duplicate / delete sections; click anything on the live preview to edit it. Announcement bar, header & app bar (3 layouts), hero slider, offers, categories, products (auto or hand-picked), banners, countdown, features, text, testimonials, footer (3 layouts, links, socials, payment badges).
- **Theme** – 12 palettes, custom colours with contrast checks, 8 font pairs, corner radius, density.
- **Shop** – logo, name, tagline, favicon, SEO.
- **Categories** – your own custom categories with icon/image, product assignment and ordering.
- **Templates** – 6 starting looks (Aurora, Boutique, Midnight, Fresh, Bold, Luxe).
- Desktop / tablet / mobile preview, undo / redo (Ctrl+Z / Ctrl+Shift+Z), autosave drafts, Ctrl+S, full-screen preview, Publish.

The config is one JSON document (see `app/seller/storefront/lib/schema.js`). The renderer in `app/seller/storefront/renderer/` has no seller-panel dependencies — copy it into the customer app to render published shops. Backend contract: `docs/BACKEND_API.md`.

## Other
- `npm run build:obfuscated` builds with JS obfuscation (`OBFUSCATE=1`).
- `/` is rewritten to `/seller`.
