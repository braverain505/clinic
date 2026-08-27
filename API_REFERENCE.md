# LISS Eye Care - Complete API Endpoint Reference

**Status**: Backend implementation complete for all core modules
**Database**: PostgreSQL with Prisma ORM
**Authentication**: JWT-based with role-based access control

---

## API Endpoints Summary

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user
```
Body: {
  email: string,
  password: string (min 6 chars),
  fullName: string,
  role?: "ADMIN" | "OPTOMETRIST" | "CASHIER" (default: ADMIN)
}
Response: { message, user: { id, email, fullName, role } }
```

#### POST `/api/auth/login`
User login
```
Body: { email: string, password: string }
Response: { message, token: string, user: { id, email, fullName, role } }
```

#### GET `/api/auth/me`
Get current authenticated user
```
Header: Authorization: Bearer <token>
Response: { id, email, fullName, role }
```

---

## Patient Management Endpoints

#### GET `/api/patients`
List all patients with pagination and search
```
Query params:
  - page?: number (default 1)
  - limit?: number (default 10, max 100)
  - search?: string (searches name, phone, email, ID)
Response: { patients[], pagination: { total, page, limit, pages } }
```

#### GET `/api/patients/:id`
Get patient details
```
Response: {
  id, patientId, firstName, lastName, phone, email, gender, dateOfBirth,
  address, city, state, country, medicalHistory, ocularHistory, allergies,
  examinations[], prescriptions[], opticalSales[], payments[], followUps[]
}
```

#### POST `/api/patients`
Create new patient
```
Body: {
  firstName: string,
  lastName: string,
  phone: string,
  email?: string,
  gender: "MALE" | "FEMALE" | "OTHER",
  dateOfBirth?: ISO date,
  address?: string,
  city?: string,
  state?: string,
  country?: string,
  medicalHistory?: string,
  ocularHistory?: string,
  allergies?: string
}
Response: { message, patient: {} }
```

#### PUT `/api/patients/:id`
Update patient information
```
Body: { ...same as POST, all optional }
Response: { message, patient: {} }
```

#### DELETE `/api/patients/:id`
Delete patient
```
Response: { message }
```

---

## Eye Examination Endpoints

#### GET `/api/examinations`
List eye examinations
```
Query params:
  - page?: number
  - limit?: number
  - patientId?: string (filter by patient)
Response: { examinations[], pagination }
```

#### GET `/api/examinations/:id`
Get examination details
```
Response: {
  id, examId, patientId, userId, examinationDate,
  vaRightDistance, vaLeftDistance, vaBothDistance, vaRightNear, vaLeftNear, vaBothNear,
  rhSphere, rhCylinder, rhAxis, rhAdd, rhPrism,
  lhSphere, lhCylinder, lhAxis, lhAdd, lhPrism,
  pupillaryDistance, nearPD,
  tonometry, colourVision, keratometry, visualFields, otherTests,
  clinicalNotes, diagnosis, treatment,
  patient: {}, optometrist: {}, prescriptions: []
}
```

#### POST `/api/examinations`
Create eye examination
```
Body: {
  patientId: string,
  examinationDate?: ISO date,
  vaRightDistance?: string,
  vaLeftDistance?: string,
  rhSphere?: number,
  rhCylinder?: number,
  rhAxis?: number,
  rhAdd?: number,
  rhPrism?: number,
  lhSphere?: number,
  lhCylinder?: number,
  lhAxis?: number,
  lhAdd?: number,
  lhPrism?: number,
  pupillaryDistance?: number,
  nearPD?: number,
  tonometry?: string,
  colourVision?: string,
  keratometry?: string,
  visualFields?: string,
  clinicalNotes?: string,
  diagnosis?: string,
  treatment?: string
}
Response: { message, examination: {} }
```

#### PUT `/api/examinations/:id`
Update examination
```
Body: { ...all fields optional }
Response: { message, examination: {} }
```

---

## Prescription Endpoints

