# Storefront API path reference

Base URL prefix: `/api/v1`.

## Source layout (shared code)

Shared Nest helpers, guards, storefront middleware, and commerce pricing live under [`src/common/`](src/common/) (outside [`src/api/`](src/api)). API route modules import them via the `@common/*` TypeScript path alias (see `tsconfig.json`).

## Public (anonymous catalog)

| Area | Prefix |
|------|--------|
| Products | `GET /public/products`, `GET /public/products/search`, `GET /public/products/:identifier` |
| Categories | `GET /public/categories`, `GET /public/categories/:slug` |
| Brands | `GET /public/brands` |
| Reviews | `GET /public/products/:productId/reviews` |
| Media (catalog redirect) | `GET /public/media/:mediaId/content` |

### `GET /public/products` — query parameters

| Param | Type | Notes |
|-------|------|-------|
| `page` | int | default 1 |
| `limit` | int | default 10, max 100 |
| `search` | string | Case-insensitive slug/title match |
| `categoryId` | UUID | Ignored if `categorySlug` set |
| `categorySlug` | string | Takes precedence over `categoryId` |
| `brandId` | UUID | Ignored if `brandSlug` set |
| `brandSlug` | string | Takes precedence over `brandId` |
| `minRating` | 0–5 | `rating >= minRating` |
| `type` | `PHYSICAL` \| `DIGITAL` \| `SERVICE` | |
| `sellingUnit` | enum | PIECE, KG, GRAM, … |
| `minBasePrice` | number | Product-level base price |
| `maxBasePrice` | number | Product-level base price |
| `minPrice` | number | Any active variant price |
| `maxPrice` | number | Any active variant price |
| `isFeature` | boolean | Featured products only |
| `sortBy` | `updatedAt` \| `price` \| `rating` \| `title` | default `updatedAt` |
| `sortOrder` | `asc` \| `desc` | default `desc` |

## User (customer session)

| Area | Prefix |
|------|--------|
| Auth | `POST /user/auth/register`, `POST /user/auth/login`, `POST /user/auth/refresh`, `POST /user/auth/logout`, `GET /user/auth/me` |
| Cart (guest or logged-in) | `POST /user/cart/items`, `POST /user/cart/sync` |
| Wishlist | `POST /user/wishlist/items`, `POST /user/wishlist/sync` |
| Checkout | `GET /user/checkout/payment-methods`, `GET /user/checkout/shipping-methods`, `POST /user/checkout/preview`, `POST /user/checkout/place-order` |
| Orders | `GET /user/orders`, `GET /user/orders/:orderId` |

Breaking change: former `public/auth`, `public/cart`, `public/wishlist`, `public/checkout`, and `public/orders` routes now live under `/user/...` as above.
