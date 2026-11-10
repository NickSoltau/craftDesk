# CraftDesk Quotes: MVP spec

Nick Soltau | Draft v2 | 2026-11-10

## The problem (a hypothesis I intend to test)

Small service businesses often agree on a price by phone, text, or DM, so nothing written records what was priced or what the customer agreed to. At R J Lanthier I never started a job without written proof of the award; a phone call told us we won, but the signed contract was what counted. I believe a small shop wants the same proof, but I have not verified that for these users. This project builds the quote-and-approval step and tests whether shop owners react to it.

**Terms.** A *bid* is the owner's working side (the numbers behind the price). A *proposal* is what the customer sees. In CraftDesk, a **quote** is the proposal, and the quote builder is where the owner assembles the bid.

## The four capabilities

1. **Build a quote from a request.** The owner opens a request and clicks Create quote (this replaces the bare Approve button). A quote has material and labor lines, a scope of work, exclusions, an optional tax rate, internal notes, and an expiry date. Totals are computed, never typed.
2. **Send it.** The customer gets an email with a link to a public quote page. The page shows the scope of work, the exclusions, and **one total price** that includes all materials, labor, and taxes. A sent quote is locked.
3. **Customer approves or declines, without logging in.** The customer types their name and taps Approve or Decline. The decision, name, time, and a frozen copy of what they saw are recorded.
4. **Approved quote becomes a job.** It lands on the existing status board with the agreed total. The deposit flow is unchanged: after approving, the customer is offered the deposit link.

## The journey

1. A customer submits a request on the shop's booking page (existing).
2. The request lands on the owner's dashboard with name, contact info, description, and photos. If the owner needs more information, they contact the customer.
3. The owner clicks Create quote, adds lines and a scope of work, checks the total, and clicks Send.
4. The customer opens the emailed link on their phone, reads the scope and the total price, types their name, and taps Approve.
5. The customer lands on the status page, which offers the deposit link. The owner sees the approval, and later the deposit, on the dashboard.
6. After the deposit is paid, the customer follows the job through the status page (existing).

## Data sketch (three tables)

**`quotes`**: `id`, `shop_id`, `booking_id`, `created_by`, `quote_number` (unique per shop), `status` (`draft`, `sent`, `approved`, `declined`, `void`), `scope_of_work`, `exclusions`, `notes` (internal only), `tax_rate`, `expires_at`, `created_at`, `sent_at`. Approval-token columns are added in the week 5 migration.

**`quote_items`**: `id`, `quote_id`, `position`, `kind` (`material` or `labor`), `description`, `quantity` numeric(12,2), `unit_price` numeric(12,2), `is_taxable`. For labor, quantity is hours and unit price is the rate. These rows are the owner's working numbers and are never shown to the customer.

**`quote_approvals`**: `id`, `quote_id`, `decision`, `approver_name`, `decided_at`, `snapshot` (jsonb, exactly what the customer saw: quote number, scope, exclusions, total, expiry), `approved_total` numeric(12,2).

## Rules

- A sent quote cannot be edited. To change one, void it and create a new quote, so two live links never exist for the same job. "Expired" is worked out from `expires_at`, not stored.
- Money is `numeric`, never float. Tax is computed once on the taxable subtotal and rounded to the cent at the end (three $1.99 items at 7.25%: $0.43, not 3 × $0.14).
- The customer sees one number only: the total price, labeled as including all materials, labor, and taxes. Line items, labor rates, and the tax breakdown stay on the owner's side.
- The public page reads through an Edge Function that returns only the quote number, shop name, scope of work, exclusions, total, expiry, and status. There is no anonymous read policy on any quote table.

## Decisions

| Decision | Why |
|---|---|
| Explicit approval before the deposit, not payment-as-acceptance | A payment proves they paid, not what they agreed to. The approval record is the written proof. |
| Customer sees one total price only | The breakdown is the owner's business, as it was at Lanthier. The scope of work and exclusions say exactly what the price covers. |
| Labor stored as line items | One-person shops use one row; shops with different pay scales use one row per rate. One model covers both. |
| Tax flag per line, rate on the quote | An owner decides what is taxable; the app does not assume. |
| Typed name plus frozen snapshot on approval | A timestamp alone does not say who agreed or to what. |
| `void` status | Prevents two live links when a sent quote has a mistake. |

## Out of scope

Takeoffs and parts lists; labor-factor formulas; tracking vendor and subcontractor quotes; overhead, insurance, per diem, and prevailing-wage scales; cost-versus-price and markup; showing the customer a price breakdown (line items or phases); per-person overhead and workload planning; revision history; PDF output; templates and price lists; teams and roles; multiple businesses; a project-location field (an owner can put it in the scope of work); tracking whether a repair piece has been received (follow-up PR).

## Validation

Discovery messages go out in week 2 and are logged in `docs/discovery.md`.