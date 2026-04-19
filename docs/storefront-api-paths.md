# Storefront API path reference

Base URL prefix: `/api/v1`.

## Source layout (shared code)

Shared Nest helpers, guards, storefront middleware, and commerce pricing live under [`src/common/`](src/common/) (outside [`src/api/`](src/api)). API route modules import them via the `@common/*` TypeScript path alias (see `tsconfig.json`).

## Public (anonymous catalog)

| Area | Prefix |
|------|--------|
| Products | `GET /public/products`, `GET /public/products/search`, `GET /public/products/:identifier` |
| Categories | `GET /public/categories`, `GET /public/categories/:slug` |
| Reviews | `GET /public/products/:productId/reviews` |
| Media (catalog redirect) | `GET /public/media/:mediaId/content` |

## User (customer session)

| Area | Prefix |
|------|--------|
| Auth | `POST /user/auth/register`, `POST /user/auth/login`, `POST /user/auth/refresh`, `POST /user/auth/logout`, `GET /user/auth/me` |
| Cart (guest or logged-in) | `POST /user/cart/items`, `POST /user/cart/sync` |
| Wishlist | `POST /user/wishlist/items`, `POST /user/wishlist/sync` |
| Checkout | `GET /user/checkout/payment-methods`, `GET /user/checkout/shipping-methods`, `POST /user/checkout/preview`, `POST /user/checkout/place-order` |
| Orders | `GET /user/orders`, `GET /user/orders/:orderId` |

Breaking change: former `public/auth`, `public/cart`, `public/wishlist`, `public/checkout`, and `public/orders` routes now live under `/user/...` as above.
