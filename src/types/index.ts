// User-related types
import { Address, PaymentMethod } from './user';

export type { Address, PaymentMethod } from './user';

/**
 * Wire form for every monetary value exposed by the backend gateway:
 * a major-unit decimal string + ISO-4217 currency code,
 * e.g. { amount: "300.00", currency: "UAH" }.
 *
 * `amount` is intentionally a string to preserve BigDecimal precision over JSON.
 * Use `formatMoney` (src/lib/utils.ts) to render; only call `Number(m.amount)`
 * for display-only arithmetic (discounts, line totals).
 */
export type Money = { amount: string; currency: string };

export type StoreType = "RESTAURANT" | "CAFE" | "BAKERY" | "GROCERY" | "SWEETS" | "OTHER";

export type StoreGroup = "FOOD_SERVICE" | "RETAIL";

export interface Category {
  id: string;
  slug: string;
  name: string;                    // already localized by backend (Accept-Language)
  iconName: string | null;
  applicableTypes: StoreType[];
  applicableGroups: StoreGroup[];
}

export interface CategoryIcon {
  name: string;
  icon: string;
}

export interface HeroImage {
  id: string;
  url: string;
  alt?: string;
  link?: string;
}

export type EcoStats = {
  moneySaved?: string;
  co2ReducedKg?: string;
  co2Saved?: number;
  plasticSaved?: number;
  waterSaved?: number;
};

export interface StoreSummary {
  id: string;
  name: string;
  logoUrl: string;
  heroUrl: string;
  type: StoreType;
  category: Category | null;
  rating: number;
  distanceKm: number | null;
  deliveryEta: { min: number; max: number };
  deliveryFee: Money;
  priceLevel: 1 | 2 | 3 | 4;
  isOpen: boolean;
  hasSurpriseBox: boolean;
}

export interface MenuSection {
  id: string;
  title: string;
  items: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: Money;
  badges?: string[];
  kcal?: number;
}

export interface Combo {
  id: string;
  title: string;
  items: string[];
  price: Money;
  imageUrl: string;
  savings: Money;
}

export interface SurpriseBoxStore {
  id: string;
  title: string;
  price: Money;
  retailPrice: Money;
  pickup: { from: string; to: string };
  stock: number;
  deliveryAvailable: boolean;
  imageUrl: string;
  rating?: number;
  storeId: string;
}

export interface SurpriseBoxListItem {
  id: string;
  store: {
    id: string;
    name: string;
    logoUrl: string;
  };
  title: string;
  price: Money;
  retailPrice: Money;
  distanceKm: number;
  stock: number;
  pickup: { from: string; to: string };
  deliveryAvailable: boolean;
  rating: number;
}

export interface SurpriseBoxLocation {
  lat: number | null;
  lng: number | null;
}

export interface SurpriseBox {
  id: string;
  name: string;
  description?: string;
  image: string;
  discount: number;
  timeLeft: string;
  readableTimeLeft?: string;
  category: string;
  price: Money;
  retailPrice?: Money;
  discountedPrice?: Money;
  distanceKm?: number;
  stock?: number;
  pickup?: { from: string; to: string };
  deliveryAvailable?: boolean;
  rating?: number;
  storeId?: string;
  storeName?: string;
  storeImage?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export enum PaymentType {
  CARD = 'CARD',
  CASH = 'CASH',
  STRIPE = 'STRIPE'
}

export enum DeliveryType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
  EXPRESS_DELIVERY = 'EXPRESS_DELIVERY'
}

export interface SurpriseBoxComponent {
  id: string;
  name: string;
  image: string;
  discount: number;
  timeLeft: string;
  location: SurpriseBoxLocation;
  category: string;
  price?: Money;
  retailPrice?: Money;
  addressTitle?: string | null;
  paymentMethod?: string;
  paymentType?: PaymentType;
  deliveryType?: DeliveryType;
  deliveryAddress?: string;
}

export interface StoreDetail extends Omit<StoreSummary, 'heroUrl'|'distanceKm'|'hasSurpriseBox'> {
  website?: string;
  phone?: string;
  description: string;
  heroUrl: string;
  address: string;
  distance: number | null;
  coordinates: { lat: number | undefined; lng: number | undefined };
  minOrderAmount: Money;
  opensAt: string;
  closesAt: string;
  tags: string[];
  paymentMethods: ('card'|'applePay'|'googlePay'|'link')[];
  surpriseBox?: SurpriseBoxStore;
}

export interface Promo {
  title: string;
  description: string;
  emoji: string;
  bgColor?: string;
  accentColor?: string;
}