#### GET `/api/prescriptions`
List prescriptions
```
Query params:
  - page?: number
  - limit?: number
  - patientId?: string
Response: { prescriptions[], pagination }
```

#### GET `/api/prescriptions/:id`
Get prescription details
```
Response: {
  id, rxId, patientId, examinationId,
  rhSphere, rhCylinder, rhAxis, rhAdd, rhPrism,
  lhSphere, lhCylinder, lhAxis, lhAdd, lhPrism,
  pupillaryDistance, recommendations, reviewDate,
  patient: {}, examination: {}, optometrist: {}
}
```

#### POST `/api/prescriptions`
Create prescription from examination
```
Body: {
  patientId: string,
  examinationId: string,
  rhSphere?: number,
  rhCylinder?: number,
  rhAxis?: number,
  rhAdd?: number,
  rhPrism?: number,
  lhSphere?: number,
  lhCylinder?: number,
  lhAxis?: number,
  lhAdd?: number,
  lhPrism?: number,
  pupillaryDistance?: number,
  recommendations?: string,
  reviewDate?: ISO date
}
Response: { message, prescription: {} }
```

#### PUT `/api/prescriptions/:id`
Update prescription
```
Body: { ...all fields optional }
Response: { message, prescription: {} }
```

---

## Product/Inventory Endpoints

#### GET `/api/products`
List products
```
Query params:
  - page?: number
  - limit?: number
  - category?: "FRAMES" | "LENSES" | "CONTACT_LENSES" | "ACCESSORIES"
  - search?: string (name, SKU, brand)
Response: { products[], pagination, stats: { lowStockCount } }
```

#### GET `/api/products/:id`
Get product details
```
Response: {
  id, sku, barcode, name, category, brand, description,
  purchasePrice, sellingPrice, quantity, minimumStock,
  supplier, status, stockMovements: []
}
```

#### POST `/api/products`
Create product
```
Body: {
  sku: string,
  barcode?: string,
  name: string,
  category: "FRAMES" | "LENSES" | "CONTACT_LENSES" | "ACCESSORIES",
  brand: string,
  description?: string,
  purchasePrice: number,
  sellingPrice: number,
  quantity: number,
  minimumStock: number,
  supplier?: string,
  status?: "ACTIVE" | "INACTIVE" | "DISCONTINUED"
}
Response: { message, product: {} }
```

#### PUT `/api/products/:id`
Update product
```
Body: { ...all fields optional }
Response: { message, product: {} }
```

#### GET `/api/products/dashboard/stats`
Get inventory dashboard stats
```
Response: {
  totalProducts, totalUnits, inventoryValue, lowStockProducts, outOfStockProducts,
  lowStockItems: []
}
```

---

## Optical Sale (POS) Endpoints

#### GET `/api/optical-sales`
List optical sales
```
Query params:
  - page?: number
  - limit?: number
  - patientId?: string
Response: { sales[], pagination }
```

#### GET `/api/optical-sales/:id`
Get sale details
```
Response: {
  id, invoiceId, patientId, prescriptionId,
  subtotal, discount, total, paymentStatus, amountPaid, outstandingBalance,
  createdAt, updatedAt,
  patient: {}, prescription: {}, items: []
}
```

#### POST `/api/optical-sales`
Create optical sale (POS transaction)
```
Body: {
  patientId: string,
  prescriptionId?: string,
  discount?: number (default 0),
  paymentStatus?: "UNPAID" | "PARTIALLY_PAID" | "PAID",
  items: [
    {
      productId: string,
      quantity: number
    }
  ]
}
Response: { message, sale: {} }
Note: Automatically decreases inventory and creates stock movements
```

#### PUT `/api/optical-sales/:id/payment-status`
Update payment status
```
Body: {
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID"
}
Response: { message, sale: {} }
```

---

## Payment Endpoints

#### GET `/api/payments`
List all payments
```
Response: payments[] with patient, sale, receivedBy details
```

