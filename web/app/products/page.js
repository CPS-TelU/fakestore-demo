"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts, getCategories } from "@/lib/api";

function ProductCard({ product }) {
  return (
    <article className="card product">
      {product.image ? (
        <img src={product.image} alt={product.title} />
      ) : (
        <div className="no-image">No image available</div>
      )}
      <h3>{product.title}</h3>
      <p className="price">${Number(product.price).toFixed(2)}</p>
      <p className="muted">{product.category || "Uncategorized"}</p>
      {product.description && <p className="muted">{product.description}</p>}
      {product.rating?.count > 0 && (
        <p className="muted">
          ★ {Number(product.rating.rate).toFixed(1)} ({product.rating.count} reviews)
        </p>
      )}
    </article>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
      setProducts(prods);
      setCategories(cats);
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

  const displayed =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <main className="container">
      <div className="topbar">
        <div>
          <h1 style={{ margin: 0 }}>Products</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Signed in as {username || "-"}
          </p>
        </div>
        <button className="btn-ghost" onClick={handleLogout}>
          Sign out
        </button>
      </div>

      <div className="filter-bar">
        <label className="muted" htmlFor="category" style={{ fontSize: 13 }}>
          Category
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid #d1d5db",
            fontSize: 13,
          }}
        >
          <option value="all">All products</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="muted" style={{ marginLeft: "auto" }}>
          {displayed.length} products
        </span>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading products...</p>}
      {!loading && displayed.length === 0 && (
        <p className="muted">No products found.</p>
      )}

      <div className="grid">
        {displayed.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
