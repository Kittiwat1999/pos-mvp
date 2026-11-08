# POS MVP — AI Agent Context

Restaurant POS MVP: staff console + guest QR ordering for dine-in tables.

Read this file before changing code. Prefer existing patterns over new abstractions.

---

## Product summary

| Actor | What they do |
|--------|----------------|
| **Staff** | Login → manage tables/products → open table (QR) → confirm incoming orders → checkout/payment → close table |
| **Guest** | Scan table QR → order food (`/order/:sessionToken`) → track status → checkout |

Currency UX is Thai Baht (฿). Domain language is English in code (`PENDING`, `OCCUPIED`, etc.).

---

## Stack

| Layer | Tech |
|--------|------|
| Frontend | React 19, Vite 7, TypeScript, React Router 7, Tailwind 3, Base UI, pnpm |
| Backend | FastAPI, SQLAlchemy 2, Pydantic 2, Alembic, JWT (access + refresh) |
| Data / media | PostgreSQL 16, MinIO (S3-compatible) |
| Runtime | Docker Compose (`db`, `minio`, `backend`, `frontend`, `pgadmin`) |

Ports: API `8000`, frontend `5173`, Postgres `5432`, MinIO `9000`/`9001`, pgAdmin `5050`.

---

## Repo layout

```
pos-mvp/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # FastAPI routers (auth, catalog, orders, payments, tables, storage)
│   │   ├── core/            # config, security, auth deps
│   │   ├── db/              # session, base, init/seed
│   │   ├── models/          # SQLAlchemy models
│   │   ├── repositories/    # DB access
│   │   ├── schemas/         # Pydantic request/response
│   │   └── services/        # business logic
│   ├── alembic/versions/    # migrations
│   └── tests/               # API/integration tests (TestClient)
├── frontend/src/
│   ├── api/                 # fetch wrappers per domain
│   ├── components/          # ui/, layout/, order/, pos/, tables/, …
│   ├── features/            # small domain helpers/exports
│   ├── hooks/
│   ├── pages/
│   ├── routes/              # AuthRoutes (public) vs StaffRoutes (JWT)
│   ├── store/               # auth localStorage
│   └── types/
├── docs/                    # task breakdowns + this context
├── scripts/                 # e.g. verify-docker-stack.sh
└── docker-compose.yml
```

**Backend layering:** `api` → `service` → `repository` → `model`. Keep HTTP/status mapping in services/API; keep SQL in repositories.

**Frontend layering:** `pages` compose UI; `api/*` talk to backend via `apiFetch`; shared UI under `components/ui`.

### Form pattern

Use React Hook Form as the single source of truth for form fields. Do not duplicate
field values in `useState` when the same fields are managed by `useForm`.

```tsx
const form = useForm<FormInput, unknown, FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    name: "",
    image: null,
  },
});

const image = form.watch("image");

const handleSave = (values: FormValues) => {
  // Send validated values to the API.
};
```

Use `register("fieldName")` for standard text inputs and textareas, and submit
with `form.handleSubmit(handleSave)`. Use `form.setValue("image", file)` for
file inputs, and `watch` the value when a preview depends on it. Display field
errors from `formState.errors` rather than maintaining separate validation state.

---

## Core domain model

```
Table (AVAILABLE | OCCUPIED | CLEANING)
  └── TableSession (OPEN | …, qr_token)
        ├── Order[] (PENDING → CONFIRMED → COMPLETED | CANCELLED)
        │     └── OrderItem[] (product snapshot: name, unit_price, qty, note)
        └── Payment? (one per session: method, amount, receipt_number)
```

Catalog: `Category` → `Product` (price, stock, `add_ons` JSON, image via MinIO/`image_url`).

Users: `username` + `password_hash` + `role` (JWT auth for staff routes).

### Order status transitions

```
PENDING  → CONFIRMED | CANCELLED
CONFIRMED → COMPLETED | CANCELLED
COMPLETED / CANCELLED → (terminal)
```

Enforced in `OrderService.ALLOWED_TRANSITIONS`.

### Main flows

1. **Open table:** staff `POST /tables/{id}/open` → table `OCCUPIED`, session `OPEN` + `qr_token`.
2. **Guest order:** `POST /qr/{qr_token}/orders` with items → order `PENDING`.
3. **Staff kitchen/queue:** poll/list orders, `PATCH /orders/{id}/status`.
4. **Checkout:** `POST /table-sessions/{id}/checkout` → payment + close session path (see payment service).
5. **Clean:** `POST /tables/{id}/clean` when appropriate.

