CREATE DATABASE IF NOT EXISTS fakestore
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fakestore;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TODO: Hash plain passwords typed directly in phpMyAdmin
-- TODO: Leave bcrypt hashes from the API unchanged

DELIMITER //

DROP TRIGGER IF EXISTS before_users_insert_hash//
CREATE TRIGGER before_users_insert_hash
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  DECLARE salt VARCHAR(36);
  IF NEW.password NOT LIKE '$2%' AND NEW.password NOT LIKE 'sha2$%' THEN
    SET salt = UUID();
    SET NEW.password = CONCAT('sha2$', salt, '$', SHA2(CONCAT(salt, NEW.password), 256));
  END IF;
END//

DROP TRIGGER IF EXISTS before_users_update_hash//
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
END//

DELIMITER ;

CREATE TABLE IF NOT EXISTS sessions (
  token CHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

-- TODO: Users can also be created with POST /api/register using bcrypt
-- TODO: The demo user mor_2314 is seeded by the server on first start
-- TODO: Example direct insert: INSERT INTO users (username, password) VALUES ('budi', 'inipassword');
-- TODO: The insert trigger turns that plain text into a salted SHA2 hash

