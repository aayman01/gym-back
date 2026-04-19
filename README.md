# E-commerce / catalog API (NestJS)

Backend for a **real catalog and storefront**: separate **admin (back-office)** and **public (storefront)** APIs, cookie-based admin sessions with refresh tokens, CSRF on mutating admin requests, guest-aware cart/wishlist, and a modular product domain (variants, attributes, taxes, shipping, media, gallery).

This is intentionally more than a thin CRUD layer: validation, rate limiting, security headers, structured errors, and a split data model you can extend toward orders, inventory, and returns (see `prisma/schema/`).

---

## Why this isn’t “just a simple e-commerce site”

| Area | What the backend actually does |
|------|--------------------------------|
| **Boundaries** | Admin vs public modules with different trust models (`src/api/admin/*`, `src/api/public/*`). |
| **Admin auth** | JWT access + refresh in **HttpOnly cookies**, not a single bearer token in localStorage. |
| **CSRF** | Double-submit token for unsafe methods in production (`XSRF-TOKEN` cookie + `x-xsrf-token` header). |
| **Public identity** | Guest tokens for cart/wishlist via middleware + cookie/header (`GuestTokenMiddleware`). |
| **Hardening** | Helmet, `@nestjs/throttler`, Zod env + request validation, CORS with `credentials: true`. |
| **Catalog depth** | Products, variants, attributes, categories, brands, taxes, shipping, gallery, Cloudinary-backed media—not one generic “Product” table and done. |

---

## Authentication & security (how it works)

### Admin (protected)

1. **Login** (`POST /api/v1/admin/auth/login`) issues:
   - `admin_access_token` — HttpOnly JWT (short-lived)
   - `admin_refresh_token` — HttpOnly JWT (longer-lived)
   - `XSRF-TOKEN` — **readable** cookie used with the header below

2. **`AdminSessionGuard`** (global): non-`@Public()` routes require a valid `admin_access_token` cookie; payload is verified and the admin is loaded from the DB. See [`src/common/guards/admin-session.guard.ts`](src/common/guards/admin-session.guard.ts) and `src/api/admin/auth/admin-session.service.ts`.

3. **`AdminCsrfGuard`** (global): for `POST`/`PUT`/`PATCH`/`DELETE` (not `GET`/`HEAD`/`OPTIONS`), in **non-development** environments, the `XSRF-TOKEN` cookie must match the `x-xsrf-token` header. Auth endpoints like login/register/refresh/logout are excluded. See [`src/common/guards/admin-csrf.guard.ts`](src/common/guards/admin-csrf.guard.ts).

4. **Refresh / logout**: `POST /api/v1/admin/auth/refresh` (uses refresh cookie), `POST /api/v1/admin/auth/logout` clears cookies. Session validation for the current user: `GET /api/v1/admin/auth/me`.

Implementation detail: tokens are signed with `jsonwebtoken`; secrets and expiry come from env (`ADMIN_JWT_*`). Cookie `secure` / `sameSite` follow `NODE_ENV` in `admin-auth.controller.ts`.

### Public (storefront)

- Routes that must stay anonymous are marked **`@Public()`** so the admin session guard skips them ([`src/common/decorators/public.decorator.ts`](src/common/decorators/public.decorator.ts)).
- **Cart & wishlist** get a stable **`guestToken`** (header `x-guest-token` or cookie `guestToken`) via `GuestTokenMiddleware` wired in [`src/api/user/user.module.ts`](src/api/user/user.module.ts).
- Optional **`x-customer-id`** is available for flows where the client identifies a logged-in customer (see [`src/common/decorators/current-customer-id.decorator.ts`](src/common/decorators/current-customer-id.decorator.ts)).

### CORS

Allowed origins and credentials are configured in `src/main.ts`; allowed headers include `x-xsrf-token`, `x-guest-token`, and `x-customer-id` so browsers can send admin CSRF and guest context correctly.

---

## Project organization

```
src/
├── api/
│   ├── admin/          # Back-office: auth, products, variants, attributes, categories,
│   │                   # brands, taxes, shipping, media, gallery
│   └── public/         # Storefront: products, media, cart, wishlist (+ guest middleware)
├── common/             # Guards, filters, interceptors, decorators, DTO helpers
├── config/             # Zod-validated env, app config service
├── modules/            # Integrations (e.g. Cloudinary)
├── prisma/             # Prisma module & service
└── main.ts             # Helmet, cookies, body limit, global prefix api/v1, CORS, DB ping

prisma/
├── schema/             # Split schema files (product, order, cart, inventory, etc.)
└── migrations/
```

