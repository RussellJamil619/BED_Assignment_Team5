// js/api.js — shared API layer for the whole front-end
// Owner: Leslie (team-shared)
//
// EVERY endpoint path lives in EP below. Paths marked CONFIRMED match code
// that exists on main today. Paths marked TODO are best guesses — confirm the
// exact path with the owner named in the comment, change it HERE ONLY, and
// every page updates automatically.

const API_BASE = "http://localhost:3000";

const EP = {
  // ---- Leslie — CONFIRMED ----
  menuItems:        "/menuitems",
  menuItem:         id => `/menuitems/${id}`,
  menuItemCuisines: id => `/menuitems/${id}/cuisines`,
  // ---- Leslie — planned (L10/L12), pages degrade gracefully until built ----
  promotionsActive: "/promotions/active",
  translate: (id, lang) => `/menuitems/${id}/translated?lang=${lang}`,

  // ---- Arri — CONFIRMED (his own spec) ----
  inspections: "/api/inspections",
  inspection:  id => `/api/inspections/${id}`,

  // ---- Russell — TODO: confirm exact paths with Russell ----
  register: "/api/auth/register",
  login:    "/api/auth/login",
  profile:  "/api/customers/profile",           // view + update own profile
  stallFeedback: stallId => `/api/feedback/stall/${stallId}`, // public reviews
  feedback: "/api/feedback",                    // POST new review
  likeToggle: menuItemId => `/api/likes/${menuItemId}`,       // POST like / unlike
  likeCount:  menuItemId => `/api/likes/${menuItemId}/count`, // GET public count
  complaints:   "/api/complaints",              // POST new complaint
  myComplaints: "/api/complaints/mine",         // GET own complaints
  complaint:    id => `/api/complaints/${id}`,  // DELETE own complaint

  // ---- Justin — TODO: confirm exact paths with Justin ----
  cart:      "/cart",                 // GET items, POST {menu_item_id, quantity}
  cartItem:  id => `/cart/${id}`,     // DELETE one line
  cartClear: "/cart",                 // DELETE all (J10)
  checkout:  "/orders/checkout",      // POST — creates order(s) from cart
  orders:    "/orders",               // GET my orders
  orderCancel: id => `/orders/${id}/cancel`,   // PUT/POST while Pending (J7)
  reorder:     id => `/orders/${id}/reorder`,  // POST past order back to cart (J11)
  addons:    "/addons"                // GET add-on catalogue (J9)
};

// ---------- auth token ----------
const TOKEN_KEY = "hawker_token";
const getToken   = () => localStorage.getItem(TOKEN_KEY);
const setToken   = t  => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);
const isLoggedIn = () => !!getToken();

// ---------- fetch wrapper ----------
// Attaches the Bearer token, parses JSON, throws { status, body } on non-2xx
// so every page can show the backend's own error message.
async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });

  let body = null;
  const text = await res.text();
  try { body = text ? JSON.parse(text) : null; } catch { body = { message: text }; }

  if (!res.ok) throw { status: res.status, body };
  return body;
}

// ---------- small UI helpers ----------
function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2600);
}

// Render a backend error into a container (uses Joi's errors array when present)
function showErrors(el, err) {
  const msgs = err?.body?.errors || [err?.body?.message || err?.body?.hint || "Something went wrong"];
  el.innerHTML = `<div class="errors"><ul>${msgs.map(m => `<li>${m}</li>`).join("")}</ul></div>`;
}

const money = n => `$${Number(n).toFixed(2)}`;
const qsParam = k => new URLSearchParams(location.search).get(k);

// ---------- shared nav ----------
function navInit(active) {
  const authed = isLoggedIn();
  const nav = document.createElement("nav");
  nav.className = "nav";
  nav.innerHTML = `
    <div class="nav-inner">
      <a class="brand" href="index.html">Team 5 Hawker<span class="dot">.</span></a>
      <a class="link" data-page="menu" href="menu.html">Menu</a>
      <a class="link" data-page="cart" href="cart.html">Cart</a>
      <a class="link" data-page="orders" href="orders.html">My orders</a>
      <a class="link" data-page="inspections" href="inspections.html">Inspections</a>
      <span class="spacer"></span>
      ${authed
        ? `<a class="link" data-page="account" href="account.html">My account</a>
           <a class="link" href="#" id="logoutLink">Log out</a>`
        : `<a class="link" data-page="login" href="login.html">Log in</a>
           <a class="link" data-page="register" href="register.html">Register</a>`}
    </div>`;
  document.body.prepend(nav);
  const cur = nav.querySelector(`[data-page="${active}"]`);
  if (cur) cur.setAttribute("aria-current", "page");
  const out = nav.querySelector("#logoutLink");
  if (out) out.addEventListener("click", e => {
    e.preventDefault(); clearToken(); toast("Logged out"); location.href = "index.html";
  });
}

function footerInit() {
  const f = document.createElement("footer");
  f.innerHTML = `Team 5 · BED Assignment · Hawker Centre Management System ·
    <a href="credit.html">Credits</a>`;
  document.body.appendChild(f);
}
