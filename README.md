# Corporate Employee Management System (MERN Stack)

A full-stack Employee Management System built with MongoDB, Express.js, React (Vite), and Node.js. Corporate green/white theme with sidebar navigation, inspired by industrial/corporate sites like IFFCO.

## Features

- **JWT Authentication** — Signup / Login, protected routes, auto-logout on token expiry
- **Role-Based Permissions** — `admin` / `hr` / `manager` roles enforced both server-side (403s on restricted routes) and client-side (buttons hidden). Managers get read-only access plus attendance marking; admin/HR can manage everything.
- **Employee CRUD** — Add, edit, delete, search, and list employees with auto-generated Employee IDs
- **Department Management** — Create departments, assign employees, prevent deletion of departments still in use
- **Attendance Module** — Daily attendance grid (Present / Absent / Leave / Half-Day) per employee; a one-click "Auto-fill from attendance" button in the payroll form pulls the month's absence count directly into the payroll calculation
- **Employee Self-Service Portal** — A completely separate login (`/employee-login`) where employees view their own profile, attendance history, and payroll history, and download their own payslips. Admin/HR grants access per employee via a "Portal Access" button on the Employees page (sets an initial password). Enforced server-side: an employee token can never fetch another employee's data, and can never touch any admin-only route.
- **Payroll Management** — Base salary, allowances, bonus, deductions, absent-day proration, automatic net pay calculation
- **Payslip PDF Generation** — One-click branded PDF payslip download per payroll run (via `pdfkit`), plus a one-click **"Email Payslip"** button that sends the same PDF as an attachment via SMTP (nodemailer)
- **Dashboard** — Summary cards (total employees, departments, payroll runs, current month payout) + recent payroll table
- **Responsive UI** — Collapsible sidebar on mobile, Tailwind CSS, corporate green (#00693E) / white theme

## Tech Stack

| Layer     | Technology                                   |
|-----------|-----------------------------------------------|
| Frontend  | React 18, Vite, React Router, Tailwind CSS, Axios |
| Backend   | Node.js, Express.js                           |
| Database  | MongoDB + Mongoose                            |
| Auth      | JSON Web Tokens (JWT), bcryptjs                |
| PDF       | pdfkit                                        |

## Project Structure

```
ems/
├── backend/
│   ├── config/db.js
│   ├── models/          # User, Employee (with portal login fields), Department, Payroll, Attendance
│   ├── controllers/     # auth, employee, department, payroll, attendance, employeeAuth logic
│   ├── routes/          # includes employeeAuthRoutes.js for the self-service portal
│   ├── middleware/      # JWT auth guards: protect/authorize (staff), protectEmployee (portal)
│   ├── utils/           # PDF payslip generator, SMTP email sender, DB seed script
│   └── server.js
└── frontend/
    └── src/
        ├── api/               # axios.js (staff), employeeAxios.js (employee portal — separate token)
        ├── context/            # AuthContext.jsx (staff), EmployeeAuthContext.jsx (employee)
        ├── utils/permissions.js  # role-based UI helpers
        ├── components/        # Sidebar, Navbar, Layout, ProtectedRoute, EmployeeProtectedRoute, SummaryCard
        └── pages/              # staff: Login, Signup, Dashboard, Employees, Departments, Attendance, Payroll
                                 # employee: EmployeeLogin, EmployeePortal
```

## Local Setup

### Prerequisites
- Node.js 18+
- A MongoDB connection string — use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) (free tier) or a local `mongod` instance

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env and set MONGO_URI and JWT_SECRET
npm run seed   # optional: creates a default admin (admin@corporate.com / Admin@123) + sample departments
npm run dev    # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL should point to your backend, e.g. http://localhost:5000/api
npm run dev    # starts on http://localhost:5173
```

Open `http://localhost:5173`, sign up for a new account (or use the seeded admin), and start adding departments → employees → payroll runs.

## How Net Pay Is Calculated

```
perDayDeduction = baseSalary / 30
netPay = baseSalary + allowances + bonus - deductions - (absentDays × perDayDeduction)
```

This is recalculated server-side on every create/update so the frontend never has to be trusted for the math.

## Deployment (GitHub + Render + Vercel)

This repo is deploy-ready for a **free** live demo using Render (backend) + Vercel (frontend) + MongoDB Atlas (database). Steps:

### Step 1 — Push to GitHub
```bash
cd ems
git init
git add .
git commit -m "Initial commit: MERN Employee Management System"
git branch -M main
git remote add origin https://github.com/<your-username>/employee-management-system.git
git push -u origin main
```

### Step 2 — Database: MongoDB Atlas
1. Create a free cluster at https://cloud.mongodb.com
2. Add a database user + password
3. Under Network Access, allow access from anywhere (`0.0.0.0/0`) for demo purposes
4. Copy the connection string — this is your `MONGO_URI`

### Step 3 — Backend: Render
1. Go to https://render.com → New → Web Service → connect your GitHub repo
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, `CLIENT_URL=<your Vercel URL, set after step 4>`
6. Deploy — note the resulting URL, e.g. `https://ems-backend.onrender.com`

### Step 4 — Frontend: Vercel
1. Go to https://vercel.com → Add New → Project → import the same repo
2. Root directory: `frontend`
3. Framework preset: Vite
4. Environment variable: `VITE_API_URL=https://ems-backend.onrender.com/api`
5. Deploy — Vercel gives you a live URL, e.g. `https://ems-frontend.vercel.app`
6. Go back to Render and update `CLIENT_URL` to this Vercel URL, then redeploy the backend so CORS allows it

### Alternative: Single-service deploy on Render
The backend's `server.js` already serves `frontend/dist` as static files when `NODE_ENV=production`, so you can also deploy both as **one** Render service:
1. Build command: `cd frontend && npm install && npm run build && cd ../backend && npm install`
2. Start command: `cd backend && npm start`
3. Set `NODE_ENV=production` and `MONGO_URI` / `JWT_SECRET` in Render env vars

Once deployed, put your live URL(s) at the top of this README so anyone opening the repo can try the demo immediately.

## Default Login (after running `npm run seed`)
- Email: `admin@corporate.com`
- Password: `Admin@123`

Change this password (or delete the seeded user) before using in anything beyond a demo.

## Employee Self-Service Portal

Employees don't automatically get a login — this is by design, so HR controls who gets portal access:

1. Log in as admin/HR, go to **Employees**
2. Click **"Portal Access"** next to any employee
3. Set an initial password (at least 6 characters) and share it with the employee securely
4. The employee can now log in separately at **`/employee-login`** (linked from the main Login page) using their work email + that password
5. Their portal (`/employee-portal`) shows only their own profile, their own attendance history (filterable by month), and their own payroll/payslip history with download buttons — they cannot see or access any other employee's data, and cannot reach any admin-only route even if they have the URL

Employee sessions and staff (admin/HR/manager) sessions are stored under different keys, so the same browser can even be logged into both at once without conflict.

## Notes / Next Steps You May Want to Add
- Role-based permissions (the `role` field exists on `User` but routes aren't yet restricted by it)
- Attendance tracking feeding directly into `absentDays`
- Email delivery of payslips (e.g., via Nodemailer) instead of manual download
- Audit log for payroll edits