**Global stack wiring** (`src/app.module.ts`): `ThrottlerGuard`, `AdminSessionGuard`, `AdminCsrfGuard`, `ZodValidationPipe`, `TransformInterceptor`, `GlobalExceptionFilter`.

---

## API surface (all under `api/v1`)

| Prefix | Purpose |
|--------|---------|
| `admin/auth` | Register, login, refresh, logout, me |
| `admin/products`, `admin/product-variants`, `admin/product-attributes` | Catalog management |
| `admin/categories`, `admin/brands` | Taxonomy |
| `admin/taxes`, `admin/shipping-methods` | Pricing & fulfillment config |
| `admin/media`, `admin/gallery` | Uploads & product gallery |
| `public/products`, `public/media` | Storefront read/browse |
| `public/cart`, `public/wishlist` | Guest/customer cart & wishlist |
| *(root)* `GET /api/v1/health` | Liveness-style check |

---

## Tech stack

- **NestJS 11**, **Prisma 7**, **PostgreSQL**
- **Zod** + `nestjs-zod` for env and request validation
- **JWT** (`jsonwebtoken`) + **cookies** for admin sessions
- **Helmet**, **cookie-parser**, **@nestjs/throttler**
- **Cloudinary** for media (env-driven folder, default `gym-backend/admin-media`)

---

## Architecture snapshot

```mermaid
flowchart TD
  Client[ClientOrAdminPanel] --> Api[api/v1]
  Api --> AdminApi[AdminModules]
  Api --> PublicApi[PublicModules]
  AdminApi --> SessionGuard[AdminSessionGuard]
  AdminApi --> CsrfGuard[AdminCsrfGuard]
  PublicApi --> GuestMiddleware[GuestTokenMiddleware]
  AdminApi --> Prisma[Prisma]
  PublicApi --> Prisma
  AdminApi --> Cloudinary[CloudinaryMediaFlow]
```

---

## Environment variables

Create a `.env` (or use your host’s secret manager) with values validated by `src/config/env.schema.ts`:

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `development` \| `production` \| `test` \| `provision` |
| `PORT` | HTTP port |
| `DATABASE_URL` | PostgreSQL connection URL |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (credentials enabled) |
| `ADMIN_JWT_ACCESS_SECRET` | Min 16 chars — access token signing |
| `ADMIN_JWT_REFRESH_SECRET` | Min 16 chars — refresh token signing |
| `ADMIN_JWT_ACCESS_EXPIRES` | Default `15m` |
| `ADMIN_JWT_REFRESH_EXPIRES` | Default `7d` |
| `CLOUDINARY_CLOUD_NAME` | Media uploads |
| `CLOUDINARY_API_KEY` | Media uploads |
| `CLOUDINARY_API_SECRET` | Media uploads |
| `CLOUDINARY_UPLOAD_FOLDER` | Default `gym-backend/admin-media` |

---

## How to run

```bash
pnpm install
pnpm run prisma:generate
pnpm run prisma:migrate   # or prisma:push for quick local iteration
pnpm run start:dev
```

- API base URL: `http://localhost:<PORT>/api/v1`
- Health: `GET http://localhost:<PORT>/api/v1/health`

### Scripts (from `package.json`)

| Script | Command |
|--------|---------|
| Build | `pnpm run build` |
| Dev | `pnpm run start:dev` |
| Prod | `pnpm run start:prod` |
| Prisma | `pnpm run prisma:generate`, `prisma:migrate`, `prisma:studio`, `prisma:seed` |
| Lint / format | `pnpm run lint`, `pnpm run format` |
| Tests | `pnpm run test`, `pnpm run test:e2e`, `pnpm run test:cov` |

---

## Testing note

E2E and unit test coverage is minimal today; improving tests is a natural next step for production hardening. The **design** above (auth, CSRF, guest cart, module split) is what this repo demonstrates for backend depth.

---

## License

See repository / `package.json` (`UNLICENSED` if not specified otherwise).
