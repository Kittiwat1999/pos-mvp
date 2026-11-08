# Task Breakdown: POS Settings Module (MVP) — For AI Coding Agents

Structure: Each epic is broken down into tasks that an agent (such as Claude Code) can pick up one at a time, with dependencies and rough acceptance criteria.

---

## EPIC 1: Restaurant Profile

### 1.1 Database
- [ ] Create a `config_srt` table for storing restaurant settings (such as key, value, and an appropriate data type).
- [ ] Create a `service_types` table/enum (`dine_in`, `takeaway`) and a `restaurant_service_types` join table (to support selecting multiple service types).

### 1.2 Backend API
- [ ] `GET /api/settings/restaurant-profile` — Fetch restaurant information from `config_srt`.
- [ ] `PUT /api/settings/restaurant-profile` — Edit the restaurant name, phone number, address, and logo by reading/writing through the repository at `backend/app/repositories/restaurant_repo.py` (validate file type/size, resize/compress).
- [ ] `PUT /api/settings/restaurant-profile/service-types` — Enable/disable dine-in/takeaway.

### 1.3 Frontend (Settings > Restaurant Profile)
- [ ] Restaurant information edit form (name, phone, address) with validation (required fields, phone number format).
- [ ] Component for uploading/displaying a logo preview.
- [ ] Toggle switches for service types (dine-in/takeaway).
- [ ] Toast/feedback after a successful or failed save.

**Acceptance:** Edit restaurant information and enable/disable service types; after refreshing the page, all data remains intact.

---

## EPIC 2: Table Settings (No Zones)

> In this MVP, table management is retained, but zone-based grouping is excluded. Tables are managed directly at the restaurant level.

### 2.1 Database
- [ ] Constraint: `table_number` must be unique within the same restaurant.
- [ ] Optional: Add `is_active` or soft-delete to prevent permanent deletion that could affect order history.

### 2.2 Backend API
- [ ] `GET /api/settings/tables` — Fetch the table list.
- [ ] `POST /api/settings/tables` — Add a table.
- [ ] `PUT /api/settings/tables/:tableId` — Edit a table.
- [ ] `DELETE /api/settings/tables/:tableId` — Delete a table (block deletion if it has an active order).
- [ ] Validation: Prevent deletion of a table with an active order (use soft-delete or block the operation).

### 2.3 Frontend (Settings > Tables)
- [ ] Table list displayed as a table/card layout with add/edit/delete buttons.
- [ ] Fields for table number, capacity, and status.
- [ ] Confirmation modal before deletion, with a warning if the table has a pending order.
- [ ] Tables appear on the order-opening page according to their configured capacity and status.

**Acceptance:** Add a new table → It appears on the order-opening page with the configured number, capacity, and status.

---

## EPIC 3: Tax, Service Charge & Discounts

### 3.1 Database
- [ ] Create a `tax_settings` table (`id`, `restaurant_id`, `service_charge_enabled`, `service_charge_percent`, `vat_enabled`, `vat_percent`, `vat_mode [inclusive/exclusive]`).
- [ ] Create a `quick_discounts` table (`id`, `restaurant_id`, `label`, `type [percent/fixed_amount]`, `value`, `is_active`, `sort_order`).

### 3.2 Backend API
- [ ] `GET/PUT /api/settings/tax` — Read/edit service charge, VAT, and inclusive/exclusive mode.
- [ ] `GET/POST/PUT/DELETE /api/settings/quick-discounts` — CRUD for quick discount buttons.
- [ ] Price calculation logic: Create a shared `calculateOrderTotal(subtotal, taxSettings)` function that supports both inclusive/exclusive modes and is shared with the order module.
- [ ] Validation: Percentages must be between 0 and 100; fixed discounts must not be negative.

### 3.3 Frontend (Settings > Tax & Discount)
- [ ] Toggle + percentage input for Service Charge.
- [ ] Toggle + percentage input for VAT.
- [ ] Radio buttons for selecting Inclusive/Exclusive (show a price calculation preview).
- [ ] Quick discount button management table (add/delete/reorder/toggle active).

**Acceptance:** Change the VAT/Service Charge settings, then open a new order; the total is calculated correctly according to the configured mode.

---

## EPIC 4: Payment Methods

### 4.1 Database
- [ ] Create a `payment_methods` table (`id`, `restaurant_id`, `type [cash/promptpay/credit_card]`, `is_enabled`).
- [ ] Create a `payment_receiving_info` table (`id`, `restaurant_id`, `bank_account_no`, `bank_name`, `qr_code_image_url`).

### 4.2 Backend API
- [ ] `GET/PUT /api/settings/payment-methods` — Enable/disable each payment method.
- [ ] `GET/PUT /api/settings/payment-info` — Manage the bank account number/QR image.
- [ ] `POST /api/settings/payment-info/qr-upload` — Upload a QR Code image (validate the image).

### 4.3 Frontend (Settings > Payment Methods)
- [ ] Toggle switches: Cash / PromptPay.
- [ ] Form for entering the bank account number + bank name.
- [ ] Upload + preview the QR Code image.
- [ ] Display a warning if PromptPay is enabled but a QR image has not been uploaded.

**Acceptance:** Enable PromptPay + upload a QR image; the payment screen displays the QR code correctly for customers to scan.

---

## EPIC 5: User & Staff Roles

### 5.1 Database
- [ ] Create a `staff_users` table (`id`, `restaurant_id`, `name`, `pin_hash`, `role [admin/staff]`, `is_active`, `created_at`).
- [ ] Index/constraint: PINs must be unique within the same restaurant.
- [ ] Create a `role_permissions` table (`role`, `permission_key`) or define a hardcoded permission map in the backend (dynamic permissions are not required for the MVP).

### 5.2 Backend API
- [ ] `GET/POST/PUT/DELETE /api/settings/staff` — CRUD for staff (hash the PIN before storing it; never return `pin_hash`).
- [ ] `POST /api/auth/pin-login` — Log in with a PIN to access the POS terminal.
- [ ] Authorization middleware by role: admin can access all endpoints; staff can access only order/table endpoints (block sales reports/settings endpoints).

### 5.3 Frontend (Settings > Staff & Roles)
- [ ] Staff list table + buttons to add/edit/deactivate staff.
- [ ] Add-staff form: name, role selection, PIN setup (4–6 digits, confirm PIN).
- [ ] PIN login page for staff when starting the terminal.
- [ ] Hide menus/buttons that staff are not authorized to use (such as total sales reports and Settings).

**Acceptance:** Create a staff user with the staff role → Log in with the PIN → The user cannot access Settings or sales reports (both the UI hides them and the backend blocks them).

---

## Recommended Implementation Sequence
1. Epic 1 (Restaurant Profile) — The simplest epic; use it to establish CRUD/form patterns.
2. Epic 5 (Users & Roles) — Must be implemented first because other epics depend on access control.
3. Epic 2 (Table Settings) — Required before enabling the order module (no zones).
4. Epic 3 (Tax/Service Charge/Discount) — Required before calculating bills.
5. Epic 4 (Payment Methods) — Implement afterward, before going to production.

## Notes for the Agent
- All endpoints that modify data should have at least an audit log (who, when, what changed) for future review.
- Every form should validate on both the frontend and backend (never rely on frontend validation alone).
- Unit tests are recommended for the tax/discount calculation function (`calculateOrderTotal`) because it directly affects money.
