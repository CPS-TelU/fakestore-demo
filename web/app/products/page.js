"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts } from "@/lib/api";

export default function ProductsPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProducts(await getProducts());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/");
      return;
    }
    setUsername(localStorage.getItem("username") || "");
    load();
  }, [router, load]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.replace("/");
  }

  return (
    <main className="container">
      <div className="topbar">
        <div>
          <h1 style={{ margin: 0 }}>Products</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Login sebagai {username || "-"}
          </p>
        </div>
        <button className="btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading products...</p>}

      <div className="grid">
        {products.map((product) => (
          <article className="card product" key={product.id}>
            <img src={product.image} alt={product.title} />
            <h3>{product.title}</h3>
            <p className="price">${product.price}</p>
            <p className="muted">{product.category}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
