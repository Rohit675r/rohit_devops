const { before, after, test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const app = require("./server.cjs");
const store = require("./store.js");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});

test("health endpoint identifies the running store", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    store: store.id
  });
});

test("product endpoint returns the correct six products", async () => {
  const expectedIds = {
    "petal-paper": ["journal", "pen", "gift", "cards", "tray", "pouch"],
    voltcart: ["headphones", "keyboard", "mouse", "speaker", "charger", "hub"]
  };

  const response = await fetch(`${baseUrl}/api/products`);
  assert.equal(response.status, 200);

  const products = await response.json();
  assert.equal(products.length, 6);
  assert.deepEqual(
    products.map(product => product.id).sort(),
    [...expectedIds[store.id]].sort()
  );
  assert.ok(products.every(product =>
    typeof product.name === "string" &&
    Number.isFinite(product.price) &&
    product.price > 0
  ));
});

test("storefront and separate cart page are available", async () => {
  const shop = await fetch(`${baseUrl}/`);
  assert.equal(shop.status, 200);
  assert.match(await shop.text(), /href="cart\.html"/);

  const cart = await fetch(`${baseUrl}/cart.html`);
  assert.equal(cart.status, 200);
  assert.match(await cart.text(), /id="cart-items"/);
});