CREATE DATABASE IF NOT EXISTS bor4sige CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bor4sige;

-- Tabla maestra genérica
CREATE TABLE master_entity (
    id CHAR(36) NOT NULL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla clave‑valor para usuarios
CREATE TABLE kv_user (
    id CHAR(36) NOT NULL,
    key_name VARCHAR(64) NOT NULL,
    value_text TEXT NULL,
    PRIMARY KEY (id, key_name),
    CONSTRAINT fk_kv_user_master FOREIGN KEY (id)
        REFERENCES master_entity(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_kv_user_key ON kv_user (key_name);

-- Tabla clave‑valor para productos (ejemplo)
CREATE TABLE kv_product (
    id CHAR(36) NOT NULL,
    key_name VARCHAR(64) NOT NULL,
    value_text TEXT NULL,
    PRIMARY KEY (id, key_name),
    CONSTRAINT fk_kv_product_master FOREIGN KEY (id)
        REFERENCES master_entity(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_kv_product_key ON kv_product (key_name);

-- Tabla clave‑valor para pedidos (ejemplo)
CREATE TABLE kv_order (
    id CHAR(36) NOT NULL,
    key_name VARCHAR(64) NOT NULL,
    value_text TEXT NULL,
    PRIMARY KEY (id, key_name),
    CONSTRAINT fk_kv_order_master FOREIGN KEY (id)
        REFERENCES master_entity(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_kv_order_key ON kv_order (key_name);
