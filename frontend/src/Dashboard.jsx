import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import api from './api';
// Import Recharts components
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

// Colors for our pie chart slices
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

function Dashboard() {
  const { user, logout } = useContext(AuthContext); // Get user info and logout function
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');



  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get('/transactions'); 
        setTransactions(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!amount || !category) return; 

    try {
      const newTxn = {
        amount: parseFloat(amount),
        type,
        category,
        description,
      };

      const response = await api.post('/transactions', newTxn);
      setTransactions([response.data, ...transactions]);
      
      setAmount('');
      setCategory('');
      setDescription('');
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  // --- Handle Delete ---
  const handleDelete = async (id) => {
    // Confirm before deleting
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await api.delete(`/transactions/${id}`);
      // Update the UI by filtering out the deleted transaction
      setTransactions(transactions.filter(txn => txn.id !== id));
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  // --- Process Data for the Chart ---
  // We use useMemo so it only recalculates when 'transactions' changes
  const expensesByCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'EXPENSE');
    
    // Group expenses by category
    const grouped = expenses.reduce((acc, current) => {
      acc[current.category] = (acc[current.category] || 0) + current.amount;
      return acc;
    }, {});

    // Convert the grouped object into the array format Recharts expects: [{ name: 'Food', value: 50 }, ...]
    return Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key]
    })).sort((a, b) => b.value - a.value); // Sort biggest expenses first
  }, [transactions]);

  // Calculate Totals
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header & Summary Cards */}
        <header className="mb-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Personal Finance Tracker</h1>
              <p className="text-gray-600">Welcome back, {user?.name}!</p>
            </div>
            <button onClick={logout} className="text-red-500 hover:text-red-700 font-medium">Logout</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
              <p className="text-sm text-gray-500 font-semibold">Current Balance</p>
              <p className="text-2xl font-bold text-gray-800">${balance.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
              <p className="text-sm text-gray-500 font-semibold">Total Income</p>
              <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
            </div>
             <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
              <p className="text-sm text-gray-500 font-semibold">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">${totalExpense.toFixed(2)}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Add Transaction Form (Takes up 2/3 width on large screens) */}
          <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2 h-fit">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Add New Transaction</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Description</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Groceries" className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-sm text-gray-600 mb-1">Amount ($)</label>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-1/3">
                  <label className="block text-sm text-gray-600 mb-1">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Category</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Food" className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-2 px-8 rounded hover:bg-blue-700 transition duration-200 h-[42px]">
                  Add
                </button>
              </div>
            </form>
          </div>

          {/* Expense Breakdown Chart (Takes up 1/3 width) */}
          <div className="bg-white rounded-xl shadow-md p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Expense Breakdown</h2>
            {expensesByCategory.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `$${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No expense data to display.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Recent Transactions</h2>
          
          {loading ? (
            <p className="text-gray-500">Loading your data...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500">No transactions found. Start spending!</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div key={txn.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-800">{txn.description || txn.category}</p>
                    <p className="text-sm text-gray-500">{txn.category} • {new Date(txn.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`font-bold ${txn.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.type === 'INCOME' ? '+' : '-'}${txn.amount}
                    </div>
                    <button 
                      onClick={() => handleDelete(txn.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors text-sm"
                      title="Delete Transaction"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;