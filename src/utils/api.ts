import {
  Product,
  PreOrder,
  CustomerApplication,
  CustomerUser,
  AdBanner,
  StoreSettings,
  CustomerAccountStatus,
} from '../types';
import { idbSaveSyncSnapshot, idbGetSyncSnapshot, idbSaveProducts } from './indexedDb';
import { prefetchProductImages } from './imageCache';

export interface SyncDataResponse {
  status: string;
  products: Product[];
  orders: PreOrder[];
  customerApplications: CustomerApplication[];
  customerUsers: CustomerUser[];
  adBanners: AdBanner[];
  storeSettings: StoreSettings;
  lastUpdated: string;
  serverTime: string;
}

export const OFFLINE_SYNC_CACHE_KEY = 'tulip_offline_sync_snapshot';

export function getCachedSyncData(): SyncDataResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(OFFLINE_SYNC_CACHE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[Cache] Could not read offline sync cache:', e);
  }
  return null;
}

export function saveCachedSyncData(data: SyncDataResponse): void {
  if (typeof window === 'undefined' || !data) return;
  try {
    // Avoid saving oversized base64 strings into the snapshot
    const sanitizedProducts = (data.products || []).map((p) => {
      if (p.imageUrl && p.imageUrl.startsWith('data:image/') && p.imageUrl.length > 200 * 1024) {
        return { ...p, imageUrl: '/tulip-extrait-default.jpg' };
      }
      return p;
    });
    const snapshot: SyncDataResponse = {
      ...data,
      products: sanitizedProducts,
    };
    localStorage.setItem(OFFLINE_SYNC_CACHE_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn('[Cache] Could not write offline sync cache:', e);
  }

  // Persist complete fidelity dataset into IndexedDB (high storage capacity)
  idbSaveSyncSnapshot(data as any).catch(() => {});
  if (Array.isArray(data.products)) {
    idbSaveProducts(data.products).catch(() => {});
    // Automatically prefetch & cache all product images in background for 100% offline browsing
    prefetchProductImages(data.products).catch(() => {});
  }
}

export async function fetchSyncData(timeoutMs = 1800): Promise<SyncDataResponse | null> {
  // If user is explicitly offline, return cached snapshot instantly with 0ms latency
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const cached = getCachedSyncData();
    if (cached) return cached;
    const idbCached = await idbGetSyncSnapshot();
    if (idbCached) return idbCached as any;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch('/api/sync', {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: SyncDataResponse = await res.json();
    saveCachedSyncData(data);
    return data;
  } catch (err: any) {
    clearTimeout(timer);
    // On slow mobile networks, timeout, or offline: immediately fall back to local snapshot
    const cached = getCachedSyncData();
    if (cached) {
      return cached;
    }
    const idbCached = await idbGetSyncSnapshot();
    if (idbCached) {
      return idbCached as any;
    }
    console.warn('[API] fetchSyncData notice (using local state):', err?.message || err);
    return null;
  }
}

export async function submitOrderToServer(
  order: PreOrder
): Promise<{ success: boolean; order?: PreOrder; updatedProducts?: Product[]; error?: string }> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Erreur enregistrement commande' };
    }
    return { success: true, order: json.order, updatedProducts: json.updatedProducts };
  } catch (err: any) {
    console.error('[API] submitOrderToServer error:', err);
    return { success: false, error: err.message || 'Erreur réseau lors de la commande' };
  }
}

export async function updateOrderStatusOnServer(
  orderId: string,
  status: PreOrder['status']
): Promise<{ success: boolean; order?: PreOrder; updatedProducts?: Product[] }> {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    return {
      success: Boolean(json.success),
      order: json.order,
      updatedProducts: json.updatedProducts,
    };
  } catch (err) {
    console.error('[API] updateOrderStatusOnServer error:', err);
    return { success: false };
  }
}

