# Pharma SaaS Admin

Next.js TypeScript frontend plus the existing Express backend for a pharmacy
inventory/admin SaaS console.

## What's Included

- Next.js App Router frontend in TypeScript
- Core SaaS style admin screens: login, dashboard, clients, client details,
  users, add user, roles, branches, module plan, and settings
- Dashboard cards connected to the existing Express API where data exists
- Express server with JSON and CORS middleware
- CRUD for categories, suppliers, products, and batches
- Stock movement ledger that keeps batch quantities in sync
- Health checks for the service and local store
- File-backed persistence via `STORE_PATH` in `.env`

## Run It

1. Install dependencies with `npm install`.
2. Initialize the local store with `npm run db:setup`.
3. Start the backend API with `npm run start:api`.
4. Start the Next.js frontend with `npm run dev:web`.

Frontend: `http://localhost:3000`

Backend API: `http://localhost:4000`

Set `PHARMA_API_BASE_URL` if the frontend should fetch from a different API
host. By default it uses `http://localhost:4000`.

## Frontend Routes

- `GET /login`
- `GET /dashboard`
- `GET /clients`
- `GET /clients/city-hospital`
- `GET /users`
- `GET /users/new`
- `GET /roles`
- `GET /branches`
- `GET /settings/plan`
- `GET /settings`

## Backend Routes

- `GET /`
- `GET /health`
- `GET /health/database`
- `GET /api`
- `GET /api/categories`
- `POST /api/categories`
- `GET /api/categories/:id`
- `PATCH /api/categories/:id`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`
- `GET /api/suppliers`
- `POST /api/suppliers`
- `GET /api/suppliers/:id`
- `PATCH /api/suppliers/:id`
- `PUT /api/suppliers/:id`
- `DELETE /api/suppliers/:id`
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/batches`
- `POST /api/batches`
- `GET /api/batches/:id`
- `PATCH /api/batches/:id`
- `PUT /api/batches/:id`
- `DELETE /api/batches/:id`
- `GET /api/stock-movements`
- `POST /api/stock-movements`
- `GET /api/stock-movements/:id`

## Notes

- Batch quantity updates should go through `POST /api/stock-movements`.
- `CORS_ORIGIN` can be set in `.env` if you want to restrict browser access.
- The `prisma/` folder remains as schema reference. Runtime persistence uses
  the JSON store.