export interface ExtendedStoreDetail extends StoreDetail {
  surpriseBoxes: SurpriseBox[];
  promos?: Promo[];
  workingHours: string;
  coverImage: string;
  minOrder: Money;
  deliveryCost: Money;
  menu?: MenuSection[];
  items?: Record<string, MenuItem>;
  combos?: Combo[];
  lastOrderedItems?: string[];
}

/** Zero Money in the app's default currency, for placeholder/default objects. */
export const ZERO_MONEY: Money = { amount: '0.00', currency: 'UAH' };

export const defaultStore: ExtendedStoreDetail = {
  id: '',
  name: '',
  description: '',
  logoUrl: '',
  heroUrl: '',
  coverImage: '',
  type: 'OTHER',
  category: null,
  rating: 0,
  address: '',
  distance: null,
  coordinates: { lat: undefined, lng: undefined },
  minOrderAmount: ZERO_MONEY,
  minOrder: ZERO_MONEY,
  opensAt: '',
  closesAt: '',
  workingHours: '',
  tags: [],
  paymentMethods: [],
  menu: [],
  items: {},
  combos: [],
  lastOrderedItems: [],
  surpriseBoxes: [],
  deliveryEta: { min: 0, max: 0 },
  deliveryFee: ZERO_MONEY,
  deliveryCost: ZERO_MONEY,
  priceLevel: 1,
  isOpen: false,
  phone: undefined,
  website: undefined
};

export type Store = StoreDetail;

export type UserAddress = Address;

export type ProfileDto = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences?: string;
  statistics?: {
    ordersCompleted: number;
    itemsSaved: number;
    savings: number;
    co2ReducedKg?: number;
  };
  paymentMethods?: PaymentMethod[];
  addresses?: Address[];
  referralCode?: string;
  referralStats?: {
    invitedCount: number;
    pendingRewards: number;
    totalEarned: number;
  };
};

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export type Order = {
  id: string;
  status: OrderStatus | string;
  createdAt: string;
  pickupCode?: string;
  storeName: string;
  storeId: string;
  storeInfo?: {
    avatar: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    }
  };
  items: {
    id: string;
    menuItemId?: string;
    name: string;
    price: Money;
    quantity: number;
    imageUrl?: string;
  }[];
  totalPrice: Money;
  ecoImpact?: EcoStats;
  paymentType?: PaymentType | string;
  deliveryType?: DeliveryType | string;
  deliveryAddress?: string;
  paymentStatus?: PaymentStatus | string;
  stripePaymentIntentId?: string;
  paidAt?: string;
  failureCode?: string;
  failureMessage?: string;
};

export type CreateOrderResponse = {
  order: Order;
  paymentClientSecret?: string;
  paymentIntentId?: string;
};

export type CartItem = {
  boxId: string;
  name: string;
  price: Money;
  quantity: number;
  storeId: string;
  storeName: string;
  image: string;
};

export type Cart = {
  items: CartItem[];
  totalPrice: Money;
};

export type StoreCoordinates = {
  lat?: number;
  lng?: number;
};

export type AddressCoordinates = {
  latitude: number;
  longitude: number;
};

export interface StoreSearchParams {
  search?: string;
  type?: StoreType;
  group?: StoreGroup;
  categoryId?: string;
  categorySlug?: string;
  latitude?: number;
  longitude?: number;
  minRating?: number;
  maxDistance?: number;
  openNow?: boolean;
  priceLevel?: number[];
  sort?: "distance" | "rating" | "priceAsc" | "priceDesc" | "relevance";
  page?: number;
  limit?: number;
}

export interface DataContextType {
  boxes: SurpriseBox[];
  nearbyBoxes: SurpriseBox[];
  stores: Store[];
  nearbyStores: Store[];
  categories: Category[];
  cart: Cart;
  orders: Order[];
  isLoading: {
    boxes: boolean;
    stores: boolean;
    categories: boolean;
    orders: boolean;
  };

  getBoxById: (id: string) => SurpriseBox | undefined;
  getStoreById: (id: string) => Store | undefined;
  getBoxesByStore: (storeId: string) => SurpriseBox[];
  getBoxesByCategory: (category: string) => SurpriseBox[];
  getStoresByCategory: (category: string) => Store[];

  addToCart: (box: SurpriseBox, quantity?: number) => void;
  removeFromCart: (boxId: string) => void;
  updateCartItemQuantity: (boxId: string, quantity: number) => void;
  clearCart: () => void;

  createOrder: () => Promise<Order | null>;
  getOrderById: (id: string) => Order | undefined;

  refreshData: () => Promise<void>;
  setUserLocation: (coords: { latitude: number; longitude: number }) => void;
}
