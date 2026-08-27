import { Router, Request, Response } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Get all products with pagination and filtering
router.get(
  '/',
  authMiddleware,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('category').optional().isString(),
  query('search').optional().isString(),
  async (req: AuthRequest, res: Response) => {
    try {
      const page = (req.query.page as any) || 1;
      const limit = (req.query.limit as any) || 10;
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;

      const skip = (page - 1) * limit;

      const where: any = { status: 'ACTIVE' };
      if (category) where.category = category;
      if (search) {
        where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }, { brand: { contains: search, mode: 'insensitive' } }];
      }

      const [products, total, lowStockCount] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.product.count({ where }),
        prisma.product.count({
          where: { quantity: { lte: prisma.product.fields.minimumStock } },
        }),
      ]);

      res.json({
        products,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
        stats: {
          lowStockCount,
        },
      });
    } catch (error: any) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get product by ID
router.get(
  '/:id',
  authMiddleware,
  param('id').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          stockMovements: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create new product
router.post(
  '/',
  authMiddleware,
  [
    body('sku').notEmpty().trim(),
    body('name').notEmpty().trim(),
    body('category').isIn(['FRAMES', 'LENSES', 'CONTACT_LENSES', 'ACCESSORIES']),
    body('brand').notEmpty().trim(),
    body('purchasePrice').isFloat({ min: 0 }),
    body('sellingPrice').isFloat({ min: 0 }),
    body('quantity').isInt({ min: 0 }),
    body('minimumStock').isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sku, barcode, name, category, brand, description, purchasePrice, sellingPrice, quantity, minimumStock, supplier, status } = req.body;

      const product = await prisma.product.create({
        data: {
          sku,
          barcode,
          name,
          category,
          brand,
          description,
          purchasePrice: parseFloat(purchasePrice),
          sellingPrice: parseFloat(sellingPrice),
          quantity: parseInt(quantity),
          minimumStock: parseInt(minimumStock),
          supplier,
          status: status || 'ACTIVE',
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'created',
          entity: 'Product',
          entityId: product.id,
        },
      });

      res.status(201).json({
        message: 'Product created successfully',
        product,
      });
    } catch (error: any) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Update product
router.put(
  '/:id',
  authMiddleware,
  param('id').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, brand, description, purchasePrice, sellingPrice, quantity, minimumStock, supplier, status } = req.body;

      const product = await prisma.product.update({
        where: { id },
        data: {
          name,
          brand,
          description,
          purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : undefined,
          sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
          quantity: quantity !== undefined ? parseInt(quantity) : undefined,
          minimumStock: minimumStock !== undefined ? parseInt(minimumStock) : undefined,
          supplier,
          status,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'updated',
          entity: 'Product',
          entityId: id,
        },
      });

      res.json({
        message: 'Product updated successfully',
        product,
      });
    } catch (error: any) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get inventory dashboard stats
router.get('/dashboard/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [totalProducts, totalQuantity, inventoryValue, lowStockProducts, outOfStockProducts] = await Promise.all([
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.product.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { quantity: true },
      }),
      prisma.product.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { quantity: true },
      }),
      prisma.product.findMany({
        where: { quantity: { lte: prisma.product.fields.minimumStock } },
        take: 10,
      }),
      prisma.product.count({ where: { quantity: 0 } }),
    ]);

    // Calculate inventory value (sum of quantity * sellingPrice)
    const allProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { quantity: true, sellingPrice: true },
    });

    const value = allProducts.reduce((sum, p) => sum + p.quantity * p.sellingPrice, 0);

    res.json({
      totalProducts,
      totalUnits: totalQuantity._sum.quantity || 0,
      inventoryValue: value,
      lowStockProducts: lowStockProducts.length,
      outOfStockProducts,
      lowStockItems: lowStockProducts,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
