import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';
import "dotenv/config";
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const app = express();
const port = process.env.PORT || 5000;

// Initialize Prisma Client using the DATABASE_URL (port 6543) for connection pooling
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to parse JSON bodies in requests

// A simple test route to make sure the server is running
app.get('/', (req, res) => {
  res.send('Finance Tracker API is running!');
});

// --- USER ROUTES ---

// 1. Fetch all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// 2. Create a new user (Needed so we can attach transactions to an ID)
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, passwordHash } = req.body;
    
    const newUser = await prisma.user.create({
      data: { name, email, passwordHash },
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// --- AUTHENTICATION MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  // 1. Get the token from the request header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format is "Bearer <token>"

  // 2. If there is no token, deny access
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  // 3. Verify the token using your secret key
  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    
    // 4. If valid, attach the decoded user info (which contains the userId) to the request
    req.user = decodedUser;
    
    // 5. Move on to the actual route handler
    next(); 
  });
};

// --- TRANSACTION ROUTES (PROTECTED) ---

// 1. Create a new transaction
// Notice we added 'authenticateToken' as the middle argument
app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { amount, type, category, description } = req.body; // Removed userId from here
    const userId = req.user.userId; // Extracted securely from the JWT token

    if (!amount || !type || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type,
        category,
        description,
        userId: userId, // Use the secure ID
      },
    });

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

// 2. Get all transactions for the logged-in user
// We no longer need the /:userId in the URL!
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Extracted securely from the JWT token

    const transactions = await prisma.transaction.findMany({
      where: { userId: userId },
      orderBy: { date: 'desc' },
    });

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// 3. Delete a transaction
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Security check: Make sure the transaction belongs to the person trying to delete it!
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) }
    });

    if (!transaction || transaction.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this transaction" });
    }
    
    await prisma.transaction.delete({
      where: { id: parseInt(id) },
    });
    
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

// --- AUTH ROUTES ---

// 1. Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email." });
    }

    // Hash the password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the new user in the database
    const newUser = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    // Generate a JWT Token valid for 7 days
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Return the token and user info (excluding the password hash!)
    res.status(201).json({ 
      token, 
      user: { id: newUser.id, name: newUser.name, email: newUser.email } 
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// 2. Login an existing user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // Compare the entered password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // Generate a JWT Token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email } 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});