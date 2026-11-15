const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

export async function getProducts() {
  const res = await fetch(`${API_URL}/api/products`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load products");
  return data;
}
