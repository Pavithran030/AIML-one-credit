import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, '..', 'db.json');

app.use(cors());
app.use(express.json());

// Helper function to read database
const readDB = async () => {
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
};

// Helper function to write database
const writeDB = async (data) => {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ─────────────────────────────────────────────────────────────────────────────
// CRUD ENDPOINTS FOR TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────

// GET all transactions (with optional month filter)
app.get('/api/transactions', async (req, res) => {
  try {
    const db = await readDB();
    const { month } = req.query;
    
    let transactions = db.transactions || [];
    
    if (month) {
      transactions = transactions.filter(t => t.month === month);
    }
    
    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET single transaction by ID
app.get('/api/transactions/:id', async (req, res) => {
  try {
    const db = await readDB();
    const transaction = db.transactions.find(t => t.id === req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// POST create new transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const db = await readDB();
    const { date, type, category, description, amount, month } = req.body;
    
    // Validate required fields
    if (!date || !type || !category || !description || amount === undefined || !month) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newTransaction = {
      id: generateId(),
      date,
      type,
      category,
      description,
      amount: parseFloat(amount),
      month,
      createdAt: new Date().toISOString()
    };
    
    db.transactions.push(newTransaction);
    await writeDB(db);
    
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// PUT update transaction
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const db = await readDB();
    const index = db.transactions.findIndex(t => t.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const { date, type, category, description, amount, month } = req.body;
    
    db.transactions[index] = {
      ...db.transactions[index],
      date: date || db.transactions[index].date,
      type: type || db.transactions[index].type,
      category: category || db.transactions[index].category,
      description: description || db.transactions[index].description,
      amount: amount !== undefined ? parseFloat(amount) : db.transactions[index].amount,
      month: month || db.transactions[index].month,
      updatedAt: new Date().toISOString()
    };
    
    await writeDB(db);
    
    res.json(db.transactions[index]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const db = await readDB();
    const index = db.transactions.findIndex(t => t.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const deleted = db.transactions.splice(index, 1);
    await writeDB(db);
    
    res.json({ message: 'Transaction deleted', transaction: deleted[0] });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// GET available months
app.get('/api/months', async (req, res) => {
  try {
    const db = await readDB();
    const months = [...new Set(db.transactions.map(t => t.month))];
    months.sort((a, b) => b.localeCompare(a));
    res.json(months);
  } catch (error) {
    console.error('Error fetching months:', error);
    res.status(500).json({ error: 'Failed to fetch months' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`📊 LEDGER API Server running on http://localhost:${PORT}`);
  console.log(`📁 Database: ${DB_PATH}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET    /api/transactions       - List all transactions`);
  console.log(`  GET    /api/transactions?month - Filter by month (YYYY-MM)`);
  console.log(`  GET    /api/transactions/:id   - Get single transaction`);
  console.log(`  POST   /api/transactions       - Create transaction`);
  console.log(`  PUT    /api/transactions/:id   - Update transaction`);
  console.log(`  DELETE /api/transactions/:id   - Delete transaction`);
  console.log(`  GET    /api/months             - List available months`);
  console.log(`  GET    /api/health             - Health check`);
});