export async function deleteOrderOnServer(
  orderId: string
): Promise<{ success: boolean; updatedProducts?: Product[] }> {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return {
      success: Boolean(json.success),
      updatedProducts: json.updatedProducts,
    };
  } catch (err) {
    console.error('[API] deleteOrderOnServer error:', err);
    return { success: false };
  }
}

export async function loginCustomerOnServer(
  identifier: string,
  password?: string
): Promise<{ success: boolean; customer?: CustomerUser; error?: string; status?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      try {
        const errJson = await res.json();
        return { success: false, error: errJson.error || `Erreur serveur (${res.status})` };
      } catch {
        return { success: false, error: `Erreur serveur HTTP ${res.status}` };
      }
    }
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error('[API] loginCustomerOnServer error:', err);
    return { success: false, error: 'Problème de communication avec le serveur Tulip.' };
  }
}

export async function registerCustomerOnServer(data: {
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
}): Promise<{
  success: boolean;
  customer?: CustomerUser;
  application?: CustomerApplication;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error('[API] registerCustomerOnServer error:', err);
    return { success: false, error: 'Impossible de joindre le serveur d\'enregistrement.' };
  }
}

export async function approveCustomerOnServer(
  applicationId: string,
  assignedUsername: string,
  assignedPassword: string,
  verificationNotes?: string
): Promise<CustomerUser | null> {
  try {
    const res = await fetch('/api/customers/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId,
        assignedUsername,
        assignedPassword,
        verificationNotes,
      }),
    });
    const json = await res.json();
    return json.success ? json.customer : null;
  } catch (err) {
    console.error('[API] approveCustomerOnServer error:', err);
    return null;
  }
}

export async function updateCustomerStatusOnServer(
  customerId: string,
  status: CustomerAccountStatus
): Promise<CustomerUser | null> {
  try {
    const res = await fetch(`/api/customers/${encodeURIComponent(customerId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    return json.success ? json.customer : null;
  } catch (err) {
    console.error('[API] updateCustomerStatusOnServer error:', err);
    return null;
  }
}

export async function resetCustomerPasswordOnServer(
  customerId: string,
  newPassword: string
): Promise<CustomerUser | null> {
  try {
    const res = await fetch(`/api/customers/${encodeURIComponent(customerId)}/reset-password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    const json = await res.json();
    return json.success ? json.customer : null;
  } catch (err) {
    console.error('[API] resetCustomerPasswordOnServer error:', err);
    return null;
  }
}

export async function createDirectCustomerOnServer(
  data: Omit<CustomerUser, 'id' | 'createdAt'>
): Promise<CustomerUser | null> {
  try {
    const res = await fetch('/api/customers/create-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.success ? json.customer : null;
  } catch (err) {
    console.error('[API] createDirectCustomerOnServer error:', err);
    return null;
  }
}

export async function deleteCustomerOnServer(customerId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/customers/${encodeURIComponent(customerId)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.error('[API] deleteCustomerOnServer error:', err);
    return false;
  }
}

export async function syncProductsOnServer(products: Product[]): Promise<Product[] | null> {
  try {
    const res = await fetch('/api/products/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products }),
    });
    const json = await res.json();
    return json.success ? json.products : null;
  } catch (err) {
    console.error('[API] syncProductsOnServer error:', err);
    return null;
  }
}

export async function updateSingleProductOnServer(
  id: string,
  stock: number,
  priceDA?: number,
  isHidden?: boolean
): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock, priceDA, isHidden }),
    });
    const json = await res.json();
    return json.success ? json.product : null;
  } catch (err) {
    console.error('[API] updateSingleProductOnServer error:', err);
    return null;
  }
}

export async function updateBannersOnServer(banners: AdBanner[]): Promise<AdBanner[] | null> {
  try {
    const res = await fetch('/api/banners', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banners }),
    });
    const json = await res.json();
    return json.success ? json.banners : null;
  } catch (err) {
    console.error('[API] updateBannersOnServer error:', err);
    return null;
  }
}

