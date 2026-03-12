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

// --- TRANSACTION ROUTES ---

// 3. Create a new transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { amount, type, category, description, userId } = req.body;

    // Basic validation
    if (!amount || !type || !category || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type, // "INCOME" or "EXPENSE"
        category,
        description,
        userId: parseInt(userId),
      },
    });

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

// 4. Get all transactions for a specific user
app.get('/api/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: parseInt(userId),
      },
      orderBy: {
        date: 'desc', // Show newest transactions first
      },
    });

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// 5. Delete a transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.transaction.delete({
      where: { 
        id: parseInt(id) 
      },
    });
    
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});