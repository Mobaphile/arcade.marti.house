import express from "express";
import { openDatabase } from "../config/database.js";
import { hashPassword, generateJWT, verifyPassword } from "../utils/auth.js";

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Validate username (basic check - no spaces, reasonable length)
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Username must be between 3 and 20 characters",
      });
    }

    if (/\s/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Username cannot contain spaces",
      });
    }

    // Connect to database
    const db = await openDatabase();

    // Check if username already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id FROM users WHERE username = ?",
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingUser) {
      db.close();
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Insert new user (email will be NULL)
    const result = await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)",
        [username, hashedPassword],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    db.close();

    // Generate JWT token for immediate login
    const newUser = {
      id: result.id,
      username: username,
      email: null, // No email in this simplified version
    };
    const token = generateJWT(newUser);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
      },
      token: token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
});

/**
 * POST /api/auth/login
 * Login an existing user
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Connect to database
    const db = await openDatabase();

    // Find user by username
    const user = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id, username, password_hash FROM users WHERE username = ?",
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    db.close();

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Generate JWT token for successful login
    const userForToken = {
      id: user.id,
      username: user.username,
      email: null, // No email in our simplified version
    };
    const token = generateJWT(userForToken);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
      },
      token: token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
});

export default router;
