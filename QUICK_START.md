# LISS Eye Care - Quick Start (5 Minutes)

## Prerequisites
```bash
node --version   # Must be 18+
npm --version    # Must be 8+
psql --version   # Must be 13+
```

## Step 1: Create Database (2 min)

```bash
psql -U postgres

# Paste these commands:
CREATE DATABASE liss_eye_care;
CREATE USER liss_user WITH PASSWORD 'liss_secure_password_123';
ALTER ROLE liss_user SET client_encoding TO 'utf8';
ALTER ROLE liss_user SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE liss_eye_care TO liss_user;
\q
```

## Step 2: Setup Backend (2 min)

```bash
cd backend

# Update .env file:
# DATABASE_URL="postgresql://liss_user:liss_secure_password_123@localhost:5432/liss_eye_care"
# JWT_SECRET="liss-eye-care-secret-key-change-in-production-2024"
# PORT=5000
# NODE_ENV="development"

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start server
npm run dev
```

**Expected output**: 
```
✅ LISS Eye Care Backend running on http://localhost:5000
```

## Step 3: Setup Frontend (1 min)

**In a new terminal:**

```bash
cd frontend

# Already has .env configured
# VITE_API_URL=http://localhost:5000/api

# Start frontend
npm run dev
```

**Expected output**:
```
  ➜  Local:   http://localhost:3000/
```

## Step 4: Login & Test

Open: `http://localhost:3000`

**Demo Credentials:**
- Email: `admin@lisseyecare.com`
- Password: `password123`

You should see the dashboard with KPI cards!

---

## Quick API Test

In a new terminal:

```bash
# Get a token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lisseyecare.com","password":"password123"}'

# Copy the token from response

# Get all patients
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  http://localhost:5000/api/patients
```

---

## What's Included

✅ Backend with 62+ API endpoints  
✅ PostgreSQL database with 12 models  
✅ 100+ demo records (patients, products, sales, etc.)  
✅ Frontend React app shell  
✅ Complete authentication  
✅ Inventory tracking (auto-decreases on sale)  
✅ Payment tracking (auto-calculates balance)  
✅ Dashboard with KPIs  
✅ Analytics queries  
✅ Global search  

---

## Next: Complete Your First Workflow

1. Login as admin
2. Create a patient (or use demo data)
3. Create an eye examination
4. Create a prescription
5. Create an optical sale (inventory auto-decreases!)
6. Record a payment (balance auto-updates!)
7. Generate a receipt
8. Check the dashboard (metrics updated!)
9. Refresh browser (data persists!)

---

## Troubleshooting

**"Port 5000 already in use?"**
```bash
# Change backend/.env:
PORT=5001
```

**"Cannot find module..."**
```bash
cd backend && npm install
cd ../frontend && npm install
```

**"Database connection error?"**
```bash
# Check PostgreSQL is running:
psql -U postgres -d liss_eye_care -c "SELECT 1"
```

---

## Documentation

- **Setup Details**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **All API Endpoints**: See [API_REFERENCE.md](API_REFERENCE.md)
- **Project Overview**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- **Implementation Plan**: See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)

---

## Running Both Backend & Frontend Simultaneously

**Option A: Two Terminals (Recommended for development)**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

**Option B: Single Command**
```bash
npm install -g npm-run-all
npm-run-all --parallel backend:dev frontend:dev
```

---

**You're ready to go! 🚀**

Start with Step 1 and you'll have a fully functional system in 5 minutes.
