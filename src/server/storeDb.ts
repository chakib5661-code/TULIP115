import fs from 'fs';
import path from 'path';
import {
  Product,
  PreOrder,
  CustomerApplication,
  CustomerUser,
  AdBanner,
  StoreSettings,
  CustomerAccountStatus,
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS } from '../data/initialProducts';
import { INITIAL_CUSTOMER_APPLICATIONS, INITIAL_AD_BANNERS } from '../data/initialCustomerData';

export interface ServerDatabase {
  products: Product[];
  orders: PreOrder[];
  customerApplications: CustomerApplication[];
  customerUsers: CustomerUser[];
  adBanners: AdBanner[];
  storeSettings: StoreSettings;
  lastUpdated: string;
}

const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_DIR = process.env.DATA_DIR || (IS_VERCEL ? path.join('/tmp', 'tulip-data') : path.join(process.cwd(), 'data'));
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'store_db.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'store_db.json');

function normalizePhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  // Extract last 9 digits for Algerian numbers (e.g. 799938399 from 0799938399 or +213799938399)
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

function getInitialDatabase(): ServerDatabase {
  const initialUsers: CustomerUser[] = INITIAL_CUSTOMER_APPLICATIONS.filter(
    (app) => app.status === 'approved'
  ).map((app) => ({
    id: app.id,
    username: app.assignedUsername || app.email.split('@')[0],
    password: app.assignedPassword || 'tulip2026',
    fullName: app.fullName,
    companyName: app.companyName,
    email: app.email,
    phone: app.phone,
    secondaryPhone: app.secondaryPhone,
    wilayaCode: app.wilayaCode,
    wilayaName: app.wilayaName,
    commune: app.commune,
    deliveryAddress: app.deliveryAddress,
    status: 'approved',
    createdAt: app.approvedAt || app.submittedAt,
  }));

  return {
    products: INITIAL_PRODUCTS,
    orders: [],
    customerApplications: INITIAL_CUSTOMER_APPLICATIONS,
    customerUsers: initialUsers,
    adBanners: INITIAL_AD_BANNERS,
    storeSettings: INITIAL_STORE_SETTINGS,
    lastUpdated: new Date().toISOString(),
  };
}

let cachedDb: ServerDatabase | null = null;
let isOptimizingImages = false;

async function optimizeBase64Image(dataUrl: string, maxDim = 800, quality = 80): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/') || dataUrl.length < 100 * 1024) {
    return dataUrl;
  }
  try {
    const sharp = require('sharp');
    const matches = dataUrl.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return dataUrl;
    const buffer = Buffer.from(matches[2], 'base64');
    const optimized = await sharp(buffer)
      .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    return `data:image/webp;base64,${optimized.toString('base64')}`;
  } catch {
    return dataUrl;
  }
}

export async function optimizeDatabaseImagesAsync(db: ServerDatabase): Promise<void> {
  if (isOptimizingImages) return;
  isOptimizingImages = true;
  try {
    let changed = false;
    for (let i = 0; i < db.products.length; i++) {
      const p = db.products[i];
      if (p.imageUrl && p.imageUrl.startsWith('data:image/') && p.imageUrl.length > 100 * 1024) {
        const opt = await optimizeBase64Image(p.imageUrl, 800, 80);
        if (opt !== p.imageUrl) {
          p.imageUrl = opt;
          changed = true;
        }
      }
    }
    for (let j = 0; j < db.adBanners.length; j++) {
      const b = db.adBanners[j];
      if (b.imageUrl && b.imageUrl.startsWith('data:image/') && b.imageUrl.length > 100 * 1024) {
        const opt = await optimizeBase64Image(b.imageUrl, 1080, 80);
        if (opt !== b.imageUrl) {
          b.imageUrl = opt;
          changed = true;
        }
      }
    }
    if (changed) {
      console.log('[StoreDB] Optimized high-resolution images to lightweight WebP.');
      persistDatabase(db);
    }
  } catch (err) {
    console.warn('[StoreDB] Image optimization notice:', err);
  } finally {
    isOptimizingImages = false;
  }
}