#### GET `/api/payments/:id`
Get payment details
```
Response: {
  id, saleId, patientId, amount, paymentMethod, reference,
  paymentDate, createdAt,
  patient: {}, sale: {}, receivedBy: {}
}
```

#### POST `/api/payments`
Record payment for a sale
```
Body: {
  saleId: string,
  amount: number,
  paymentMethod: "CASH" | "BANK_TRANSFER" | "POS" | "CARD",
  reference?: string,
  paymentDate?: ISO date
}
Response: { message, payment: {} }
Note: Automatically updates sale payment status and outstanding balance
```

#### GET `/api/payments/summary/outstanding`
Get outstanding payments summary
```
Response: {
  totalOutstanding, count,
  sales: []
}
```

---

## Receipt Endpoints

#### GET `/api/receipts`
List all receipts
```
Response: receipts[]
```

#### GET `/api/receipts/:id`
Get receipt details
```
Response: {
  id, receiptNumber, saleId, patientName, patientId, invoiceNumber,
  items, subtotal, discount, grandTotal, amountPaid, balance,
  paymentMethod, receivedBy, createdAt
}
```

#### POST `/api/receipts`
Generate receipt for a sale
```
Body: { saleId: string }
Response: { message, receipt: {} }
Note: Creates a receipt record from completed sale
```

#### GET `/api/receipts/:id/pdf`
Download receipt as PDF
```
Response: PDF file (implementation needed)
```

---

## Follow-up Endpoints

#### GET `/api/follow-ups`
List follow-ups
```
Query params:
  - status?: "PENDING" | "CONTACTED" | "SCHEDULED" | "COMPLETED" | "MISSED"
Response: {
  followUps[],
  categorized: {
    dueToday: [],
    dueThisWeek: [],
    overdue: []
  }
}
```

#### GET `/api/follow-ups/:id`
Get follow-up details
```
Response: {
  id, patientId, examinationId, reason, followUpDate,
  assignedStaff, notes, status,
  patient: {}, examination: {}
}
```

#### POST `/api/follow-ups`
Create follow-up
```
Body: {
  patientId: string,
  examinationId?: string,
  reason: string,
  followUpDate: ISO date,
  assignedStaff?: string,
  notes?: string,
  status: "PENDING" | "CONTACTED" | "SCHEDULED" | "COMPLETED" | "MISSED"
}
Response: { message, followUp: {} }
```

#### PUT `/api/follow-ups/:id`
Update follow-up
```
Body: {
  reason?: string,
  followUpDate?: ISO date,
  assignedStaff?: string,
  notes?: string,
  status?: string
}
Response: { message, followUp: {} }
```

---

## Dashboard Endpoints

#### GET `/api/dashboard`
Get today's KPI dashboard data
```
Response: {
  kpis: {
    todayRevenue: { value, change, comparison },
    patientsToday: { value, change, comparison },
    eyeExaminations: { value, change, comparison },
    opticalSales: { value, change, comparison },
    outstandingPayments: { value, count, comparison },
    pendingFollowUps: { value, comparison }
  },
  todaysSummary: { sales, revenue, examinations, patients }
}
```

#### GET `/api/dashboard/attention`
Get items needing attention
```
Response: {
  needsAttention: {
    overdue_followups, low_stock_items, outstanding_payments,
    items: {
      overdue_followups: [],
      low_stock_products: [],
      outstanding_sales: []
    }
  }
}
```

---

## Analytics Endpoints

#### GET `/api/analytics/revenue`
Revenue analytics
```
Query params:
  - filter?: "today" | "7days" | "30days" | "month" | "year"
Response: {
  period, totalRevenue, avgDaily, transactions,
  byDate: [{ date, amount }]
}
```

#### GET `/api/analytics/patients`
Patient analytics
```
Query params:
  - filter?: same as above
Response: {
  period, totalPatients, newPatients, returningPatients, growth
}
```

