<div align="center">
  <h1>🍔 QuickBite — Food Ordering & Delivery Platform</h1>
  <p><strong>Backend Microservices</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
    <img src="https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
    <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  </p>
  
  <p>
    Nền tảng đặt món & giao hàng trực tuyến được xây dựng theo kiến trúc <strong>Microservices</strong>,<br>
    sử dụng NestJS, TCP transport, và multi-database architecture.
  </p>

  <p>
    <a href="https://github.com/quydat2710/quickbite-fe">Frontend Repository →</a>
  </p>
</div>

---

## 📋 Mục Lục

- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Tính Năng](#-tính-năng)
- [Tech Stack](#-tech-stack)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Cài Đặt & Chạy](#-cài-đặt--chạy)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Tác Giả](#-tác-giả)

---

## 🏗 Kiến Trúc Hệ Thống

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIENT (Web / Mobile)                        │
│                     http://localhost:3100                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP / REST
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (:3000)                         │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌────────────────┐  │
│  │JWT Auth │  │Rate Limit│  │  Swagger   │  │ Request Router │  │
│  └─────────┘  └──────────┘  └───────────┘  └────────────────┘  │
└──────┬──────────┬──────────────┬──────────────┬─────────────────┘
       │ TCP      │ TCP          │ TCP          │ TCP
       ▼          ▼              ▼              ▼
  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  User   │ │Restaurant│ │  Order   │ │ Payment  │
  │ Service │ │ Service  │ │ Service  │ │ Service  │
  │ (:3001) │ │ (:3002)  │ │ (:3003)  │ │ (:3004)  │
  └────┬────┘ └────┬─────┘ └──┬───┬───┘ └────┬─────┘
       │           │          │   │           │
       ▼           ▼          ▼   ▼           ▼
  ┌─────────┐ ┌─────────┐ ┌─────────┐  ┌─────────┐
  │PostgreSQL│ │PostgreSQL│ │PostgreSQL│  │PostgreSQL│
  │ _users  │ │_restaur. │ │ _orders │  │_payments│
  └─────────┘ └────┬─────┘ └────┬────┘  └─────────┘
                   │             │
              ┌────▼─────┐ ┌────▼────┐
              │ MongoDB  │ │  Redis  │
              │(Menu Data)│ │ (Cart)  │
              └──────────┘ └─────────┘
```

### Luồng Đặt Hàng (Order Flow)

```
Customer                    API Gateway              Services
   │                            │                       │
   │── Login ──────────────────►│── TCP ───────────────►│ User Service
   │◄───── JWT Token ──────────│◄── User + Token ─────│
   │                            │                       │
   │── Add to Cart ────────────►│── TCP ───────────────►│ Order Service → Redis
   │◄───── Cart Updated ──────│◄── Cart ──────────────│
   │                            │                       │
   │── Place Order (COD) ─────►│── TCP ───────────────►│ Order Service
   │                            │── TCP ───────────────►│ Payment Service
   │                            │   └── Auto PAID ─────►│ → Order: CONFIRMED
   │◄───── Order + Payment ───│◄── Results ───────────│
   │                            │                       │
   │── Track Order ────────────►│── TCP ───────────────►│ Order Service
   │◄───── Status Updates ────│◄── Order Detail ──────│
```

### Trạng Thái Đơn Hàng (Order State Machine)

```
                    ┌──────────────┐
                    │PENDING_PAYMENT│
                    └──────┬───────┘
                           │ Payment Success
                    ┌──────▼───────┐
            ┌───────│   CONFIRMED  │◄──── COD (auto)
            │       └──────┬───────┘
            │              │ Restaurant Accept
            │       ┌──────▼───────┐
            │       │  PREPARING   │
            │       └──────┬───────┘
            │              │ Food Ready
            │       ┌──────▼───────┐
            │       │    READY     │
  CANCELLED │       └──────┬───────┘
  (anytime  │              │ Driver Pickup
   before   │       ┌──────▼───────┐
  PREPARING)│       │  PICKED_UP   │
            │       └──────┬───────┘
            │              │ Delivered
            │       ┌──────▼───────┐
            └──────►│  DELIVERED   │
                    └──────────────┘
```

---

## ✨ Tính Năng

### 👤 User Service
| Tính năng | Mô tả |
|-----------|-------|
| Đăng ký / Đăng nhập | Phone + Password, JWT Access & Refresh Token |
| OAuth2 Social Login | Google, Facebook (Passport.js) |
| OTP Verification | Xác thực số điện thoại |
| Profile Management | Cập nhật thông tin, upload avatar (Cloudinary) |
| Address Book | CRUD địa chỉ giao hàng, đánh dấu mặc định |
| Token Blacklist | Logout invalidation via Redis |

### 🍜 Restaurant Service
| Tính năng | Mô tả |
|-----------|-------|
| Restaurant CRUD | Tạo, sửa, tìm kiếm nhà hàng |
| Geo-Search | Tìm quán gần vị trí người dùng |
| Menu Management | Categories + Items (MongoDB flexible schema) |
| Reviews & Ratings | Đánh giá, phản hồi từ chủ quán |
| Toggle Online/Offline | Bật/tắt nhận đơn realtime |

### 🛒 Order Service
| Tính năng | Mô tả |
|-----------|-------|
| Shopping Cart | Redis-backed, 7 ngày TTL, auto merge duplicate items |
| Restaurant Switch Detection | Tự động clear cart khi đổi quán |
| Order Creation | Tạo đơn từ cart, tính phí ship Haversine |
| Delivery Fee Calculator | 15,000đ base + 5,000đ/km (Haversine formula) |
| Order Status Machine | State machine với validation chuyển trạng thái |
| Cancel Order | Huỷ đơn trước khi nhà hàng chuẩn bị |
| Restaurant Dashboard | Quản lý đơn theo nhà hàng |

### 💳 Payment Service
| Tính năng | Mô tả |
|-----------|-------|
| COD | Thanh toán khi nhận hàng — auto-confirm |
| MoMo (Stub) | Payment URL generation, callback handler |
| VNPay (Stub) | Payment URL generation, callback handler |
| Bank Transfer | QR code generation |
| Cross-service Notification | Tự động cập nhật Order status sau khi thanh toán |
| Idempotency | Tránh xử lý callback trùng lặp |

### 🔐 API Gateway
| Tính năng | Mô tả |
|-----------|-------|
| JWT Authentication | Middleware verify + attach user info |
| Rate Limiting | 60 req/min (general), 10 req/min (auth) |
| Swagger/OpenAPI | Auto-generated API docs |
| CORS | Cấu hình cho Frontend |
| Helmet + Compression | Security headers + gzip |
| Request Routing | Forward HTTP → TCP microservices |

---

## 🛠 Tech Stack

| Layer | Technology | Vai trò |
|-------|-----------|---------|
| **Runtime** | Node.js 20+ | JavaScript runtime |
| **Framework** | NestJS 11 | Microservices framework |
| **Language** | TypeScript 5.7 | Type-safe development |
| **Transport** | TCP | Inter-service communication |
| **Primary DB** | PostgreSQL 16 | Users, Orders, Payments, Restaurants |
| **Document DB** | MongoDB 7 | Menu items (flexible schema) |
| **Cache/Queue** | Redis 7 | Cart, token blacklist, caching |
| **Message Queue** | RabbitMQ 3 | Async notifications (Phase 3+) |
| **ORM** | TypeORM 0.3 | PostgreSQL queries |
| **ODM** | Mongoose 8 | MongoDB queries |
| **Auth** | JWT + Passport.js | Authentication & OAuth2 |
| **Docs** | Swagger/OpenAPI | API documentation |
| **Container** | Docker Compose | Infrastructure management |
| **Upload** | Cloudinary | Image storage |

---

## 📁 Cấu Trúc Thư Mục

```
quickbite-be/
├── apps/
│   ├── api-gateway/               # 🌐 HTTP Gateway (port 3000)
│   │   ├── src/
│   │   │   ├── controllers/       # Auth, Users, Restaurants, Orders
│   │   │   ├── guards/            # JWT Guard, Roles Guard
│   │   │   ├── middleware/        # JWT Middleware
│   │   │   ├── app.module.ts      # TCP clients registration
│   │   │   └── main.ts            # Bootstrap + Swagger
│   │   └── tsconfig.app.json
│   │
│   ├── user-service/              # 👤 User & Auth (port 3001)
│   │   ├── src/
│   │   │   ├── auth/              # Register, Login, OAuth, OTP
│   │   │   ├── users/             # Profile CRUD
│   │   │   ├── addresses/         # Address book
│   │   │   └── entities/          # User, Address, RefreshToken, OTP
│   │   └── tsconfig.app.json
│   │
│   ├── restaurant-service/        # 🍜 Restaurant & Menu (port 3002)
│   │   ├── src/
│   │   │   ├── restaurants/       # CRUD, search, toggle online
│   │   │   ├── menu/              # Categories + Items (MongoDB)
│   │   │   ├── reviews/           # Ratings & replies
│   │   │   ├── entities/          # Restaurant, Category, Review
│   │   │   └── schemas/           # Mongoose schemas (Menu)
│   │   └── tsconfig.app.json
│   │
│   ├── order-service/             # 📦 Cart & Orders (port 3003)
│   │   ├── src/
│   │   │   ├── cart/              # Redis-backed shopping cart
│   │   │   ├── orders/            # Order lifecycle management
│   │   │   └── entities/          # Order, OrderItem
│   │   └── tsconfig.app.json
│   │
│   └── payment-service/           # 💳 Payments (port 3004)
│       ├── src/
│       │   ├── payments/          # COD, MoMo, VNPay handlers
│       │   └── entities/          # Payment entity
│       └── tsconfig.app.json
│
├── libs/
│   └── common/                    # 📚 Shared Library
│       └── src/
│           ├── constants/         # Service names, MSG patterns, enums
│           ├── dto/               # ApiResponse, Pagination
│           ├── interfaces/        # IUser, IRequestUser, ITokenPayload
│           ├── decorators/        # @CurrentUser()
│           └── filters/           # AllExceptionsFilter
│
├── docker/
│   ├── docker-compose.yml         # 🐳 All infrastructure services
│   └── postgres/init.sql          # Database initialization
│
├── .env.example                   # Environment template
├── nest-cli.json                  # NestJS monorepo config
├── package.json                   # Dependencies & scripts
└── tsconfig.json                  # Root TypeScript config
```

---

## 🚀 Cài Đặt & Chạy

### Yêu Cầu
- **Node.js** 20+
- **Docker Desktop** (Docker Compose)
- **Git**

### Bước 1: Clone & Install

```bash
git clone https://github.com/quydat2710/quickbite-be.git
cd quickbite-be
npm install
```

### Bước 2: Cấu hình

```bash
cp .env.example .env
# Chỉnh sửa .env nếu cần
```

### Bước 3: Khởi động Infrastructure

```bash
npm run docker:up
```

Sau khi chạy xong sẽ có:

| Service | URL | Mô tả |
|---------|-----|--------|
| PostgreSQL | `localhost:5433` | Database chính |
| MongoDB | `localhost:27017` | Menu data |
| Redis | `localhost:6379` | Cache & Cart |
| RabbitMQ | [localhost:15672](http://localhost:15672) | Message queue UI |
| pgAdmin | [localhost:5050](http://localhost:5050) | DB management UI |
| Mongo Express | [localhost:8081](http://localhost:8081) | MongoDB UI |
| Redis Commander | [localhost:8082](http://localhost:8082) | Redis UI |

### Bước 4: Chạy Backend

```bash
npm run dev
```

| Service | Port | Status |
|---------|------|--------|
| API Gateway | `:3000` | 🚀 HTTP Server + Swagger |
| User Service | `:3001` | 👤 TCP Microservice |
| Restaurant Service | `:3002` | 🍜 TCP Microservice |
| Order Service | `:3003` | 📦 TCP Microservice |
| Payment Service | `:3004` | 💳 TCP Microservice |

### Bước 5: Truy cập

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **Frontend**: http://localhost:3100 ([quickbite-fe](https://github.com/quydat2710/quickbite-fe))

---

## 📡 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/auth/register/customer` | Đăng ký tài khoản |
| `POST` | `/v1/auth/login` | Đăng nhập (JWT) |
| `POST` | `/v1/auth/logout` | Đăng xuất |
| `POST` | `/v1/auth/refresh` | Refresh token |
| `POST` | `/v1/auth/send-otp` | Gửi OTP |
| `POST` | `/v1/auth/verify-otp` | Xác thực OTP |
| `GET` | `/v1/auth/google` | Login Google |
| `GET` | `/v1/auth/facebook` | Login Facebook |

### 👤 Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/users/me` | Xem profile |
| `PATCH` | `/v1/users/me` | Cập nhật profile |
| `GET` | `/v1/users/me/addresses` | Danh sách địa chỉ |
| `POST` | `/v1/users/me/addresses` | Thêm địa chỉ |
| `PATCH` | `/v1/users/me/addresses/:id` | Sửa địa chỉ |
| `DELETE` | `/v1/users/me/addresses/:id` | Xoá địa chỉ |

### 🍜 Restaurants
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/restaurants` | Tìm kiếm / danh sách |
| `GET` | `/v1/restaurants/:id` | Chi tiết nhà hàng |
| `POST` | `/v1/restaurants` | Tạo nhà hàng (Owner) |
| `PATCH` | `/v1/restaurants/:id` | Cập nhật |
| `PATCH` | `/v1/restaurants/:id/toggle-online` | Bật/tắt nhận đơn |
| `GET` | `/v1/restaurants/:id/menu` | Xem menu |
| `POST` | `/v1/restaurants/:id/items` | Thêm món |
| `PATCH` | `/v1/restaurants/:id/items/:itemId` | Sửa món |
| `DELETE` | `/v1/restaurants/:id/items/:itemId` | Xoá món |
| `GET` | `/v1/restaurants/:id/reviews` | Xem đánh giá |
| `POST` | `/v1/restaurants/:id/reviews` | Viết đánh giá |

### 🛒 Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/cart` | Xem giỏ hàng |
| `POST` | `/v1/cart/items` | Thêm vào giỏ |
| `PUT` | `/v1/cart/items/:index` | Cập nhật số lượng |
| `DELETE` | `/v1/cart/items/:index` | Xoá item |
| `DELETE` | `/v1/cart` | Xoá giỏ hàng |

### 📦 Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/orders` | Đặt hàng (từ giỏ) |
| `GET` | `/v1/orders` | Đơn hàng của tôi |
| `GET` | `/v1/orders/:id` | Chi tiết đơn |
| `POST` | `/v1/orders/:id/cancel` | Huỷ đơn |
| `PUT` | `/v1/orders/:id/status` | Cập nhật trạng thái |
| `GET` | `/v1/restaurants/:id/orders` | Đơn của nhà hàng |

### 💳 Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/payments/:id` | Chi tiết thanh toán |
| `POST` | `/v1/payments/callback` | Webhook từ MoMo/VNPay |

---

## 🗄 Database Schema

### PostgreSQL — `quickbite_users`
```sql
users (id, fullName, phone, email, passwordHash, role, status, avatarUrl, ...)
user_addresses (id, userId, label, address, lat, lng, isDefault, ...)
refresh_tokens (id, userId, token, expiresAt, deviceInfo, ...)
otp_requests (id, phone, otpCode, expiresAt, verified, ...)
```

### PostgreSQL — `quickbite_restaurants`
```sql
restaurants (id, ownerId, name, address, lat, lng, rating, status, ...)
restaurant_categories (id, name, iconUrl, sortOrder, ...)
reviews (id, restaurantId, customerId, rating, comment, ...)
```

### PostgreSQL — `quickbite_orders`
```sql
orders (id, customerId, restaurantId, status, paymentMethod, subtotal,
        deliveryFee, total, deliveryAddress, deliveryLat, deliveryLng, ...)
order_items (id, orderId, menuItemId, name, unitPrice, quantity,
             selectedOptions[JSONB], ...)
```

### PostgreSQL — `quickbite_payments`
```sql
payments (id, orderId, customerId, amount, method, status,
          transactionId, paymentUrl, providerResponse[JSONB], ...)
```

### MongoDB — Menu Data
```javascript
menu_categories { _id, restaurantId, name, sortOrder }
menu_items { _id, restaurantId, categoryId, name, price, image, options[], ... }
```

### Redis — Cache & State
```
cart:{userId}           → Shopping cart (7-day TTL)
cache:menu:{restaurantId} → Menu cache
blacklist:token:{jti}   → Invalidated JWT tokens
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Chạy tất cả 5 services (watch mode) |
| `npm run start:dev:gateway` | Chỉ chạy API Gateway |
| `npm run start:dev:order` | Chỉ chạy Order Service |
| `npm run docker:up` | Khởi động databases & tools |
| `npm run docker:down` | Dừng databases |
| `npm run docker:logs` | Xem logs databases |
| `npm run lint` | ESLint check |
| `npm test` | Run tests |

---

## 🗺 Roadmap

- [x] **Phase 1**: User Service + Restaurant Service + API Gateway
- [x] **Phase 2**: Order Service + Payment Service
- [ ] **Phase 3**: Delivery Service + WebSocket Real-time Tracking
- [ ] **Phase 4**: Notification Service (Push, Email, In-app)
- [ ] **Phase 5**: Admin Dashboard APIs + Analytics
- [ ] **Phase 6**: Kafka Event Streaming (replace TCP)

---

## 👨‍💻 Tác Giả

**Quy Dat** — [@quydat2710](https://github.com/quydat2710)

> Full-stack Developer | NestJS Microservices | React

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
