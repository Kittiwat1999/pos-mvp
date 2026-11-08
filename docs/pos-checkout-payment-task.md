# Task Breakdown: Checkout / Payment Screen (MVP) — For AI Coding Agents

Flow: Click Checkout from the Table Plan → payment screen → select payment method → confirm → close the table → return to the Table Plan

Dependency: This module depends on previously completed epics — `tables/zones`, `tax_settings`, `quick_discounts`, `payment_methods` (from the Settings module), and the existing order/order_items used when opening an order.

---

## EPIC 1: Order Summary Panel

### 1.1 Backend API
- [ ] `GET /api/orders/:orderId/checkout-summary` — Aggregate: table info (table number, zone, service type, table opening time), order items (name, modifier, quantity, price), and subtotal.
- [ ] The endpoint calculates the total by reusing `calculateOrderTotal()` from the Settings module (subtotal → discount → service charge → VAT → grand total), and returns a line-by-line breakdown for the frontend to display. The client must not recalculate it.
- [ ] `PUT /api/orders/:orderId/items/:itemId` — Edit/move a food item before payment (must lock the item from editing after payment is confirmed).
- [ ] `DELETE /api/orders/:orderId/items/:itemId` — Cancel an item. The body must include a required `reason` and `manager_pin` (validate authorization before deletion).
- [ ] Audit log: Record every item cancellation/edit, including the operator's name and reason.

### 1.2 Frontend (Checkout Screen — Left/Top Section)
- [ ] Header displays: table number, zone, service type, and table opening time (displaying “open for X minutes” is also acceptable).
- [ ] Food item list: name, modifier (as sub-text), quantity, and total price per item.
- [ ] Edit/move button per row → Open a modal.
- [ ] Cancel item button → Open a modal that requires a reason and manager PIN before confirmation.
- [ ] Total summary section: Subtotal, Discount (show only when applicable), Service Charge, VAT, and Grand Total (large, clear, and the most prominent number on the page).
- [ ] Discount selector button/dropdown populated from `quick_discounts` configured in Settings.

**Acceptance:** Open the payment screen for a table with an order → Items and totals match the actual data; an item can be canceled only after entering a valid manager PIN.

---

## EPIC 2: Payment Method Selection

### 2.1 Backend API
- [ ] `GET /api/settings/payment-methods/active` — Fetch only enabled payment methods (for rendering buttons on the checkout page).
- [ ] `POST /api/orders/:orderId/payments` — Record payment: method (cash/promptpay/credit_card), amount_received (for cash), amount_due, and change_amount.
- [ ] Validation: For cash, `amount_received >= amount_due`; for promptpay/credit_card, default `amount_received = amount_due`.
- [ ] `GET /api/settings/payment-info` — Fetch the bank account number/QR image to display when PromptPay is selected.

### 2.2 Frontend (Checkout Screen — Right/Bottom: Payment Panel)
- [ ] Payment method tabs/buttons (render only methods enabled in Settings).
- [ ] **Cash panel:**
  - Input “Amount received” (on-screen numeric keypad for touch devices).
  - Quick cash buttons (100/500/1000) and a “Pay exact amount” button (auto-fill = grand total).
  - Display “Change” in real time as soon as an amount is entered/button is pressed (calculate client-side for responsiveness, but validate again on the backend at submission).
- [ ] **PromptPay panel:**
  - Display the QR Code image (from `payment_info`) with the total amount shown prominently as an overlay or beside the QR code.
- [ ] **Credit Card / Other panel:**
  - Display the amount to charge + a “Confirm payment received” button (manual confirmation because the MVP does not integrate with a physical card terminal).

**Acceptance:** Select Cash → enter/press an amount → change is calculated correctly and immediately; select PromptPay → QR code and amount match the grand total.

---

## EPIC 3: Split Bill

### 3.1 Backend API
- [ ] `POST /api/orders/:orderId/split-bill` — Support 2 modes: `by_items` (specify which items belong to each bill) and `equal_split` (specify the number of people and split the total equally).
- [ ] Logic: Create sub-bills referencing the original order. Each sub-bill has its own payment status, and the main order can be closed only after all sub-bills have been fully paid.
- [ ] Validation: For `by_items`, verify that every item is assigned to exactly one sub-bill, with no missing or duplicate items.

### 3.2 Frontend
- [ ] “Split bill / Split equally” button opens a mode-selection modal.
- [ ] Equal split mode: Enter the number of people → Display a preview of the amount per person.
- [ ] Split by item mode: Drag-and-drop UI or checkboxes to assign items to each sub-bill, with each bill's total updated in real time.
- [ ] After confirming the split → Display sub-bills with paid/unpaid statuses so users can select and pay each bill individually.

**Acceptance:** A table for 4 people split equally into 4 bills → each bill has the correct amount (including prorated service charge/VAT); split by item → sub-bills add up to the original grand total.

*(Note: Split Bill is highly complex. If time is limited, implement equal split first and add by-items later.)*

---

## EPIC 4: Confirm Payment & Complete/Clear Table

### 4.1 Backend API
- [ ] `POST /api/orders/:orderId/confirm-payment` — Change the order status to `paid` and save a transaction record (timestamp, staff_id, payment method, amounts). This must be an atomic transaction (to prevent duplicate clicks/race conditions).
- [ ] `POST /api/orders/:orderId/complete` — Change the table status back to `available` in the `tables` table, close the order (`status = completed`), and record the table closing timestamp.
- [ ] Idempotency: Prevent repeated calls (for example, rapid button clicks) from recording duplicate sales.

### 4.2 Frontend
- [ ] “Pay” button — Disable immediately after clicking (loading state) to prevent duplicate submissions, and display clear success feedback.
- [ ] “Close table” button — Call the complete API, then automatically navigate back to the Table Plan.
- [ ] The Table Plan must immediately reflect the table as “Available” (real-time update or refetch when returning to the page).
- [ ] Error handling: If confirm-payment fails (for example, due to a network disconnection), display a clear error and do not change the table status.

**Acceptance:** Click “Pay” → click “Close table” → return to the Table Plan → table A4 immediately shows as available, and a complete sales record is saved (exactly 1 sales record per order, even if the button is clicked repeatedly).

## Recommended Implementation Sequence
1. Epic 1 (Order Summary Panel) — It must come first because all other parts depend on this data.
2. Epic 2 (Payment Method Selection) — The core flow of the payment screen.
3. Epic 4 (Confirm Payment & Complete Table) — Complete the main end-to-end flow before adding advanced features.
4. Epic 3 (Split Bill) — A complex optional feature; implement it last after the main flow is stable.

## Notes for the Agent
- All money-related endpoints (confirm-payment, split-bill) must use a database transaction and an idempotency guard because they are the highest-risk areas in a POS system (under/overcharging or duplicate records).
- Total calculation (subtotal → discount → service charge → VAT) must reuse the same function used for Tax settings (Epic 3 of the Settings module). Do not duplicate the calculation logic in this module.
- Money-related buttons (cancel item, confirm payment) should include a confirmation step or PIN to reduce human error.
- Unit tests are especially recommended for split-bill logic (edge cases: uneven splits and cent rounding).
