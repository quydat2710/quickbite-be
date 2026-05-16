// ── Microservice Names ──
export const SERVICES = {
  USER: 'USER_SERVICE',
  RESTAURANT: 'RESTAURANT_SERVICE',
  ORDER: 'ORDER_SERVICE',
  PAYMENT: 'PAYMENT_SERVICE',
  DELIVERY: 'DELIVERY_SERVICE',
  NOTIFICATION: 'NOTIFICATION_SERVICE',
  ANALYTICS: 'ANALYTICS_SERVICE',
} as const;

// ── TCP Message Patterns ──
// Define now so Phase 2+ Kafka migration won't require interface changes
export const MSG_PATTERNS = {
  // Auth
  AUTH_REGISTER: 'auth.register',
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_REFRESH: 'auth.refresh',
  AUTH_SEND_OTP: 'auth.sendOtp',
  AUTH_VERIFY_OTP: 'auth.verifyOtp',
  AUTH_SOCIAL_LOGIN: 'auth.socialLogin',

  // Users
  USER_GET_PROFILE: 'user.getProfile',
  USER_UPDATE_PROFILE: 'user.updateProfile',
  USER_UPLOAD_AVATAR: 'user.uploadAvatar',

  // Addresses
  ADDRESS_LIST: 'address.list',
  ADDRESS_CREATE: 'address.create',
  ADDRESS_UPDATE: 'address.update',
  ADDRESS_DELETE: 'address.delete',

  // Restaurants
  RESTAURANT_SEARCH: 'restaurant.search',
  RESTAURANT_GET_BY_ID: 'restaurant.getById',
  RESTAURANT_CREATE: 'restaurant.create',
  RESTAURANT_UPDATE: 'restaurant.update',
  RESTAURANT_TOGGLE_ONLINE: 'restaurant.toggleOnline',

  // Menu
  MENU_GET: 'menu.get',
  MENU_CATEGORY_CREATE: 'menu.category.create',
  MENU_CATEGORY_UPDATE: 'menu.category.update',
  MENU_CATEGORY_DELETE: 'menu.category.delete',
  MENU_ITEM_CREATE: 'menu.item.create',
  MENU_ITEM_UPDATE: 'menu.item.update',
  MENU_ITEM_DELETE: 'menu.item.delete',

  // Reviews
  REVIEW_CREATE: 'review.create',
  REVIEW_LIST: 'review.list',
  REVIEW_REPLY: 'review.reply',

  // Orders (Phase 2+)
  ORDER_CREATE: 'order.create',
  ORDER_GET: 'order.get',
  ORDER_LIST: 'order.list',
  ORDER_LIST_RESTAURANT: 'order.listRestaurant',
  ORDER_CANCEL: 'order.cancel',
  ORDER_UPDATE_STATUS: 'order.updateStatus',

  // Cart (Phase 2+)
  CART_GET: 'cart.get',
  CART_ADD_ITEM: 'cart.addItem',
  CART_UPDATE_ITEM: 'cart.updateItem',
  CART_REMOVE_ITEM: 'cart.removeItem',
  CART_CLEAR: 'cart.clear',

  // Payment (Phase 2+)
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_GET: 'payment.get',
  PAYMENT_CALLBACK: 'payment.callback',
  PAYMENT_LIST_BY_ORDER: 'payment.listByOrder',
} as const;

// ── Kafka Topics (Phase 2+) ──
export const KAFKA_TOPICS = {
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_DELIVERED: 'order.delivered',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_REFUNDED: 'payment.refunded',
  USER_REGISTERED: 'user.registered',
} as const;

// ── RabbitMQ ──
export const RABBITMQ_QUEUES = {
  EMAIL: 'email.queue',
  IN_APP_NOTIFICATION: 'inapp.queue',
  DEAD_LETTER: 'notification.dead',
} as const;

// ── Redis Key Patterns ──
export const REDIS_KEYS = {
  CART: (customerId: string) => `cart:${customerId}`,
  TOKEN_BLACKLIST: (jti: string) => `blacklist:token:${jti}`,
  RATE_LIMIT: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`,
  RESTAURANT_CACHE: (lat: string, lng: string) => `cache:restaurants:nearby:${lat}:${lng}`,
  MENU_CACHE: (restaurantId: string) => `cache:menu:${restaurantId}`,
  ORDER_TIMEOUT: (orderId: string) => `order:timeout:${orderId}`,
  DRIVER_LOCATIONS: 'drivers:locations',
  IDEMPOTENCY: (key: string) => `idempotency:${key}`,
} as const;

// ── User Roles ──
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

// ── Order Status ──
export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// ── Payment ──
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  COD = 'COD',
  MOMO = 'MOMO',
  VNPAY = 'VNPAY',
  BANK_TRANSFER = 'BANK_TRANSFER',
}
