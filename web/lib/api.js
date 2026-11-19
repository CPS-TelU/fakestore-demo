const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// TODO: Helpers for talking to the API
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// TODO: Login and signup calls
export async function login(username, password) {
  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data;
}

// TODO: Create a user; the server hashes the plain password before saving
export async function register(username, password) {
  const res = await fetch(`${API_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Register failed");
  return data;
}

// TODO: Product read calls
export async function getProducts() {
  const res = await fetch(`${API_URL}/api/products`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load products");
  return data;
}

export async function getProduct(id) {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Product not found");
  return data;
}

// TODO: Product write calls that go straight to MySQL through the backend

// TODO: Load all unique categories from the database
export async function getCategories() {
  const res = await fetch(`${API_URL}/api/categories`);
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

// TODO: Add a new product
export async function createProduct(payload) {
  const res = await fetch(`${API_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to create product");
  return data;
}

// TODO: Update a product by id
export async function updateProduct(id, payload) {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to update product");
  return data;
}

// TODO: Delete a product by id
export async function deleteProduct(id) {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to delete product");
  return data;
}
