const crypto = require("node:crypto");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 4000;
const FAKESTORE = "https://fakestoreapi.com";
const DEMO_USER = { username: "mor_2314", password: "83r5^_" };

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "fakestore",
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
};

app.use(cors());
app.use(express.json());

let pool;

// TODO: Create the database and tables, then seed demo users and products
async function initDatabase() {
  if (!/^[A-Za-z0-9_]+$/.test(DB_CONFIG.database)) {
    throw new Error("Invalid database name");
  }

  const { database, ...serverConfig } = DB_CONFIG;
  const root = await mysql.createConnection(serverConfig);
  await root.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await root.end();

  pool = mysql.createPool(DB_CONFIG);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  // TODO: Hash plain passwords added straight from phpMyAdmin
  await pool.query("DROP TRIGGER IF EXISTS before_users_insert_hash");
  await pool.query(`
    CREATE TRIGGER before_users_insert_hash
    BEFORE INSERT ON users
    FOR EACH ROW
    BEGIN
      DECLARE salt VARCHAR(36);
      IF NEW.password NOT LIKE '$2%' AND NEW.password NOT LIKE 'sha2$%' THEN
        SET salt = UUID();
        SET NEW.password = CONCAT('sha2$', salt, '$', SHA2(CONCAT(salt, NEW.password), 256));
      END IF;
    END
  `);

  // TODO: Hash a new plain password when a user row is updated
  await pool.query("DROP TRIGGER IF EXISTS before_users_update_hash");
  await pool.query(`
    CREATE TRIGGER before_users_update_hash
    BEFORE UPDATE ON users
    FOR EACH ROW
    BEGIN
      DECLARE salt VARCHAR(36);
      IF NEW.password <> OLD.password
         AND NEW.password NOT LIKE '$2%'
         AND NEW.password NOT LIKE 'sha2$%' THEN
        SET salt = UUID();
        SET NEW.password = CONCAT('sha2$', salt, '$', SHA2(CONCAT(salt, NEW.password), 256));
      END IF;
    END
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token CHAR(36) PRIMARY KEY,
      user_id INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  // TODO: Track whether a product was seeded or added by hand
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      image TEXT,
      rating_rate DECIMAL(3, 2),
      rating_count INT,
      source ENUM('seed','manual') NOT NULL DEFAULT 'manual',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  const [columns] = await pool.query("SHOW COLUMNS FROM products");
  const fields = new Set(columns.map((column) => column.Field));

  if (!fields.has("source")) {
    await pool.query(
      "ALTER TABLE products ADD COLUMN source ENUM('seed','manual') NOT NULL DEFAULT 'manual'"
    );
    await pool.query("UPDATE products SET source = 'seed'");
    console.log("[db] migrated products.source column");
  }

  if (!fields.has("updated_at")) {
    await pool.query(
      "ALTER TABLE products ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    );
    console.log("[db] migrated products.updated_at column");
  }

  const idColumn = columns.find((column) => column.Field === "id");
  if (idColumn && idColumn.Extra !== "auto_increment") {
    await pool.query("ALTER TABLE products MODIFY id INT NOT NULL AUTO_INCREMENT");
    console.log("[db] migrated products.id to AUTO_INCREMENT");
  }

  await seedUsers();
  await seedProducts();
}

// TODO: Add the demo user if it does not exist yet
async function seedUsers() {
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE username = ? LIMIT 1",
    [DEMO_USER.username]
  );
  if (rows.length > 0) return;

  await createUser(DEMO_USER.username, DEMO_USER.password);
}

// TODO: Fill products from fakestoreapi.com when the table is empty
async function seedProducts() {
  const [[{ total }]] = await pool.query(
    "SELECT COUNT(*) AS total FROM products"
  );
  if (total > 0) return;

  let products;
  try {
    const res = await fetch(`${FAKESTORE}/products`);
    if (!res.ok) throw new Error(`fakestore responded ${res.status}`);
    products = await res.json();
  } catch (err) {
    console.warn(`[db] failed to seed products from fakestoreapi: ${err.message}`);
    return;
  }

  // TODO: Label imported products as seeded data
  const values = products.map((product) => [
    product.title,
    product.price,
    product.description,
    product.category,
    product.image,
    product.rating?.rate ?? null,
    product.rating?.count ?? null,
    "seed",
  ]);

  await pool.query(
    `INSERT INTO products
       (title, price, description, category, image, rating_rate, rating_count, source)
     VALUES ?`,
    [values]
  );

  console.log(`[db] seeded ${products.length} products into MySQL`);
}

// TODO: Helpers that run queries against MySQL
// TODO: Old version: read data from fakestoreapi.com without a database
// TODO: async function fakestore(path, options) {
// TODO:   const res = await fetch(`${FAKESTORE}${path}`, options);
// TODO:   const text = await res.text();
// TODO:   let body;
// TODO:   try {
// TODO:     body = text ? JSON.parse(text) : null;
// TODO:   } catch {
// TODO:     body = text;
// TODO:   }
// TODO:   return { ok: res.ok, status: res.status, body };
// TODO: }

// TODO: Hash a plain password and save a new user in MySQL
async function createUser(username, password) {
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hash]
  );
  return result.insertId;
}

// TODO: Check a password against bcrypt or a SHA2 hash made by the database
async function verifyPassword(plain, stored) {
  if (!stored) return false;
  if (stored.startsWith("$2")) return bcrypt.compare(plain, stored);
  if (stored.startsWith("sha2$")) {
    const [, salt, hash] = stored.split("$");
    const digest = crypto.createHash("sha256").update(salt + plain).digest("hex");
    const a = Buffer.from(digest, "hex");
    const b = Buffer.from(hash || "", "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  return false;
}

// TODO: Look up one user by username
async function findUserByUsername(username) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username]
  );
  return rows[0];
}

// TODO: Save a login token for a user
async function createSession(token, userId) {
  await pool.query(
    "INSERT INTO sessions (token, user_id) VALUES (?, ?)",
    [token, userId]
  );
}

// TODO: Find the user that owns a login token
async function findSession(token) {
  const [rows] = await pool.query(
    `SELECT s.token, u.id AS user_id, u.username
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? LIMIT 1`,
    [token]
  );
  return rows[0];
}

// TODO: Read every product from MySQL
async function listProducts() {
  const [rows] = await pool.query("SELECT * FROM products ORDER BY id");
  return rows;
}

// TODO: Read one product by id
async function findProduct(id) {
  const [rows] = await pool.query(
    "SELECT * FROM products WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0];
}

// TODO: Shape a product row into the JSON format used by the UI
function toProductJson(row) {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    description: row.description,
    category: row.category,
    image: row.image,
    rating: { rate: row.rating_rate, count: row.rating_count },
    // TODO: Include source and timestamps in the response
    source: row.source,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// TODO: Check product fields from the request body
function parseProductBody(body) {
  const { title, price, description, category, image, rating } = body || {};
  const errors = [];
  if (!title || typeof title !== "string" || !title.trim())
    errors.push("title is required");
  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0)
    errors.push("price must be a non-negative number");
  if (errors.length) return { errors };
  return {
    data: {
      title: title.trim(),
      price: Number(price),
      description: description?.trim() ?? null,
      category: category?.trim() ?? null,
      image: image?.trim() ?? null,
      rating_rate: rating?.rate != null ? Number(rating.rate) : null,
      rating_count: rating?.count != null ? Number(rating.count) : null,
    },
  };
}

// TODO: Allow only requests with a valid Bearer token
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const session = token ? await findSession(token) : null;
  if (!session) return res.status(401).json({ message: "Unauthorized" });
  req.session = session;
  next();
}

// TODO: Forward async route errors to Express error middleware
function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// TODO: API routes

// TODO: Check that the MySQL connection works
app.get("/health", asyncRoute(async (req, res) => {
  // TODO: Old version: always return ok without checking a database
  // TODO: res.json({ status: "ok" });

  // TODO: Ping MySQL and report the active database
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", storage: "mysql", database: DB_CONFIG.database });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}));

// TODO: Log in by checking the user table in MySQL and saving a session
app.post("/api/login", asyncRoute(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }

  // TODO: Old version: ask fakestoreapi.com for a token
  // TODO: const result = await fakestore("/auth/login", {
  // TODO:   method: "POST",
  // TODO:   headers: { "Content-Type": "application/json" },
  // TODO:   body: JSON.stringify({ username, password }),
  // TODO: });
  // TODO: if (!result.ok || !result.body?.token) {
  // TODO:   return res.status(401).json({ message: "Invalid username or password" });
  // TODO: }
  // TODO: res.json({ token: result.body.token, user: { username } });

  // TODO: Compare the password with the hash stored in MySQL
  const user = await findUserByUsername(username);
  const valid = user && (await verifyPassword(password, user.password));
  if (!valid) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = crypto.randomUUID();
  await createSession(token, user.id);

  res.json({ token, user: { id: user.id, username: user.username } });
}));

// TODO: Create a user; the plain password is hashed before it is stored
app.post("/api/register", asyncRoute(async (req, res) => {
  const { username, password } = req.body || {};
  const name = typeof username === "string" ? username.trim() : "";
  if (!name || typeof password !== "string" || password.length < 4) {
    return res
      .status(400)
      .json({ message: "username and password (min 4 chars) are required" });
  }

  try {
    const id = await createUser(name, password);
    res.status(201).json({ user: { id, username: name } });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username already exists" });
    }
    res.status(500).json({ message: "Failed to create user" });
  }
}));

// TODO: Return the current user for a valid session token
app.get("/api/me", asyncRoute(async (req, res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const session = token ? await findSession(token) : null;
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json({ user: { id: session.user_id, username: session.username } });
}));

// TODO: Read all products from MySQL
app.get("/api/products", asyncRoute(async (req, res) => {
  // TODO: Old version: fetch products from fakestoreapi.com
  // TODO: const result = await fakestore("/products");
  // TODO: if (!result.ok) {
  // TODO:   return res.status(502).json({ message: "Failed to fetch products" });
  // TODO: }
  // TODO: res.json(result.body);

  // TODO: Return products stored in MySQL
  const products = await listProducts();
  res.json(products.map(toProductJson));
}));

// TODO: Read one product by id from MySQL
app.get("/api/products/:id", asyncRoute(async (req, res) => {
  // TODO: Old version: fetch one product from fakestoreapi.com
  // TODO: const result = await fakestore(`/products/${req.params.id}`);
  // TODO: if (!result.ok || !result.body) {
  // TODO:   return res.status(404).json({ message: "Product not found" });
  // TODO: }
  // TODO: res.json(result.body);

  // TODO: Return the matching product from MySQL
  const product = await findProduct(Number(req.params.id));
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(toProductJson(product));
}));

// TODO: Product CRUD endpoints that talk only to MySQL
// TODO: These routes do not call fakestoreapi.com
// TODO: Products are stored in the products table

// TODO: Create a product; login is required
app.post("/api/products", asyncRoute(requireAuth), asyncRoute(async (req, res) => {
  const parsed = parseProductBody(req.body);
  if (parsed.errors) {
    return res.status(400).json({ message: parsed.errors.join("; ") });
  }
  const { title, price, description, category, image, rating_rate, rating_count } = parsed.data;

  const [result] = await pool.query(
    `INSERT INTO products
       (title, price, description, category, image, rating_rate, rating_count, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'manual')`,
    [title, price, description, category, image, rating_rate, rating_count]
  );

  const newProduct = await findProduct(result.insertId);
  res.status(201).json(toProductJson(newProduct));
}));

// TODO: Update a product by id; login is required
app.put("/api/products/:id", asyncRoute(requireAuth), asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await findProduct(id);
  if (!existing) {
    return res.status(404).json({ message: "Product not found" });
  }

  const parsed = parseProductBody(req.body);
  if (parsed.errors) {
    return res.status(400).json({ message: parsed.errors.join("; ") });
  }
  const { title, price, description, category, image, rating_rate, rating_count } = parsed.data;

  await pool.query(
    `UPDATE products
     SET title=?, price=?, description=?, category=?, image=?, rating_rate=?, rating_count=?
     WHERE id=?`,
    [title, price, description, category, image, rating_rate, rating_count, id]
  );

  const updated = await findProduct(id);
  res.json(toProductJson(updated));
}));

// TODO: Delete a product by id; login is required
app.delete("/api/products/:id", asyncRoute(requireAuth), asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await findProduct(id);
  if (!existing) {
    return res.status(404).json({ message: "Product not found" });
  }

  await pool.query("DELETE FROM products WHERE id = ?", [id]);
  res.json({ message: "Product deleted successfully", id });
}));

// TODO: Read all distinct categories from MySQL
app.get("/api/categories", asyncRoute(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category"
  );
  res.json(rows.map((r) => r.category));
}));

// TODO: End of product CRUD endpoints

app.use((err, req, res, next) => {
  console.error("[api] request failed:", err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

// TODO: Start the server after MySQL is ready
async function start() {
  await initDatabase();

  // TODO: Old version: start the server without a database
  // TODO: app.listen(PORT, () => {
  // TODO:   console.log(`API running on http://localhost:${PORT}`);
  // TODO: });

  // TODO: Listen for API requests
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
    console.log(`Database: ${DB_CONFIG.database} @ ${DB_CONFIG.host}:${DB_CONFIG.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