export function loadDatabase(): ServerDatabase {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE) && fs.existsSync(SEED_FILE) && path.resolve(DB_FILE) !== path.resolve(SEED_FILE)) {
      try {
        fs.copyFileSync(SEED_FILE, DB_FILE);
      } catch (copyErr) {
        console.warn('[StoreDB] Could not copy seed db:', copyErr);
      }
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products)) {
        const DEMO_PRODUCT_IDS = new Set([
          'ext-001', 'ext-002', 'ext-003', 'ext-004', 'ext-005', 'ext-006', 'ext-007',
          'flac-001', 'flac-002', 'flac-003', 'flac-004', 'flac-005', 'flac-006',
          'acc-001', 'acc-002', 'acc-003', 'acc-004'
        ]);
        const DEMO_PRODUCT_CODES = new Set([
          'EXT-OUD-100G', 'EXT-MUSK-100G', 'EXT-BR540-100G', 'EXT-ROSE-100G', 'EXT-SAN-100G',
          'EXT-VAN-100G', 'EXT-BERG-100G', 'FLAC-LUX-50', 'FLAC-PREST-100', 'FLAC-ROLL-6',
          'FLAC-ALU-1000', 'FLAC-ORIENT-12', 'FLAC-TEST-2ML', 'ACC-SERT-1520', 'ACC-PIP-100',
          'ACC-ENTON-5', 'ACC-MOUIL-500'
        ]);
        const DEMO_USER_NAMES = new Set(['karim_oran', 'sofiane_alger', 'blida_rose', '0555998877']);

        // Purge demo customer users
        const cleanUsers = (Array.isArray(parsed.customerUsers) ? parsed.customerUsers : []).filter(
          (u: any) =>
            u &&
            !DEMO_USER_NAMES.has(u.username) &&
            !u.fullName?.toLowerCase().includes('test') &&
            !u.companyName?.toLowerCase().includes('test')
        );

        // Purge demo customer applications
        const cleanApps = (Array.isArray(parsed.customerApplications) ? parsed.customerApplications : []).filter(
          (a: any) =>
            a &&
            !DEMO_USER_NAMES.has(a.assignedUsername) &&
            !a.fullName?.toLowerCase().includes('test') &&
            !a.fullName?.toLowerCase().includes('sofiane bensalem') &&
            !a.fullName?.toLowerCase().includes('parfumeur blida')
        );

        // Purge demo products
        const cleanProducts = (parsed.products || []).filter(
          (p: Product) => p && !DEMO_PRODUCT_IDS.has(p.id) && !DEMO_PRODUCT_CODES.has(p.code)
        );

        // Purge test orders associated with demo data
        const cleanOrders = (Array.isArray(parsed.orders) ? parsed.orders : []).filter(
          (o: any) =>
            o &&
            o.orderNumber !== 'TEST-001' &&
            !o.customer?.fullName?.toLowerCase().includes('test') &&
            !o.customer?.fullName?.toLowerCase().includes('karim meziani') &&
            !o.customer?.fullName?.toLowerCase().includes('amina belhadj')
        );

        const DEMO_BANNER_IDS = new Set(['ad-001', 'ad-002', 'ad-003']);
        const cleanBanners = (Array.isArray(parsed.adBanners) ? parsed.adBanners : []).filter(
          (b: any) => b && !DEMO_BANNER_IDS.has(b.id)
        );

        cachedDb = {
          products: cleanProducts,
          orders: cleanOrders,
          customerApplications: cleanApps,
          customerUsers: cleanUsers,
          adBanners: cleanBanners,
          storeSettings: parsed.storeSettings || INITIAL_STORE_SETTINGS,
          lastUpdated: new Date().toISOString(),
        };

        // Persist the purged clean database immediately
        persistDatabase(cachedDb);

        return cachedDb;
      }
    }
  } catch (err) {
    console.error('[StoreDB] Error reading store_db.json, re-initializing:', err);
  }

  cachedDb = getInitialDatabase();
  persistDatabase(cachedDb);
  return cachedDb;
}

export function persistDatabase(db: ServerDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastUpdated = new Date().toISOString();
    cachedDb = db;
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[StoreDB] Error writing store_db.json:', err);
  }
}

