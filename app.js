async function startStore() {
  const response = await fetch("/api/products");

  if (!response.ok) {
    throw new Error(`Product API returned HTTP ${response.status}`);
  }

  const products = await response.json();

  if (!Array.isArray(products)) {
    throw new Error("The product API did not return a catalog.");
  }

  STORE.products = products;
const get = id => document.getElementById(id);
const productsById = new Map(STORE.products.map(product => [product.id, product]));
const storageKey = `${STORE.id}-cart`;
const giftKey = `${STORE.id}-gift-wrap`;

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const money = amount => currency.format(amount);

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function readCart() {
  let saved;
  try {
    saved = JSON.parse(readStorage(storageKey) || "{}");
  } catch {
    saved = {};
  }

  const items = {};
  for (const product of STORE.products) {
    const quantity = saved?.[product.id];
    if (Number.isSafeInteger(quantity) && quantity > 0) {
      items[product.id] = quantity;
    }
  }
  return items;
}

let cart = readCart();

function changeQuantity(id, change) {
  if (!productsById.has(id)) return false;

  const quantity = (cart[id] || 0) + change;
  if (quantity > 0) cart[id] = quantity;
  else delete cart[id];

  if (Object.keys(cart).length === 0) saveStorage(giftKey, "false");
  return saveStorage(storageKey, JSON.stringify(cart));
}

function updateHeaderCount() {
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  for (const badge of document.querySelectorAll("[data-cart-count]")) {
    badge.textContent = count;
  }
  return count;
}

function initShop() {
  const selected = new Set();
  let noticeTimer;

  get("headline").textContent = STORE.headline;
  get("intro").textContent = STORE.intro;
  get("hero-image").src = STORE.heroImage;
  get("hero-image").alt = STORE.heroAlt;
  get("collection-title").textContent = STORE.collectionTitle;

  get("category").add(new Option("All categories", ""));
  for (const category of new Set(STORE.products.map(product => product.category))) {
    get("category").add(new Option(category, category));
  }

  function renderProducts() {
    const query = get("search").value.trim().toLowerCase();
    const category = get("category").value;
    const matches = STORE.products.filter(product => {
      const text = `${product.name} ${product.category} ${product.spec}`.toLowerCase();
      return text.includes(query) && (!category || product.category === category);
    });

    get("results").textContent = matches.length
      ? `${matches.length} ${matches.length === 1 ? "product" : "products"}`
      : "No products match your search.";

    get("products").innerHTML = matches.map(product => `
      <article class="product">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="product-details">
          <small class="muted">${product.category}</small>
          <h3>${product.name}</h3>
          <p class="muted">${product.spec}</p>
          <div class="row">
            <strong>${money(product.price)}</strong>
            <button type="button" class="button" data-add="${product.id}"
                    aria-label="Add ${product.name} to cart">Add to cart</button>
          </div>
          ${STORE.compare ? `
            <label class="compare-option">
              <input type="checkbox" data-compare="${product.id}"
                     ${selected.has(product.id) ? "checked" : ""}>
              Compare specs
            </label>
          ` : ""}
        </div>
      </article>
    `).join("");
  }

  function renderComparison() {
    get("comparison").hidden = selected.size === 0;
    get("comparison-items").innerHTML = [...selected].map(id => {
      const product = productsById.get(id);
      return `
        <div class="comparison-item">
          <strong>${product.name}</strong>
          <p>${product.spec}</p>
          <strong>${money(product.price)}</strong>
        </div>
      `;
    }).join("");
  }

  function showNotice(message) {
    clearTimeout(noticeTimer);
    get("notice").textContent = message;
    noticeTimer = setTimeout(() => {
      get("notice").textContent = "";
    }, 3000);
  }

  get("products").addEventListener("click", event => {
    const button = event.target.closest("button[data-add]");
    if (!button) return;

    const product = productsById.get(button.dataset.add);
    const saved = changeQuantity(product.id, 1);
    updateHeaderCount();
    showNotice(saved
      ? `${product.name} added to your cart.`
      : "Cart storage is unavailable. Open the store through a local server.");
  });

  get("products").addEventListener("change", event => {
    const id = event.target.dataset.compare;
    if (!id) return;

    if (event.target.checked) selected.add(id);
    else selected.delete(id);
    renderComparison();
  });

  get("clear-comparison").addEventListener("click", () => {
    selected.clear();
    renderProducts();
    renderComparison();
    get("search").focus();
  });

  get("search").addEventListener("input", renderProducts);
  get("category").addEventListener("change", renderProducts);
  renderProducts();
}

function initCart() {
  const giftWrap = get("gift-wrap");
  const giftWrapPrice = STORE.giftWrapPrice || 0;

  get("cart-title").textContent = STORE.cartTitle;
  get("gift-option-price").textContent = money(giftWrapPrice);

  function renderCart() {
    const items = STORE.products.filter(product => cart[product.id] > 0);
    const count = updateHeaderCount();
    const subtotal = items.reduce(
      (sum, product) => sum + product.price * cart[product.id], 0
    );

    const canWrap = giftWrapPrice > 0 && count > 0;
    giftWrap.checked = canWrap && readStorage(giftKey) === "true";
    const giftFee = giftWrap.checked ? giftWrapPrice : 0;

    get("cart-count").textContent = `${count} ${count === 1 ? "item" : "items"}`;
    get("gift-option").hidden = !canWrap;
    get("gift-row").hidden = giftFee === 0;
    get("gift-price").textContent = money(giftFee);
    get("subtotal").textContent = money(subtotal);
    get("total").textContent = money(subtotal + giftFee);

    get("cart-items").innerHTML = items.length
      ? items.map(product => {
          const quantity = cart[product.id];
          return `
            <article class="cart-item">
              <img src="${product.image}" alt="">
              <div>
                <h3>${product.name}</h3>
                <p class="muted">${money(product.price)} each</p>
                <div class="cart-actions">
                  <div class="quantity">
                    <button type="button" data-id="${product.id}" data-action="minus"
                            aria-label="Remove one ${product.name}">−</button>
                    <span aria-label="Quantity ${quantity}">${quantity}</span>
                    <button type="button" data-id="${product.id}" data-action="plus"
                            aria-label="Add one ${product.name}">+</button>
                  </div>
                  <button type="button" class="text-button" data-id="${product.id}"
                          data-action="remove"
                          aria-label="Remove ${product.name} from cart">Remove</button>
                </div>
              </div>
              <strong class="line-total">${money(product.price * quantity)}</strong>
            </article>
          `;
        }).join("")
      : `
        <div class="empty-cart">
          <h2>Your cart is empty</h2>
          <a class="button" href="index.html#collection">Browse products</a>
        </div>
      `;
  }

  get("cart-items").addEventListener("click", event => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;

    const { id, action } = button.dataset;
    const change = action === "remove" ? -(cart[id] || 0)
      : action === "plus" ? 1 : -1;

    changeQuantity(id, change);
    renderCart();

    const replacement = get("cart-items").querySelector(
      `button[data-id="${id}"][data-action="${action}"]`
    );
    (replacement || get("cart-title")).focus({ preventScroll: true });
  });

  giftWrap.addEventListener("change", () => {
    saveStorage(giftKey, String(giftWrap.checked));
    renderCart();
  });

  window.addEventListener("pageshow", event => {
    if (event.persisted) {
      cart = readCart();
      renderCart();
    }
  });

  renderCart();
}

document.documentElement.dataset.theme = STORE.theme;
for (const brand of document.querySelectorAll("[data-brand]")) {
  brand.textContent = STORE.name;
}

const isCartPage = document.body.dataset.page === "cart";
document.title = isCartPage ? `${STORE.cartTitle} | ${STORE.name}` : STORE.name;
updateHeaderCount();

if (isCartPage) {
  initCart();
} else {
  initShop();
  window.addEventListener("pageshow", event => {
    if (event.persisted) {
      cart = readCart();
      updateHeaderCount();
    }
  });
}
}

startStore().catch(error => {
  console.error(error);

  const message = document.createElement("p");
  message.className = "panel";
  message.setAttribute("role", "alert");
  message.textContent =
    "Products could not load. Start the store with npm.cmd start and open its local address.";

  document.querySelector("main").prepend(message);
});