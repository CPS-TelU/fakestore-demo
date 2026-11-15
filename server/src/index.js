const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;
const FAKESTORE = "https://fakestoreapi.com";

app.use(cors());
app.use(express.json());

async function fakestore(path, options) {
  const res = await fetch(`${FAKESTORE}${path}`, options);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }

  const result = await fakestore("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!result.ok || !result.body?.token) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  res.json({ token: result.body.token, user: { username } });
});

app.get("/api/products", async (req, res) => {
  const result = await fakestore("/products");
  if (!result.ok) {
    return res.status(502).json({ message: "Failed to fetch products" });
  }
  res.json(result.body);
});

app.get("/api/products/:id", async (req, res) => {
  const result = await fakestore(`/products/${req.params.id}`);
  if (!result.ok || !result.body) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(result.body);
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
