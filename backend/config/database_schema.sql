-- EmulatorJS User Authentication Database Schema
-- SQLite Database Design

-- Users table: Store user accounts
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
);

-- Save States table: Store EmulatorJS save states (snapshots)
CREATE TABLE IF NOT EXISTS save_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_name VARCHAR(100) NOT NULL,
    slot_number INTEGER DEFAULT 1,
    save_name VARCHAR(100),
    file_path VARCHAR(255) NOT NULL,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, game_name, slot_number)
);

-- Save Files table: Store traditional game saves (.srm files)
CREATE TABLE IF NOT EXISTS save_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_name VARCHAR(100) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, game_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_save_states_user_game ON save_states(user_id, game_name);
CREATE INDEX IF NOT EXISTS idx_save_files_user_game ON save_files(user_id, game_name);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);