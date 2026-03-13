# Full-Stack Personal Finance Tracker 💰

A robust, full-stack web application designed to help users securely track their income and expenses, visualize their spending habits, and manage their finances across multiple currencies.

## 🚀 Features

* **Secure Authentication:** User registration and login pipeline protected by JSON Web Tokens (JWT) and bcrypt password hashing.
* **Complete CRUD Functionality:** Seamlessly create, read, and delete financial transactions with real-time UI updates.
* **Interactive Data Visualization:** Dynamic pie charts that automatically break down and visualize expenses by category using Recharts.
* **Multi-Currency Support:** Track transactions in various global currencies (₹ INR, $ USD, € EUR, £ GBP) with localized number formatting.
* **Protected Routes:** Backend API endpoints and frontend React routes secured via custom Express middleware and React Context.
* **Modern UI/UX:** Clean, responsive, and mobile-friendly interface built from scratch with Tailwind CSS.

## 🛠️ Tech Stack

**Frontend (Client)**
* React.js (via Vite)
* Tailwind CSS (Styling)
* Recharts (Data Visualization)
* React Router DOM (Navigation)
* Axios (API Client)

**Backend (Server & Database)**
* Node.js & Express.js (REST API)
* PostgreSQL (Hosted via Supabase)
* Prisma (ORM)
* JWT & bcrypt (Authentication & Security)

## 💻 Running the Project Locally

To run this project on your local machine, follow these steps:

### Prerequisites
* Node.js installed
* A PostgreSQL database (e.g., Supabase)

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/gittam06/finance-tracker.git
cd finance-tracker
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd backend
npm install
\`\`\`
Create a `.env` file in the `backend` directory and add your secret keys:
\`\`\`env
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_custom_jwt_secret"
PORT=5000
\`\`\`
Run database migrations and start the server:
\`\`\`bash
npx prisma migrate dev
node index.js
\`\`\`

### 3. Frontend Setup
Open a new terminal window and navigate to the frontend:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
The application will be running at `http://localhost:5173`.

---
*Developed by Gittam Pal*