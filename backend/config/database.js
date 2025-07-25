// config/database.js
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file location
const DB_PATH = join(__dirname, "..", "data", "emulator_auth.db");

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize database connection and create tables
  async initialize() {
    return new Promise((resolve, reject) => {
      // Create database connection
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error("Error opening database:", err.message);
          reject(err);
          return;
        }
        console.log("Connected to SQLite database at:", DB_PATH);

        // Read and execute schema
        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  // Create tables from schema file
  async createTables() {
    return new Promise((resolve, reject) => {
      try {
        // Read the schema file
        const schemaPath = join(__dirname, "database_schema.sql");
        const schema = readFileSync(schemaPath, "utf8");

        // Execute schema (split by semicolon for multiple statements)
        const statements = schema.split(";").filter((stmt) => stmt.trim());

        // Execute statements sequentially to avoid dependency issues
        this.executeStatementsSequentially(statements, 0, resolve, reject);
      } catch (err) {
        console.error("Error reading schema file:", err.message);
        reject(err);
      }
    });
  }

  // Helper method to execute SQL statements one by one
  executeStatementsSequentially(statements, index, resolve, reject) {
    if (index >= statements.length) {
      console.log("Database tables created successfully");
      resolve();
      return;
    }

    const statement = statements[index].trim();
    if (!statement) {
      // Skip empty statements
      this.executeStatementsSequentially(
        statements,
        index + 1,
        resolve,
        reject
      );
      return;
    }

    this.db.run(statement, (err) => {
      if (err) {
        console.error("Error executing schema statement:", err.message);
        console.error("Failed statement:", statement);
        reject(err);
        return;
      }

      // Execute next statement
      this.executeStatementsSequentially(
        statements,
        index + 1,
        resolve,
        reject
      );
    });
  }

  // Get database instance
  getDB() {
    return this.db;
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error("Error closing database:", err.message);
        } else {
          console.log("Database connection closed");
        }
      });
    }
  }
}

// Function to ensure database tables exist (create them if they don't)
export async function ensureTablesExist() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) {
        console.error("Error opening database for table check:", err.message);
        reject(err);
        return;
      }

      // Check if users table exists
      db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
        async (err, row) => {
          if (err) {
            console.error("Error checking for tables:", err.message);
            db.close();
            reject(err);
            return;
          }

          if (row) {
            // Tables exist
            console.log("✅ Database tables already exist");
            db.close();
            resolve();
          } else {
            // Tables don't exist, create them
            console.log("📋 Database tables not found, creating them...");
            try {
              // Read and execute schema
              const schemaPath = join(__dirname, "database_schema.sql");
              const schema = readFileSync(schemaPath, "utf8");
              const statements = schema
                .split(";")
                .filter((stmt) => stmt.trim());

              // Execute statements sequentially
              await executeStatementsSequentially(db, statements, 0);
              console.log("✅ Database tables created successfully");
              db.close();
              resolve();
            } catch (error) {
              console.error("❌ Error creating tables:", error.message);
              db.close();
              reject(error);
            }
          }
        }
      );
    });
  });
}

// Helper function for sequential statement execution
function executeStatementsSequentially(db, statements, index) {
  return new Promise((resolve, reject) => {
    if (index >= statements.length) {
      resolve();
      return;
    }

    const statement = statements[index].trim();
    if (!statement) {
      executeStatementsSequentially(db, statements, index + 1)
        .then(resolve)
        .catch(reject);
      return;
    }

    db.run(statement, (err) => {
      if (err) {
        console.error("Error executing statement:", err.message);
        reject(err);
        return;
      }

      executeStatementsSequentially(db, statements, index + 1)
        .then(resolve)
        .catch(reject);
    });
  });
}

// This is what our auth routes expect to import
export function openDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("Error opening database connection:", err.message);
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

// Create singleton instance
const database = new Database();

export default database;