export async function updateSettingsOnServer(settings: StoreSettings): Promise<StoreSettings | null> {
  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    const json = await res.json();
    return json.success ? json.settings : null;
  } catch (err) {
    console.error('[API] updateSettingsOnServer error:', err);
    return null;
  }
}

export async function importCustomersOnServer(
  customers: CustomerUser[],
  replaceExisting: boolean = false
): Promise<{ success: boolean; customerUsers?: CustomerUser[]; customerApplications?: CustomerApplication[]; error?: string }> {
  try {
    const res = await fetch('/api/customers/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customers, replaceExisting }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Erreur importation clients' };
    }
    return {
      success: true,
      customerUsers: json.customerUsers,
      customerApplications: json.customerApplications,
    };
  } catch (err: any) {
    console.error('[API] importCustomersOnServer error:', err);
    return { success: false, error: err.message || 'Erreur réseau importation clients' };
  }
}

export async function restoreAllDataOnServer(
  backup: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch('/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backup }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Erreur restauration serveur' };
    }
    return { success: true, data: json.data };
  } catch (err: any) {
    console.error('[API] restoreAllDataOnServer error:', err);
    return { success: false, error: err.message || 'Erreur réseau restauration données' };
  }
}

export async function syncOrdersOnServer(
  orders: PreOrder[]
): Promise<{ success: boolean; orders?: PreOrder[]; updatedProducts?: Product[] }> {
  try {
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    });
    const json = await res.json();
    return {
      success: Boolean(json.success),
      orders: json.orders,
      updatedProducts: json.updatedProducts,
    };
  } catch (err) {
    console.error('[API] syncOrdersOnServer error:', err);
    return { success: false };
  }
}

export interface DetectedTelegramChat {
  chatId: string;
  name: string;
  username?: string;
  chatType: 'group' | 'supergroup' | 'channel' | 'private' | string;
  lastMessage?: string;
  date?: string;
  isConfigured?: boolean;
  assignedChannels?: ('preorder' | 'proforma' | 'access' | 'general')[];
}

export interface DetectTelegramChatsResponse {
  success: boolean;
  count: number;
  detectedChats: DetectedTelegramChat[];
  bot?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
  } | null;
  error?: string;
}

export async function detectTelegramChats(token?: string): Promise<DetectTelegramChatsResponse> {
  try {
    const res = await fetch('/api/telegram/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      detectedChats: [],
      error: err.message || 'Erreur lors de la détection des canaux Telegram.',
    };
  }
}

export interface TelegramStatusResponse {
  configured: boolean;
  tokenMasked?: string;
  chatId?: string;
  preorderChatId?: string;
  proformaChatId?: string;
  accessChatId?: string;
  resolvedPreorderChats?: string[];
  resolvedProformaChats?: string[];
  resolvedAccessChats?: string[];
  isChatIdSelfBot?: boolean;
  enabled?: boolean;
  bot?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
  } | null;
  subscribers?: {
    chatId: string;
    chatType?: string;
    name: string;
    username?: string;
    text?: string;
    date?: string;
  }[];
  error?: string | null;
}

export async function fetchTelegramStatus(): Promise<TelegramStatusResponse> {
  try {
    const res = await fetch('/api/telegram/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return { configured: false, error: err.message };
  }
}

export async function triggerTelegramTest(
  chatId?: string,
  token?: string,
  channelType: 'preorder' | 'proforma' | 'access' | 'general' = 'general'
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/telegram/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, token, channelType }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erreur lors du test Telegram.' };
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur réseau.' };
  }
}

export async function saveTelegramSettings(settings: {
  telegramChatId?: string;
  telegramPreorderChatId?: string;
  telegramProformaChatId?: string;
  telegramAccessChatId?: string;
  telegramBotToken?: string;
  telegramNotificationsEnabled?: boolean;
}): Promise<{ success: boolean; settings?: any; error?: string }> {
  try {
    const res = await fetch('/api/telegram/save-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erreur sauvegarde paramètres Telegram.' };
    }
    return { success: true, settings: data.settings };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur réseau.' };
  }
}