// ---------------- ORDERS ----------------
export function getAllOrders(): PreOrder[] {
  const db = loadDatabase();
  return [...db.orders].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function createOrder(orderPayload: PreOrder): { order: PreOrder; updatedProducts: Product[] } {
  const db = loadDatabase();

  const timestamp = Date.now();
  const isProforma = Boolean(orderPayload.isProforma);
  const prefix = isProforma ? 'PRO' : 'PRE';
  const orderNumber =
    orderPayload.orderNumber || `${prefix}-${new Date().getFullYear()}-${timestamp.toString().slice(-5)}`;

  const newOrder: PreOrder = {
    ...orderPayload,
    id: orderPayload.id || `order-${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
    orderNumber,
    date: orderPayload.date || new Date().toISOString(),
    status: orderPayload.status || 'en_attente',
    isProforma,
  };

  // Decrement stock from products
  db.products = db.products.map((prod) => {
    const item = newOrder.items.find((i) => i.productId === prod.id || i.code === prod.code);
    if (item && item.quantity > 0) {
      const newStock = Math.max(0, prod.stock - item.quantity);
      return {
        ...prod,
        stock: newStock,
        lastUpdated: new Date().toISOString(),
      };
    }
    return prod;
  });

  db.orders.unshift(newOrder);
  persistDatabase(db);

  return { order: newOrder, updatedProducts: db.products };
}

export function updateOrderStatus(
  orderId: string,
  status: PreOrder['status']
): { order: PreOrder; updatedProducts: Product[] } | null {
  const db = loadDatabase();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return null;

  const oldStatus = order.status;
  order.status = status;

  // Restore stock when order is cancelled
  if (oldStatus !== 'annulee' && status === 'annulee') {
    db.products = db.products.map((prod) => {
      const item = order.items.find((i) => i.productId === prod.id || i.code === prod.code);
      if (item && item.quantity > 0) {
        return {
          ...prod,
          stock: prod.stock + item.quantity,
          lastUpdated: new Date().toISOString(),
        };
      }
      return prod;
    });
  } else if (oldStatus === 'annulee' && status !== 'annulee') {
    // If order was cancelled and is now reactivated, deduct stock again
    db.products = db.products.map((prod) => {
      const item = order.items.find((i) => i.productId === prod.id || i.code === prod.code);
      if (item && item.quantity > 0) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - item.quantity),
          lastUpdated: new Date().toISOString(),
        };
      }
      return prod;
    });
  }

  persistDatabase(db);
  return { order, updatedProducts: db.products };
}

export function syncOrders(ordersList: PreOrder[]): { orders: PreOrder[]; updatedProducts: Product[] } {
  const db = loadDatabase();

  // Check any order that changed to 'annulee'
  ordersList.forEach((incoming) => {
    const existing = db.orders.find((o) => o.id === incoming.id);
    if (existing) {
      if (existing.status !== 'annulee' && incoming.status === 'annulee') {
        db.products = db.products.map((prod) => {
          const item = incoming.items.find((i) => i.productId === prod.id || i.code === prod.code);
          if (item && item.quantity > 0) {
            return {
              ...prod,
              stock: prod.stock + item.quantity,
              lastUpdated: new Date().toISOString(),
            };
          }
          return prod;
        });
      } else if (existing.status === 'annulee' && incoming.status !== 'annulee') {
        db.products = db.products.map((prod) => {
          const item = incoming.items.find((i) => i.productId === prod.id || i.code === prod.code);
          if (item && item.quantity > 0) {
            return {
              ...prod,
              stock: Math.max(0, prod.stock - item.quantity),
              lastUpdated: new Date().toISOString(),
            };
          }
          return prod;
        });
      }
    }
  });

  db.orders = ordersList;
  persistDatabase(db);
  return { orders: db.orders, updatedProducts: db.products };
}

export function deleteOrder(orderId: string): { success: boolean; updatedProducts?: Product[] } {
  const db = loadDatabase();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return { success: false };

  // If order was not cancelled, return its stock on deletion
  if (order.status !== 'annulee') {
    db.products = db.products.map((prod) => {
      const item = order.items.find((i) => i.productId === prod.id || i.code === prod.code);
      if (item && item.quantity > 0) {
        return {
          ...prod,
          stock: prod.stock + item.quantity,
          lastUpdated: new Date().toISOString(),
        };
      }
      return prod;
    });
  }

  db.orders = db.orders.filter((o) => o.id !== orderId);
  persistDatabase(db);
  return { success: true, updatedProducts: db.products };
}

// ---------------- CUSTOMERS & AUTH ----------------
export function getCustomersData() {
  const db = loadDatabase();
  return {
    applications: db.customerApplications,
    users: db.customerUsers,
  };
}

export function registerCustomer(data: {
  fullName: string;
  companyName: string;
  phone: string;
  secondaryPhone?: string;
  email: string;
  password?: string;
  wilayaCode?: string;
  wilayaName?: string;
  commune?: string;
  deliveryAddress?: string;
  notes?: string;
  autoApprove?: boolean;
}): { application: CustomerApplication; user: CustomerUser } {
  const db = loadDatabase();
  const id = `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const chosenPassword = (data.password && data.password.trim()) || 'tulip2026';
  // Create clean username from company name or full name or phone
  const cleanUsername =
    data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') ||
    data.phone.replace(/\D/g, '') ||
    `client_${Date.now().toString().slice(-4)}`;

  const shouldAutoApprove = Boolean(data.autoApprove);

  const application: CustomerApplication = {
    id,
    fullName: data.fullName.trim(),
    companyName: data.companyName.trim(),
    phone: data.phone.trim(),
    secondaryPhone: data.secondaryPhone?.trim(),
    email: data.email.trim().toLowerCase(),
    wilayaCode: data.wilayaCode || '16',
    wilayaName: data.wilayaName || 'Alger',
    commune: data.commune?.trim(),
    deliveryAddress: data.deliveryAddress?.trim(),
    notes: data.notes?.trim(),
    submittedAt: now,
    status: shouldAutoApprove ? 'approved' : 'pending',
    assignedUsername: shouldAutoApprove ? cleanUsername : undefined,
    assignedPassword: shouldAutoApprove ? chosenPassword : undefined,
    approvedAt: shouldAutoApprove ? now : undefined,
    approvedBy: shouldAutoApprove ? 'admin_auto' : undefined,
    verificationNotes: shouldAutoApprove ? 'Accès direct validé.' : undefined,
  };

  const user: CustomerUser = {
    id,
    username: shouldAutoApprove ? cleanUsername : '',
    password: shouldAutoApprove ? chosenPassword : '',
    fullName: data.fullName.trim(),
    companyName: data.companyName.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    secondaryPhone: data.secondaryPhone?.trim(),
    wilayaCode: data.wilayaCode || '16',
    wilayaName: data.wilayaName || 'Alger',
    commune: data.commune?.trim(),
    deliveryAddress: data.deliveryAddress?.trim(),
    status: shouldAutoApprove ? 'approved' : 'pending',
    createdAt: now,
    lastLogin: shouldAutoApprove ? now : undefined,
  };

  db.customerApplications.unshift(application);
  if (shouldAutoApprove) {
    db.customerUsers.unshift(user);
  }

  persistDatabase(db);
  return { application, user };
}

export function authenticateCustomer(
  identifier: string,
  password?: string
): { success: boolean; user?: CustomerUser; error?: string; status?: CustomerAccountStatus } {
  const db = loadDatabase();
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanInputDigits = normalizePhone(cleanId);
  const cleanPass = (password || '').trim();

  // Find in customerUsers first
  let foundUser = db.customerUsers.find((u) => {
    const matchUsername = u.username.toLowerCase() === cleanId;
    const matchEmail = u.email.toLowerCase() === cleanId;
    const matchPhone = cleanInputDigits && normalizePhone(u.phone) === cleanInputDigits;
    return matchUsername || matchEmail || matchPhone;
  });

  // If not found in customerUsers, check in customerApplications
  if (!foundUser) {
    const foundApp = db.customerApplications.find((app) => {
      const matchUsername = app.assignedUsername && app.assignedUsername.toLowerCase() === cleanId;
      const matchEmail = app.email.toLowerCase() === cleanId;
      const matchPhone = cleanInputDigits && normalizePhone(app.phone) === cleanInputDigits;
      return matchUsername || matchEmail || matchPhone;
    });

    if (foundApp) {
      if (foundApp.status === 'pending') {
        return {
          success: false,
          status: 'pending',
          error:
            "Votre demande d'accès B2B est en cours d'examen. Nos équipes commerciales vous transmettront votre identifiant et mot de passe par WhatsApp ou téléphone après validation.",
        };
      }
      if (foundApp.status === 'rejected' || foundApp.status === 'suspended') {
        return {
          success: false,
          status: foundApp.status,
          error: 'Ce compte client a été suspendu ou désactivé par l\'administrateur.',
        };
      }

      // Promote to customerUser
      foundUser = {
        id: foundApp.id,
        username: foundApp.assignedUsername || foundApp.email.split('@')[0],
        password: foundApp.assignedPassword || 'tulip2026',
        fullName: foundApp.fullName,
        companyName: foundApp.companyName,
        email: foundApp.email,
        phone: foundApp.phone,
        secondaryPhone: foundApp.secondaryPhone,
        wilayaCode: foundApp.wilayaCode,
        wilayaName: foundApp.wilayaName,
        commune: foundApp.commune,
        deliveryAddress: foundApp.deliveryAddress,
        status: 'approved',
        createdAt: foundApp.approvedAt || foundApp.submittedAt,
      };
      db.customerUsers.push(foundUser);
      persistDatabase(db);
    }
  }

  if (!foundUser) {
    return {
      success: false,
      error: 'Identifiant (nom d\'utilisateur, email ou numéro de téléphone) introuvable.',
    };
  }

  if (foundUser.status === 'suspended') {
    return {
      success: false,
      status: 'suspended',
      error: 'Votre compte client a été suspendu par l\'administrateur.',
    };
  }

  // Password verification
  if (foundUser.password && cleanPass && foundUser.password !== cleanPass) {
    return {
      success: false,
      error: 'Mot de passe incorrect. Veuillez vérifier ou contacter le support.',
    };
  }

  foundUser.lastLogin = new Date().toISOString();
  persistDatabase(db);

  return {
    success: true,
    user: foundUser,
    status: foundUser.status,
  };
}

export function approveCustomerApplication(
  applicationId: string,
  assignedUsername: string,
  assignedPassword: string,
  verificationNotes?: string
): CustomerUser | null {
  const db = loadDatabase();
  const app = db.customerApplications.find((a) => a.id === applicationId);
  if (!app) return null;

  const now = new Date().toISOString();
  app.status = 'approved';
  app.assignedUsername = assignedUsername.trim();
  app.assignedPassword = assignedPassword.trim();
  app.approvedAt = now;
  app.approvedBy = 'admin';
  if (verificationNotes) {
    app.verificationNotes = verificationNotes.trim();
  }

  // Find or create in customerUsers
  let user = db.customerUsers.find((u) => u.id === applicationId);
  if (!user) {
    user = {
      id: app.id,
      username: app.assignedUsername,
      password: app.assignedPassword,
      fullName: app.fullName,
      companyName: app.companyName,
      email: app.email,
      phone: app.phone,
      secondaryPhone: app.secondaryPhone,
      wilayaCode: app.wilayaCode,
      wilayaName: app.wilayaName,
      commune: app.commune,
      deliveryAddress: app.deliveryAddress,
      status: 'approved',
      createdAt: now,
    };
    db.customerUsers.push(user);
  } else {
    user.username = app.assignedUsername;
    user.password = app.assignedPassword;
    user.status = 'approved';
  }

  persistDatabase(db);
  return user;
}

export function updateCustomerStatus(
  customerId: string,
  status: CustomerAccountStatus
): CustomerUser | null {
  const db = loadDatabase();
  const user = db.customerUsers.find((u) => u.id === customerId);
  if (user) {
    user.status = status;
  }
  const app = db.customerApplications.find((a) => a.id === customerId);
  if (app) {
    app.status = status;
  }
  persistDatabase(db);
  return user || null;
}

export function resetCustomerPassword(customerId: string, newPassword: string): CustomerUser | null {
  const db = loadDatabase();
  const user = db.customerUsers.find((u) => u.id === customerId);
  if (user) {
    user.password = newPassword.trim();
  }
  const app = db.customerApplications.find((a) => a.id === customerId);
  if (app) {
    app.assignedPassword = newPassword.trim();
  }
  persistDatabase(db);
  return user || null;
}

export function createDirectCustomer(data: Omit<CustomerUser, 'id' | 'createdAt'>): CustomerUser {
  const db = loadDatabase();
  const id = `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const newUser: CustomerUser = {
    ...data,
    id,
    createdAt: now,
    status: data.status || 'approved',
  };

  const newApp: CustomerApplication = {
    id,
    fullName: data.fullName,
    companyName: data.companyName,
    phone: data.phone,
    secondaryPhone: data.secondaryPhone,
    email: data.email,
    wilayaCode: data.wilayaCode,
    wilayaName: data.wilayaName,
    commune: data.commune,
    deliveryAddress: data.deliveryAddress,
    submittedAt: now,
    status: data.status || 'approved',
    assignedUsername: data.username,
    assignedPassword: data.password || 'tulip2026',
    approvedAt: now,
    approvedBy: 'admin_direct_creation',
  };

  db.customerUsers.unshift(newUser);
  db.customerApplications.unshift(newApp);
  persistDatabase(db);
  return newUser;
}

export function deleteCustomer(customerId: string): boolean {
  const db = loadDatabase();
  db.customerUsers = db.customerUsers.filter((u) => u.id !== customerId);
  db.customerApplications = db.customerApplications.filter((a) => a.id !== customerId);
  persistDatabase(db);
  return true;
}

export function importCustomers(
  newCustomers: CustomerUser[],
  replaceExisting: boolean = false
): { users: CustomerUser[]; applications: CustomerApplication[] } {
  const db = loadDatabase();
  const now = new Date().toISOString();

  if (replaceExisting) {
    db.customerUsers = newCustomers.map((c) => ({
      ...c,
      status: c.status || 'approved',
      createdAt: c.createdAt || now,
    }));

    db.customerApplications = newCustomers.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      companyName: c.companyName,
      email: c.email,
      phone: c.phone,
      secondaryPhone: c.secondaryPhone,
      wilayaCode: c.wilayaCode,
      wilayaName: c.wilayaName,
      commune: c.commune,
      deliveryAddress: c.deliveryAddress,
      status: c.status || 'approved',
      submittedAt: c.createdAt || now,
      approvedAt: c.createdAt || now,
      approvedBy: 'import_system',
      assignedUsername: c.username,
      assignedPassword: c.password,
      verificationNotes: 'Importé dans le système.',
    }));
  } else {
    // Merge mode
    newCustomers.forEach((nc) => {
      const idx = db.customerUsers.findIndex(
        (existing) =>
          existing.id === nc.id ||
          (nc.username && existing.username.toLowerCase() === nc.username.toLowerCase()) ||
          (nc.phone && normalizePhone(existing.phone) === normalizePhone(nc.phone)) ||
          (nc.email && existing.email.toLowerCase() === nc.email.toLowerCase())
      );
      if (idx >= 0) {
        db.customerUsers[idx] = { ...db.customerUsers[idx], ...nc };
      } else {
        db.customerUsers.push({
          ...nc,
          status: nc.status || 'approved',
          createdAt: nc.createdAt || now,
        });
      }

      // Also ensure application exists
      const appIdx = db.customerApplications.findIndex(
        (a) =>
          a.id === nc.id ||
          (nc.username && a.assignedUsername && a.assignedUsername.toLowerCase() === nc.username.toLowerCase()) ||
          (nc.phone && normalizePhone(a.phone) === normalizePhone(nc.phone))
      );
      if (appIdx >= 0) {
        db.customerApplications[appIdx] = {
          ...db.customerApplications[appIdx],
          fullName: nc.fullName,
          companyName: nc.companyName,
          phone: nc.phone,
          secondaryPhone: nc.secondaryPhone,
          email: nc.email,
          wilayaCode: nc.wilayaCode,
          wilayaName: nc.wilayaName,
          commune: nc.commune,
          deliveryAddress: nc.deliveryAddress,
          status: nc.status || 'approved',
          assignedUsername: nc.username,
          assignedPassword: nc.password,
        };
      } else {
        db.customerApplications.push({
          id: nc.id,
          fullName: nc.fullName,
          companyName: nc.companyName,
          email: nc.email,
          phone: nc.phone,
          secondaryPhone: nc.secondaryPhone,
          wilayaCode: nc.wilayaCode,
          wilayaName: nc.wilayaName,
          commune: nc.commune,
          deliveryAddress: nc.deliveryAddress,
          status: nc.status || 'approved',
          submittedAt: nc.createdAt || now,
          approvedAt: nc.createdAt || now,
          approvedBy: 'import_system',
          assignedUsername: nc.username,
          assignedPassword: nc.password,
          verificationNotes: 'Importé dans le système.',
        });
      }
    });
  }

  persistDatabase(db);
  return { users: db.customerUsers, applications: db.customerApplications };
}

// ---------------- MASTER RESTORATION ----------------
export function restoreDatabase(backup: Partial<ServerDatabase>): ServerDatabase {
  const db = loadDatabase();
  const now = new Date().toISOString();

  if (Array.isArray(backup.products) && backup.products.length > 0) {
    db.products = backup.products;
  }
  if (Array.isArray(backup.orders)) {
    db.orders = backup.orders;
  }
  if (Array.isArray(backup.customerUsers)) {
    db.customerUsers = backup.customerUsers;
  }
  if (Array.isArray(backup.customerApplications)) {
    db.customerApplications = backup.customerApplications;
  } else if (Array.isArray(backup.customerUsers) && backup.customerUsers.length > 0) {
    db.customerApplications = backup.customerUsers.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      companyName: c.companyName,
      email: c.email,
      phone: c.phone,
      secondaryPhone: c.secondaryPhone,
      wilayaCode: c.wilayaCode,
      wilayaName: c.wilayaName,
      commune: c.commune,
      deliveryAddress: c.deliveryAddress,
      status: c.status || 'approved',
      submittedAt: c.createdAt || now,
      approvedAt: c.createdAt || now,
      approvedBy: 'restore_system',
      assignedUsername: c.username,
      assignedPassword: c.password,
      verificationNotes: 'Restauré depuis sauvegarde.',
    }));
  }
  if (Array.isArray(backup.adBanners)) {
    db.adBanners = backup.adBanners;
  }
  if (backup.storeSettings && typeof backup.storeSettings === 'object') {
    db.storeSettings = { ...db.storeSettings, ...backup.storeSettings };
  }

  db.lastUpdated = now;
  persistDatabase(db);
  return db;
}

// ---------------- PRODUCTS ----------------
export function getProducts(): Product[] {
  const db = loadDatabase();
  return db.products;
}

export function syncProducts(newProducts: Product[]): Product[] {
  const db = loadDatabase();
  db.products = newProducts;
  persistDatabase(db);
  return db.products;
}

export function updateSingleProduct(
  id: string,
  stock: number,
  priceDA?: number,
  isHidden?: boolean
): Product | null {
  const db = loadDatabase();
  const prod = db.products.find((p) => p.id === id);
  if (!prod) return null;

  prod.stock = stock;
  if (priceDA !== undefined) prod.priceDA = priceDA;
  if (isHidden !== undefined) prod.isHidden = isHidden;
  prod.lastUpdated = new Date().toISOString();

  persistDatabase(db);
  return prod;
}

// ---------------- BANNERS & SETTINGS ----------------
export function getBanners(): AdBanner[] {
  const db = loadDatabase();
  return db.adBanners;
}

export function updateBanners(banners: AdBanner[]): AdBanner[] {
  const db = loadDatabase();
  db.adBanners = banners;
  persistDatabase(db);
  return db.adBanners;
}

export function getSettings(): StoreSettings {
  const db = loadDatabase();
  return db.storeSettings;
}

export function updateSettings(settings: StoreSettings): StoreSettings {
  const db = loadDatabase();
  db.storeSettings = settings;
  persistDatabase(db);
  return db.storeSettings;
}
