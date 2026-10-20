# Storefront backend contract

All requests: `POST`, header `Authorization: Bearer <auth>`, JSON body containing `session_id`. Base URL = `NEXT_PUBLIC_SERVER_URL`. Until these exist the Studio falls back to local (browser) mode automatically.

| Endpoint | Body | Response `data` |
|---|---|---|
| `/seller/storefront/get` | `{session_id}` | `{status, draft, published, updatedAt, publishedAt}` (`draft: null` if none yet) |
| `/seller/storefront/save` | `{session_id, config}` | `{updatedAt}` — store as draft |
| `/seller/storefront/publish` | `{session_id, config}` | `{updatedAt, publishedAt}` — store as draft **and** published |
| `/api/get_url` (existing) | image upload | `{url}` |

`config` is the schema-v1 JSON (`theme, brand, announcement, header, sections[], categories[], footer, seo, catalog`). Treat it as untrusted: validate size (<1 MB), reject `javascript:` URLs, and only serve `published` to customers. `catalog` holds snapshots of hand-picked products so the customer app can render without extra lookups.
