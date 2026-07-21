# Team 5 Hawker Centre — Front-End (FED)

Plain HTML/CSS/JS front-end for the BED backend. No build step, no framework.

## How to run

1. Copy **everything in this folder** into the backend repo's `public/` folder
   (replacing the placeholder index/credit stubs).
2. Start the backend: `node app.js`
3. Open `http://localhost:3000/index.html`

All pages call the API at `http://localhost:3000` (set in `js/api.js`).

## The one file that matters: `js/api.js`

Every endpoint path is defined once, at the top, in the `EP` object.

- Paths marked **CONFIRMED** match code on `main` today
  (Leslie's `/menuitems...`, Arri's `/api/inspections...`).
- Paths marked **TODO** are best guesses at Justin's and Russell's routes.
  Confirm each with its owner and correct it **in `EP` only** — every page
  updates automatically.

Auth: after login the JWT is stored in `localStorage` under `hawker_token`
and attached to every request as `Authorization: Bearer <token>`.

## Page ↔ feature map

| Page | Backend owner | Uses |
|---|---|---|
| `index.html` | Leslie | `GET /promotions/active` (Sprint 3 — degrades gracefully until built) |
| `menu.html` | Leslie | `GET /menuitems` + `?category=` / `?stall_id=` filters |
| `dish.html` | Leslie + Russell + Justin | cuisines M:N read, like toggle/count, add-to-cart, translation (Sprint 3 fallback) |
| `stall.html` | Leslie + Russell | stall menu via filter, public reviews + order-gated review form |
| `cart.html` | Justin | cart list, remove line, **clear cart (J10)**, checkout |
| `orders.html` | Justin | order history, **cancel while Pending (J7)**, **reorder (J11)** |
| `inspections.html` | Arri | full CRUD per his spec: list + `?stallId=` filter, create, edit (score/remarks only — stall/officer locked), delete with confirm; score → A/B/C/D sticker |
| `login.html` / `register.html` | Russell | auth, token storage |
| `account.html` | Russell | profile view/edit, complaints submit/view-own/delete |
| `credit.html` | team | assignment-required credits page |

## Deliberately NOT built (read this, Russell's warning)

- **No "resolve complaint" control anywhere.** The backend's complaint-status
  route is not operator-gated yet — exposing it would let any customer close
  any complaint. Build the operator dashboard only after operator login exists.
- **No sales report / add-on admin / saved-cards pages yet** (Justin's J9, J12,
  J14) — add once those endpoints are confirmed; the pattern in `orders.html`
  is the template.

## Endpoint confirmation checklist

- [ ] Justin: exact paths + response shapes for cart, checkout, orders, cancel, reorder, addons
- [ ] Russell: exact paths for register, login (token field name in response), profile, feedback, likes, complaints
- [ ] Arri: hygiene-grade endpoints when built (`POST /api/hygiene-grades`, `GET /api/stalls/:id/hygiene-history`)
- [ ] Leslie: `/promotions/active` (L10) and `/menuitems/:id/translated` (L12) — pages already fall back politely
