# LISS Eye Care Services Management Platform

A premium, production-quality management system for eye care businesses. This is a complete vertical slice demonstrating a real connected workflow from patient registration through analytics.

## 🎯 Project Overview

This platform provides a complete patient journey management system for optical/eye care services:
- Patient Management
- Eye Examinations
- Prescriptions
- Optical Sales (POS)
- Inventory Management
- Payments & Receipts
- Follow-up Management
- Owner Analytics & Reporting

## 📚 Architecture

### Tech Stack
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Charts**: Recharts
- **PDF Generation**: pdfkit
- **State Management**: Zustand

### Directory Structure
```
lisseyecare/
├── backend/              # Express server
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── scripts/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
├── frontend/             # React application
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   ├── components/
│   │   ├── store/
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── IMPLEMENTATION_PLAN.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Backend Setup

1. **Navigate to backend**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your PostgreSQL connection string
```

4. **Setup database**
```bash
npm run db:migrate
npm run db:seed
```

5. **Start development server**
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
```

4. **Start development server**
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🔐 Demo Credentials

**Email:** admin@lisseyecare.com  
**Password:** password123  
**Role:** ADMIN

The demo account has full access to all modules.

## 📊 Database Models

### Core Entities
- **User**: Authentication & roles (ADMIN, OPTOMETRIST, CASHIER)
- **Patient**: Patient information & medical history
- **EyeExamination**: Clinical eye examination records
- **Prescription**: Digital prescriptions linked to examinations
- **Product**: Inventory items (frames, lenses, accessories)
- **OpticalSale**: Sales transactions (invoice)
- **OpticalSaleItem**: Line items in sales
- **Payment**: Payment records for sales
- **Receipt**: Generated receipts
- **FollowUp**: Patient follow-up scheduling
- **StockMovement**: Inventory tracking
- **AuditLog**: Action audit trail
- **Notification**: System notifications

## 📋 API Endpoints

All endpoints require Bearer token authentication in header:
```
Authorization: Bearer <token>
```

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Eye Examinations
- `GET /api/examinations` - List examinations
- `POST /api/examinations` - Create examination
- `GET /api/examinations/:id` - Get examination details
- `PUT /api/examinations/:id` - Update examination

### Prescriptions
- `GET /api/prescriptions` - List prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions/:id` - Get prescription
- `PUT /api/prescriptions/:id` - Update prescription

### Products & Inventory
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product
- `PUT /api/products/:id` - Update product

### Optical Sales
- `GET /api/optical-sales` - List sales
- `POST /api/optical-sales` - Create sale
- `GET /api/optical-sales/:id` - Get sale details

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment

### Receipts
- `GET /api/receipts` - List receipts
- `POST /api/receipts` - Generate receipt
- `GET /api/receipts/:id/pdf` - Download receipt PDF

### Follow-ups
- `GET /api/follow-ups` - List follow-ups
- `POST /api/follow-ups` - Create follow-up
- `PUT /api/follow-ups/:id` - Update follow-up

### Dashboard
- `GET /api/dashboard/kpis` - Get KPI data
- `GET /api/dashboard/today` - Get today's data

### Analytics
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/patients` - Patient analytics
- `GET /api/analytics/sales` - Sales analytics

### Search
- `GET /api/search?q=query` - Global search

## 🧪 Testing Workflow

Complete end-to-end test to verify the system:

1. Login as admin
2. Create a new patient (e.g., "David James")
3. Create an eye examination for the patient
4. Enter refraction values for right/left eyes
5. Create a prescription from the examination
6. Create an optical sale linked to patient & prescription
7. Add frame and lens products to the sale
8. Verify inventory decreases automatically
9. Generate invoice
10. Record partial payment
11. Verify outstanding balance calculates correctly
12. Generate receipt
13. Schedule follow-up
14. Return to dashboard
15. Verify all metrics updated
16. Open analytics
17. Verify new transaction appears
18. Refresh browser
19. Verify all data persists

## 📦 Database Seeding

The seed script creates realistic demo data:
- 20+ patients with Nigerian names
- 30+ optical products
- 15+ eye examinations
- 10+ prescriptions  
- 15+ optical sales
- 15+ payments
- 10+ follow-ups
- Low-stock alerts
- Outstanding payments

Run seed:
```bash
cd backend
npm run db:seed
```

Reset database (careful - deletes all data):
```bash
npm run db:reset
```

## 🔄 Data Flow

The system maintains a real connected workflow:

```
Create Patient
     ↓
Create Eye Examination
     ↓
Create Prescription
     ↓
Create Optical Sale
     ↓
Inventory automatically decreases
     ↓
Generate Invoice
     ↓
Record Payment
     ↓
Generate Receipt
     ↓
Schedule Follow-up
     ↓
Dashboard updates
     ↓
Analytics updates
```

**All data persists to PostgreSQL** - Browser refresh maintains all state.

## 🎨 UI/UX Features

- Premium, professional design
- Responsive: Desktop, tablet, mobile
- Loading states & skeleton loaders
- Success/error notifications
- Form validation
- Empty states
- Confirmation dialogs
- Smooth animations
- Keyboard accessibility
- Dark/light mode ready

## 🔒 Security

- JWT authentication
- Password hashing with bcryptjs
- Role-based access control
- Protected API endpoints
- Client-side & server-side validation
- Audit logging for critical actions

## 📝 Implementation Stages

See `IMPLEMENTATION_PLAN.md` for the detailed 24-stage implementation breakdown covering:
1. Foundation & Setup
2. Core Data & Persistence
3. Application Shell
4. Dashboard
5. Patient Management
6. Clinical Workflow
7. Inventory & Logistics
8. Payments & Receipts
9. Follow-up Management
10. Analytics & Insights
11. Advanced Features
12. Testing & Deployment

## 🚧 Current Status

**Stage 1-3 COMPLETED**: Foundation & Setup
- ✅ Project structure initialized
- ✅ Database schema designed
- ✅ Authentication system created
- ✅ API routes scaffolded

**Next**: Stages 4-5 (Database Seeding & API Implementation)

## 📞 Support

For issues or questions, refer to the implementation plan or the inline code documentation.

## 📄 License

Internal Project - LISS Eye Care Services

---

**Last Updated**: August 27, 2026  
**Status**: In Development - Active Implementation
