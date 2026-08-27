import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ─── Role Definitions ──────────────────────────────────────
export const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  OPTOMETRIST: 'OPTOMETRIST',
  RECEPTIONIST: 'RECEPTIONIST',
  CASHIER: 'CASHIER',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// ─── Permission Definitions ─────────────────────────────────
export const PERMISSIONS = {
  // Dashboard
  VIEW_REVENUE: 'VIEW_REVENUE',
  VIEW_PATIENT_STATS: 'VIEW_PATIENT_STATS',
  VIEW_SALES_STATS: 'VIEW_SALES_STATS',
  VIEW_CLINICAL_STATS: 'VIEW_CLINICAL_STATS',
  VIEW_INVENTORY_STATS: 'VIEW_INVENTORY_STATS',
  VIEW_FINANCIAL_STATS: 'VIEW_FINANCIAL_STATS',

  // Patients
  VIEW_PATIENTS: 'VIEW_PATIENTS',
  CREATE_PATIENTS: 'CREATE_PATIENTS',
  EDIT_PATIENTS: 'EDIT_PATIENTS',
  DELETE_PATIENTS: 'DELETE_PATIENTS',

  // Clinical
  VIEW_EXAMINATIONS: 'VIEW_EXAMINATIONS',
  CREATE_EXAMINATIONS: 'CREATE_EXAMINATIONS',
  EDIT_EXAMINATIONS: 'EDIT_EXAMINATIONS',
  VIEW_PRESCRIPTIONS: 'VIEW_PRESCRIPTIONS',
  CREATE_PRESCRIPTIONS: 'CREATE_PRESCRIPTIONS',
  EDIT_PRESCRIPTIONS: 'EDIT_PRESCRIPTIONS',
  VIEW_FOLLOWUPS: 'VIEW_FOLLOWUPS',
  CREATE_FOLLOWUPS: 'CREATE_FOLLOWUPS',
  EDIT_FOLLOWUPS: 'EDIT_FOLLOWUPS',

  // Optical
  VIEW_SALES: 'VIEW_SALES',
  CREATE_SALES: 'CREATE_SALES',
  VIEW_SPECTACLE_ORDERS: 'VIEW_SPECTACLE_ORDERS',
  CREATE_SPECTACLE_ORDERS: 'CREATE_SPECTACLE_ORDERS',
  EDIT_SPECTACLE_ORDERS: 'EDIT_SPECTACLE_ORDERS',

  // Inventory
  VIEW_INVENTORY: 'VIEW_INVENTORY',
  CREATE_PRODUCTS: 'CREATE_PRODUCTS',
  EDIT_PRODUCTS: 'EDIT_PRODUCTS',
  DELETE_PRODUCTS: 'DELETE_PRODUCTS',
  VIEW_SUPPLIERS: 'VIEW_SUPPLIERS',
  CREATE_SUPPLIERS: 'CREATE_SUPPLIERS',
  EDIT_SUPPLIERS: 'EDIT_SUPPLIERS',

  // Finance
  VIEW_PAYMENTS: 'VIEW_PAYMENTS',
  CREATE_PAYMENTS: 'CREATE_PAYMENTS',
  VIEW_EXPENSES: 'VIEW_EXPENSES',
  CREATE_EXPENSES: 'CREATE_EXPENSES',
  VIEW_RECEIPTS: 'VIEW_RECEIPTS',

  // Analytics & Reports
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  VIEW_REPORTS: 'VIEW_REPORTS',
  EXPORT_REPORTS: 'EXPORT_REPORTS',

  // Staff
  VIEW_STAFF: 'VIEW_STAFF',
  CREATE_STAFF: 'CREATE_STAFF',
  EDIT_STAFF: 'EDIT_STAFF',
  DELETE_STAFF: 'DELETE_STAFF',
  VIEW_ATTENDANCE: 'VIEW_ATTENDANCE',

  // System
  VIEW_NOTIFICATIONS: 'VIEW_NOTIFICATIONS',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ─── Role → Permission Mapping ──────────────────────────────
const allPermissions: Permission[] = Object.values(PERMISSIONS) as Permission[];

const ownerPermissions: Permission[] = allPermissions;

const adminPermissions: Permission[] = allPermissions.filter((p) =>
  !p.includes('MANAGE_SETTINGS') // Settings is owner-only
);

const optometristPermissions: Permission[] = [
  PERMISSIONS.VIEW_REVENUE,
  PERMISSIONS.VIEW_PATIENT_STATS,
  PERMISSIONS.VIEW_CLINICAL_STATS,
  PERMISSIONS.VIEW_PATIENTS,
  PERMISSIONS.CREATE_PATIENTS,
  PERMISSIONS.EDIT_PATIENTS,
  PERMISSIONS.VIEW_EXAMINATIONS,
  PERMISSIONS.CREATE_EXAMINATIONS,
  PERMISSIONS.EDIT_EXAMINATIONS,
  PERMISSIONS.VIEW_PRESCRIPTIONS,
  PERMISSIONS.CREATE_PRESCRIPTIONS,
  PERMISSIONS.EDIT_PRESCRIPTIONS,
  PERMISSIONS.VIEW_FOLLOWUPS,
  PERMISSIONS.CREATE_FOLLOWUPS,
  PERMISSIONS.EDIT_FOLLOWUPS,
  PERMISSIONS.VIEW_SPECTACLE_ORDERS,
  PERMISSIONS.CREATE_SPECTACLE_ORDERS,
  PERMISSIONS.EDIT_SPECTACLE_ORDERS,
  PERMISSIONS.VIEW_SALES,
  PERMISSIONS.VIEW_INVENTORY,
  PERMISSIONS.VIEW_NOTIFICATIONS,
];

const receptionistPermissions: Permission[] = [
  PERMISSIONS.VIEW_PATIENT_STATS,
  PERMISSIONS.VIEW_PATIENTS,
  PERMISSIONS.CREATE_PATIENTS,
  PERMISSIONS.EDIT_PATIENTS,
  PERMISSIONS.VIEW_EXAMINATIONS,
  PERMISSIONS.VIEW_PRESCRIPTIONS,
  PERMISSIONS.VIEW_FOLLOWUPS,
  PERMISSIONS.CREATE_FOLLOWUPS,
  PERMISSIONS.VIEW_SALES,
  PERMISSIONS.VIEW_INVENTORY,
  PERMISSIONS.VIEW_NOTIFICATIONS,
];

const cashierPermissions: Permission[] = [
  PERMISSIONS.VIEW_REVENUE,
  PERMISSIONS.VIEW_SALES_STATS,
  PERMISSIONS.VIEW_PATIENTS,
  PERMISSIONS.VIEW_SALES,
  PERMISSIONS.CREATE_SALES,
  PERMISSIONS.VIEW_PAYMENTS,
  PERMISSIONS.CREATE_PAYMENTS,
  PERMISSIONS.VIEW_RECEIPTS,
  PERMISSIONS.VIEW_INVENTORY,
  PERMISSIONS.VIEW_NOTIFICATIONS,
];

const inventoryManagerPermissions: Permission[] = [
  PERMISSIONS.VIEW_INVENTORY_STATS,
  PERMISSIONS.VIEW_INVENTORY,
  PERMISSIONS.CREATE_PRODUCTS,
  PERMISSIONS.EDIT_PRODUCTS,
  PERMISSIONS.DELETE_PRODUCTS,
  PERMISSIONS.VIEW_SUPPLIERS,
  PERMISSIONS.CREATE_SUPPLIERS,
  PERMISSIONS.EDIT_SUPPLIERS,
  PERMISSIONS.VIEW_SALES,
  PERMISSIONS.VIEW_NOTIFICATIONS,
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: ownerPermissions,
  ADMIN: adminPermissions,
  OPTOMETRIST: optometristPermissions,
  RECEPTIONIST: receptionistPermissions,
  CASHIER: cashierPermissions,
  INVENTORY_MANAGER: inventoryManagerPermissions,
};

// ─── Auth Request Type ──────────────────────────────────────
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    permissions: Permission[];
  };
}

// ─── Auth Middleware ─────────────────────────────────────────
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    const role = decoded.role as Role;
    const permissions = ROLE_PERMISSIONS[role] || [];

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role,
      permissions,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Role Guard ─────────────────────────────────────────────
export const requireRole = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// ─── Permission Guard ───────────────────────────────────────
export const requirePermission = (permissions: Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const hasPermission = permissions.some((p) => req.user!.permissions.includes(p));
    if (!hasPermission) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }

    next();
  };
};
