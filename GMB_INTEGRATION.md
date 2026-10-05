# GMB AI Cloud integration

Lets GMB AI Cloud tenants build, edit, publish and delete websites for their GMB clients
without logging into this builder.

## Setup
1. `backend/.env` - add a long random key (`openssl rand -hex 32`):
   ```
   INTEGRATION_KEY=<random>
   ```
2. Restart the backend (CORS already allows *.hovermedia.in).
3. Rebuild + deploy `employee-panel` (it now accepts `?sso_token=` on any URL).
4. GMB AI Cloud: Admin -> Integrations -> Website Builder
   - API base URL: `https://webgmbapi.hovermedia.in/api`
   - Panel URL: where employee-panel is hosted (e.g. `https://gmbemployee.hovermedia.in`)
   - Integration key: same `INTEGRATION_KEY` -> Save -> Test.

## How it works
- Each GMB tenant = one employee user here (`gmb-tenant-<id>@gmb.integration`, random password,
  auto-created). Employees only see their own clients/websites, so tenants stay isolated.
- Each GMB client = one client here (`externalRef = gmb:<tenantId>:<clientId>`).
- Create / Edit in GMB gets a 12-hour token from `POST /api/integration/sso` and opens the panel at
  `/websites/new?clientId=...&sso_token=...` or `/websites/<id>?sso_token=...`.
- Publish / unpublish / delete are server-to-server calls.

## Endpoints (header `x-integration-key` required)
| Method | Path | Body / query |
|---|---|---|
| POST | /api/integration/sso | tenantId, tenantName |
| POST | /api/integration/clients/upsert | tenantId, tenantName, externalClientId, name, businessName, phone, email, notes |
| GET | /api/integration/clients/:externalClientId | ?tenantId= |
| GET | /api/integration/themes | - |
| GET | /api/integration/slug | ?slug= |
| POST | /api/integration/websites | tenantId, externalClientId, themeId, slug, prefill (creates + fills from GMB) |
| PUT | /api/integration/websites/:id/prefill | tenantId, prefill, mode ("fill" = empty fields only, "overwrite") |
| PATCH | /api/integration/websites/:id/publish | tenantId, live |
| DELETE | /api/integration/websites/:id | ?tenantId= |

Changed: `backend/app.js`, `backend/config/env.js`, `backend/models/client.model.js`,
`backend/controllers/integration.controller.js` (new), `backend/routes/integration.routes.js` (new),
`employee-panel/src/main.jsx`, `employee-panel/src/pages/NewWebsite.jsx`.

## Embedded mode (inside the GMB panel)
GMB opens the panel in an iframe at `/gmb/<id>/website` with `?embed=1&sso_token=...`.
`embed=1` hides this panel's sidebar for that browser tab (sessionStorage), and an expired session shows
"reload from the GMB panel" instead of the login page.

Hosting: the employee-panel must be frameable by the GMB domain - do NOT send `X-Frame-Options: DENY/SAMEORIGIN`
for it. If you use CSP, add: `Content-Security-Policy: frame-ancestors 'self' https://<your-gmb-domain>`.
Nginx example (remove any add_header X-Frame-Options line for this site):
```
add_header Content-Security-Policy "frame-ancestors 'self' https://gmb.yourdomain.com" always;
```
Changed for embed: `employee-panel/src/main.jsx`, `employee-panel/src/components/Layout.jsx`.

## Auto-fill from Google
`applyPrefill()` writes GMB data into the website document (basicInfo, heroSlides, about, services, reviews,
contact, footer.socialLinks, seo). For multi-page sites `applyMultiPrefill()` rewrites the seeded Home / About /
Services sections with real data and removes made-up starter numbers. Images are Google photo URLs
(`publicId: null`, so delete-website skips Cloudinary for them).

## AI images (mode "images")
`PUT /api/integration/websites/:id/prefill` with `{ tenantId, mode: "images", images: { hero: [url], about: url,
services: { "<service title>": url } } }` sets only images (hero slides, about image, matching services, og image,
and the home hero / about / services sections of multi-page sites). Text and other edits are untouched.