Incoming orders UI polls (~5s, `ORDER_POLLING_INTERVAL_MS`).

---

## API conventions

- Base path: `/api/v1` (health is `/health` outside prefix).
- Staff endpoints use `Depends(get_current_user)` (Bearer JWT).
- Guest QR endpoints are public and keyed by `qr_token`.
- Error shape from handlers: `{ "success": false, "error": "..." }` (validation may include `details`).
- Money: `Decimal` / `Numeric(10, 2)` on backend; avoid float for totals.

Key route groups:

| Prefix / pattern | Purpose |
|------------------|---------|
| `/auth/*` | login, refresh |
| `/tables`, `/table-sessions`, `/qr/{token}` | floor + QR session |
| `/…/orders`, `/orders`, `/orders/{id}/status` | ordering + staff status |
| `/table-sessions/{id}/checkout`, `/payments/*` | payment + receipt |
| catalog / storage | products, categories, uploads |

---

## Frontend routes

**Public (`AuthRoutes`):** `/`, `/login`, `/order/:sessionToken`, `/order/:sessionToken/status`, `/order/:sessionToken/checkout`

**Staff (`StaffRoutes`):** `/dashboard`, `/tables`, `/incoming-orders`, `/products`

Sidebar placeholders still point Settings/Customers to `/` — settings module is planned, not fully built.

API client: `frontend/src/api/client.ts` → `apiFetch` with token refresh on 401.

Env (Vite): `VITE_API_BASE_URL`, etc. Defaults in `frontend/src/lib/constants.ts`.

---

## Local development

```bash
# Full stack
docker compose up -d --build

# Backend only (from host, DB must be reachable)
cd backend && uvicorn app.main:app --reload --port 8000

# Frontend only
cd frontend && pnpm install && pnpm dev

# Backend tests
cd backend && pytest

# Frontend typecheck / e2e
cd frontend && pnpm typecheck
# e2e against Docker: scripts/verify-docker-stack.sh
```

DB init/seed runs on backend lifespan (`init_db`). Schema changes go through **Alembic** migrations under `backend/alembic/versions/`.

---

## Agent working rules

1. **Match existing style** — naming, folder placement, error handling, Tailwind/`cn`/`buttonVariants` patterns.
2. **Small diffs** — no drive-by refactors, no new docs unless asked, no unrelated files.
3. **Preserve domain invariants** — table/session/order status rules; do not invent parallel status strings.
4. **Backend:** add schema + service (+ repo if needed) + router; wire in `app/main.py` only when adding a new router module.
5. **Frontend:** add `api/*.ts` helpers, then page/component; reuse `components/ui/*`.
6. **Tests:** extend integration tests under `backend/tests/` for API behavior you change.
7. **Secrets:** never commit `.env` values; use env vars already wired in compose/config.
8. **Known typo:** page file `IncommingOrdersPage.tsx` — keep import paths consistent if renaming.

---

## Current vs planned

**Implemented (MVP core):** auth, catalog, tables/sessions/QR, guest + staff orders, status updates, basic checkout/payment, storage/MinIO, incoming-orders polling UI.

**Planned (see task docs):**

- [`pos-settings-tasks.md`](./pos-settings-tasks.md) — restaurant profile, tables settings, tax/service charge/discounts, payment methods, staff PIN roles
- [`pos-checkout-payment-task.md`](./pos-checkout-payment-task.md) — richer checkout UI, cash/PromptPay/card panels, split bill, manager PIN voids, atomic confirm-payment

When implementing those epics, reuse existing order/table/payment models where possible; extend rather than duplicate.

---

## Quick file map for common tasks

| Task | Start here |
|------|------------|
| Order business rules | `backend/app/services/order_service.py` |
| Order HTTP | `backend/app/api/v1/orders.py` |
| Table / QR | `backend/app/services/table_service.py`, `api/v1/tables.py` |
| Payment | `backend/app/services/payment_service.py` |
| Guest ordering UI | `frontend/src/pages/OrderingPage.tsx` |
| Staff incoming queue | `frontend/src/pages/IncommingOrdersPage.tsx`, `hooks/usePolling.ts` |
| Auth | `backend/app/api/v1/auth.py`, `frontend/src/store/authStore.ts` |
| Routes | `frontend/src/routes/AppRouter.tsx` |