#### GET `/api/analytics/sales`
Sales analytics
```
Query params:
  - filter?: same as above
Response: {
  period, totalSales, totalRevenue, avgSale,
  byCategory: { FRAMES: {count, revenue}, ... }
}
```

#### GET `/api/analytics/financial`
Financial analytics
```
Query params:
  - filter?: same as above
Response: {
  period, totalRevenue, totalPaid, totalOutstanding, totalDiscount
}
```

#### GET `/api/analytics/clinical`
Clinical analytics
```
Query params:
  - filter?: same as above
Response: {
  period, examinations, prescriptions, followups
}
```

---

## Search Endpoints

#### GET `/api/search?q=query`
Global search across all entities
```
Query params:
  - q: string (search term, required)
Response: {
  query, results: {
    patients: [],
    prescriptions: [],
    sales: [],
    products: [],
    payments: []
  },
  summary: {
    patients, prescriptions, sales, products, payments, total
  }
}
```

---

## Authentication

All endpoints (except `/api/auth/register` and `/api/auth/login`) require:
```
Header: Authorization: Bearer <jwt_token>
```

Token is obtained from login and includes user `id`, `email`, and `role`.

---

## Error Responses

All errors return appropriate HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `500` - Server Error

Error response format:
```
{ error: "Error message" }
```

Validation errors:
```
{ errors: [{ msg, param, value }] }
```

---

## Database Relationships

### Patient
- Has many: EyeExaminations, Prescriptions, OpticalSales, Payments, FollowUps

### EyeExamination
- Belongs to: Patient, User (optometrist)
- Has many: Prescriptions, FollowUps

### Prescription
- Belongs to: Patient, EyeExamination, User (optometrist)
- Has many: OpticalSales

### OpticalSale
- Belongs to: Patient, Prescription (optional)
- Has many: OpticalSaleItems, Payments, Receipt

### OpticalSaleItem
- Belongs to: OpticalSale, Product

### Product
- Has many: OpticalSaleItems, StockMovements

### StockMovement
- Belongs to: Product, User
- Tracks: quantity changes from sales, purchases, adjustments

### Payment
- Belongs to: OpticalSale, Patient, User

### Receipt
- Belongs to: OpticalSale

### FollowUp
- Belongs to: Patient, EyeExamination (optional)

### AuditLog
- Belongs to: User
- Tracks: all important actions (create, update, delete)

---

## Demo Credentials

```
Email: admin@lisseyecare.com
Password: password123
Role: ADMIN
```

Additional demo users created during seeding:
- optometrist@lisseyecare.com (Dr. Chioma Okafor)
- cashier@lisseyecare.com (Tunde Adeyemi)

---

## Testing the API

### Quick Start Flow
1. **Login** → `POST /api/auth/login`
2. **Create Patient** → `POST /api/patients`
3. **Create Examination** → `POST /api/examinations`
4. **Create Prescription** → `POST /api/prescriptions`
5. **Create Optical Sale** → `POST /api/optical-sales` (auto-decreases inventory)
6. **Record Payment** → `POST /api/payments` (auto-updates balance)
7. **Generate Receipt** → `POST /api/receipts`
8. **Create Follow-up** → `POST /api/follow-ups`
9. **Check Dashboard** → `GET /api/dashboard`
10. **Check Analytics** → `GET /api/analytics/revenue`

All data persists to PostgreSQL and survives server restart.

---

## Real Data Flow

The complete workflow maintains data integrity:
- ✅ Patient created
- ✅ Examination linked to patient
- ✅ Prescription linked to exam & patient
- ✅ Optical sale linked to prescription & patient
- ✅ Inventory automatically decreases on sale
- ✅ Stock movements recorded
- ✅ Payment linked to sale & patient
- ✅ Sale payment status updated
- ✅ Outstanding balance calculated
- ✅ Receipt generated
- ✅ Follow-up linked to exam & patient
- ✅ Dashboard KPIs updated
- ✅ Analytics updated
- ✅ All actions audited

**Browser refresh = All data persists** ✅
