// TODO: Product page with full CRUD backed by MySQL
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/api";

// TODO: Empty form values for a new product
const EMPTY_FORM = {
  title: "",
  price: "",
  description: "",
  category: "",
  image: "",
  rating: { rate: "", count: "" },
};

// TODO: Modal form used to add or edit a product
function ProductModal({ initial, categories, onSave, onClose, loading }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial
      ? {
        title: initial.title ?? "",
        price: initial.price ?? "",
        description: initial.description ?? "",
        category: initial.category ?? "",
        image: initial.image ?? "",
        rating: {
          rate: initial.rating?.rate ?? "",
          count: initial.rating?.count ?? "",
        },
      }
      : EMPTY_FORM
  );

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  function setRating(field, value) {
    setForm((prev) => ({ ...prev, rating: { ...prev.rating, [field]: value } }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      title: form.title,
      price: parseFloat(form.price),
      description: form.description,
      category: form.category,
      image: form.image,
      rating: {
        rate: form.rating.rate !== "" ? parseFloat(form.rating.rate) : null,
        count: form.rating.count !== "" ? parseInt(form.rating.count) : null,
      },
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box card" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>{isEdit ? "Edit Produk" : "Tambah Produk"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Judul *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="field">
            <label>Harga (USD) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Kategori</label>
            {/* TODO: Pick a saved category or type a new one */}
            <input
              value={form.category}
              list="category-list"
              onChange={(e) => set("category", e.target.value)}
              placeholder="Ketik atau pilih..."
            />
            <datalist id="category-list">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label>URL Gambar</label>
            <input
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="field">
            <label>Deskripsi</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              style={{ resize: "vertical", padding: "10px 12px", borderRadius: 8, border: "1px solid #d2d7e0", fontSize: 14 }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>Rating (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating.rate}
                onChange={(e) => setRating("rate", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Jml. Review</label>
              <input
                type="number"
                min="0"
                value={form.rating.count}
                onChange={(e) => setRating("count", e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" disabled={loading} style={{ flex: 1 }}>
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Produk"}
            </button>
            <button type="button" className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// TODO: Product card with edit and delete buttons
function ProductCard({ product, onEdit, onDelete }) {
  return (
    <article className="card product">
      {product.image ? (
        <img src={product.image} alt={product.title} />
      ) : (
        <div className="no-image">No Image</div>
      )}
      <h3>{product.title}</h3>
      <p className="price">${Number(product.price).toFixed(2)}</p>
      <p className="muted">{product.category || "—"}</p>
      {product.source && (
        <span className={`badge badge-${product.source}`}>
          {product.source === "seed" ? "FakeStore" : "Manual"}
        </span>
      )}
      {/* TODO: CRUD action buttons */}
      <div className="card-actions">
        <button className="btn-sm btn-edit" onClick={() => onEdit(product)}>
          Edit
        </button>
        <button className="btn-sm btn-delete" onClick={() => onDelete(product)}>
          Hapus
        </button>
      </div>
    </article>
  );
}

// TODO: Main products page
export default function ProductsPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // TODO: Category list from database
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // TODO: Modal and operation state
  const [modal, setModal] = useState(null); // TODO: null means closed, "add" or an edit object
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // TODO: Product waiting for delete confirmation
  const [filterSource, setFilterSource] = useState("all"); // TODO: Filter by seed or manual products

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

  // TODO: Save a product with create or update
  async function handleSave(payload) {
    setSaving(true);
    setError("");
    try {
      if (modal === "add") {
        await createProduct(payload);
      } else {
        await updateProduct(modal.product.id, payload);
      }
      setModal(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // TODO: Confirm and run the delete
  async function handleDeleteConfirm() {
    if (!confirmDelete) return;
    setSaving(true);
    setError("");
    try {
      await deleteProduct(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // TODO: Filter products by source
  const displayed = products.filter((p) => {
    if (filterSource === "all") return true;
    return p.source === filterSource;
  });

  return (
    <main className="container">
      <div className="topbar">
        <div>
          <h1 style={{ margin: 0 }}>Products</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Login sebagai {username || "-"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* TODO: Button to add a product */}
          <button
            style={{ width: "auto", padding: "10px 18px" }}
            onClick={() => setModal("add")}
          >
            Tambah Produk
          </button>
          <button className="btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* TODO: Source filter bar */}
      <div className="filter-bar">
        <span className="muted" style={{ fontSize: 13 }}>Filter:</span>
        {["all", "seed", "manual"].map((s) => (
          <button
            key={s}
            className={filterSource === s ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilterSource(s)}
          >
            {s === "all" ? "Semua" : s === "seed" ? "FakeStore (seed)" : "Manual (SQL CRUD)"}
          </button>
        ))}
        <span className="muted" style={{ marginLeft: "auto" }}>
          {displayed.length} produk
        </span>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading products...</p>}

      <div className="grid">
        {
            displayed.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={(p) => setModal({ mode: "edit", product: p })}
                onDelete={(p) => setConfirmDelete(p)}
              />
            ))
          }
      </div>

      {/* TODO: Add and edit modal */}
      {modal && (
        <ProductModal
          initial={modal === "add" ? null : modal.product}
          categories={categories}
          onSave={handleSave}
          onClose={() => setModal(null)}
          loading={saving}
        />
      )}

      {/* TODO: Delete confirmation dialog */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div
            className="modal-box card"
            style={{ maxWidth: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Hapus Produk?</h3>
            <p className="muted">
              <strong>{confirmDelete.title}</strong> akan dihapus permanen dari
              database.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{ background: "#dc2626" }}
                onClick={handleDeleteConfirm}
                disabled={saving}
              >
                {saving ? "Menghapus..." : "Ya, Hapus"}
              </button>
              <button
                className="btn-ghost"
                onClick={() => setConfirmDelete(null)}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
