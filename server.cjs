const express = require("express");
const store = require("./store.js");

const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "ok", store: store.id });
});

app.get("/api/products", (req, res) => {
  res.json(store.products);
});

// Serve only the files the browser needs.
const pages = {
  "/": "index.html",
  "/index.html": "index.html",
  "/cart.html": "cart.html",
  "/styles.css": "styles.css",
  "/store.js": "store.js",
  "/app.js": "app.js"
};

for (const [url, file] of Object.entries(pages)) {
  app.get(url, (req, res) => {
    res.sendFile(file, { root: __dirname });
  });
}

if (require.main === module) {
  const defaultPort = store.id === "petal-paper" ? 4101 : 4102;
  const port = Number(process.env.PORT || defaultPort);
  const host = process.env.HOST || "127.0.0.1";

  app.listen(port, host, () => {
    console.log(`${store.name} is listening on port ${port}`);
  });
}

module.exports = app;