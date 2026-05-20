/**
 * QuickBite Seed Script
 * Seeds restaurants (PostgreSQL) + menu items (MongoDB)
 * Run: npx ts-node -r tsconfig-paths/register scripts/seed.ts
 */

import { DataSource } from 'typeorm';
import { MongoClient, ObjectId } from 'mongodb';
import * as bcrypt from 'bcrypt';

// ── Config ──
const PG_CONFIG = {
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'postgres',
};

const MONGO_URI = 'mongodb://quickbite:quickbite_secret@localhost:27017';
const MONGO_DB = 'quickbite_restaurants';

// ── Users to seed ──
const USERS = [
  {
    id: 'aaaaaaaa-1111-4000-a000-000000000001',
    fullName: 'Nguyễn Văn Owner',
    phone: '0901000001',
    email: 'owner@quickbite.vn',
    role: 'RESTAURANT_OWNER',
    status: 'ACTIVE',
  },
  {
    id: 'aaaaaaaa-2222-4000-a000-000000000002',
    fullName: 'Trần Văn Driver',
    phone: '0901000002',
    email: 'driver@quickbite.vn',
    role: 'DRIVER',
    status: 'ACTIVE',
  },
];

const PASSWORD_HASH = bcrypt.hashSync('123456', 10);

// ── Restaurant Categories ──
const CATEGORIES = [
  { name: 'Phở', sortOrder: 1 },
  { name: 'Bún', sortOrder: 2 },
  { name: 'Cơm', sortOrder: 3 },
  { name: 'Pizza', sortOrder: 4 },
  { name: 'Cà phê', sortOrder: 5 },
  { name: 'Trà sữa', sortOrder: 6 },
  { name: 'Bánh mì', sortOrder: 7 },
  { name: 'Gà rán', sortOrder: 8 },
  { name: 'Lẩu', sortOrder: 9 },
  { name: 'Sushi', sortOrder: 10 },
];

// ── Restaurants ──
const OWNER_ID = USERS[0].id;

const RESTAURANTS = [
  {
    name: 'Bún Bò Huế 3 Đình',
    description: 'Quán bún bò Huế truyền thống, nước dùng đậm đà, thịt bò tươi ngon mỗi ngày.',
    address: '45 Nguyễn Trãi, Q.5, TP.HCM',
    phone: '0901234567',
    coverImage: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&h=380&fit=crop',
    latitude: 10.7583, longitude: 106.6681,
    openTime: '06:00', closeTime: '22:00',
    rating: 4.8, totalReviews: 245, totalOrders: 1250,
    deliveryTime: '20-30 phút',
    categoryNames: ['Bún'],
  },
  {
    name: 'Cơm Tấm Sài Gòn Ngon',
    description: 'Cơm tấm sườn bì chả chuẩn vị Sài Gòn.',
    address: '123 Lê Lợi, Q.1, TP.HCM',
    phone: '0902345678',
    coverImage: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=380&fit=crop',
    latitude: 10.7721, longitude: 106.6982,
    openTime: '05:30', closeTime: '21:00',
    rating: 4.5, totalReviews: 180, totalOrders: 890,
    deliveryTime: '15-25 phút',
    categoryNames: ['Cơm'],
  },
  {
    name: 'Pizza Express',
    description: 'Pizza kiểu Ý với đế mỏng giòn, phô mai kéo sợi.',
    address: '78 Hai Bà Trưng, Q.3, TP.HCM',
    phone: '0903456789',
    coverImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=380&fit=crop',
    latitude: 10.7807, longitude: 106.6925,
    openTime: '10:00', closeTime: '23:00',
    rating: 4.3, totalReviews: 120, totalOrders: 650,
    deliveryTime: '30-45 phút',
    categoryNames: ['Pizza'],
  },
  {
    name: 'Phở Bà Chiểu',
    description: 'Phở bò truyền thống Hà Nội, nước dùng ninh xương 12 tiếng.',
    address: '256 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM',
    phone: '0904567890',
    coverImage: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&h=380&fit=crop',
    latitude: 10.8002, longitude: 106.7112,
    openTime: '06:00', closeTime: '22:00',
    rating: 4.7, totalReviews: 310, totalOrders: 2100,
    deliveryTime: '20-30 phút',
    categoryNames: ['Phở'],
  },
  {
    name: 'Highlands Coffee',
    description: 'Chuỗi cà phê Việt Nam với menu đa dạng.',
    address: '100 Nguyễn Huệ, Q.1, TP.HCM',
    phone: '0905678901',
    coverImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=380&fit=crop',
    latitude: 10.7737, longitude: 106.7030,
    openTime: '07:00', closeTime: '23:00',
    rating: 4.2, totalReviews: 450, totalOrders: 3200,
    deliveryTime: '10-20 phút',
    categoryNames: ['Cà phê'],
  },
  {
    name: 'Bánh Mì Hội An',
    description: 'Bánh mì Hội An với pate đặc biệt, thịt xíu mềm tan.',
    address: '12 Trần Hưng Đạo, Q.1, TP.HCM',
    phone: '0907890123',
    coverImage: 'https://images.unsplash.com/photo-1600688640154-9619e002df30?w=600&h=380&fit=crop',
    latitude: 10.7680, longitude: 106.6936,
    openTime: '06:00', closeTime: '20:00',
    rating: 4.4, totalReviews: 290, totalOrders: 1800,
    deliveryTime: '10-15 phút',
    categoryNames: ['Bánh mì'],
  },
  {
    name: 'Trà Sữa Bobapop',
    description: 'Trà sữa tự chọn topping, trân châu tươi mỗi ngày.',
    address: '200 Cách Mạng Tháng 8, Q.3, TP.HCM',
    phone: '0909012345',
    coverImage: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&h=380&fit=crop',
    latitude: 10.7856, longitude: 106.6810,
    openTime: '08:00', closeTime: '23:00',
    rating: 4.3, totalReviews: 680, totalOrders: 5600,
    deliveryTime: '10-15 phút',
    categoryNames: ['Trà sữa'],
  },
  {
    name: 'Gà Rán Crispy House',
    description: 'Gà rán giòn tan, sốt cay Hàn Quốc.',
    address: '88 Nguyễn Thị Minh Khai, Q.3, TP.HCM',
    phone: '0908901234',
    coverImage: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&h=380&fit=crop',
    latitude: 10.7812, longitude: 106.6890,
    openTime: '10:00', closeTime: '22:00',
    rating: 4.1, totalReviews: 350, totalOrders: 2400,
    deliveryTime: '20-30 phút',
    categoryNames: ['Gà rán'],
  },
];

// ── Menu items per restaurant (by index) ──
function buildMenuItems(restaurantId: string, restaurantIndex: number) {
  const menus: Record<number, { categories: { name: string; items: any[] }[] }> = {
    0: { // Bún Bò Huế
      categories: [
        { name: 'Bún Bò', items: [
          { name: 'Bún Bò Huế Đặc Biệt', basePrice: 85000, description: 'Tô lớn đầy đủ thịt bò, giò heo, chả', image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=300&h=300&fit=crop' },
          { name: 'Bún Bò Huế Thường', basePrice: 55000, description: 'Tô vừa, thịt bò tái', image: null },
          { name: 'Bún Bò Giò Heo', basePrice: 75000, description: 'Giò heo hầm mềm', image: null },
        ]},
        { name: 'Đồ uống', items: [
          { name: 'Trà Đá', basePrice: 5000, description: null, image: null },
          { name: 'Nước Ngọt', basePrice: 15000, description: 'Coca/Pepsi/7Up', image: null },
        ]},
      ],
    },
    1: { // Cơm Tấm
      categories: [
        { name: 'Cơm Tấm', items: [
          { name: 'Cơm Tấm Sườn Bì Chả', basePrice: 50000, description: 'Combo đầy đủ sườn bì chả', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=300&fit=crop' },
          { name: 'Cơm Tấm Sườn Nướng', basePrice: 40000, description: 'Sườn nướng than hoa', image: null },
          { name: 'Cơm Tấm Bì Chả', basePrice: 35000, description: null, image: null },
        ]},
        { name: 'Thêm', items: [
          { name: 'Trứng Ốp La', basePrice: 8000, description: null, image: null },
          { name: 'Canh Chua', basePrice: 15000, description: null, image: null },
        ]},
      ],
    },
    2: { // Pizza
      categories: [
        { name: 'Pizza', items: [
          { name: 'Pizza Margherita (L)', basePrice: 159000, description: 'Phô mai mozzarella, cà chua, basil', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=300&fit=crop' },
          { name: 'Pizza Pepperoni (L)', basePrice: 179000, description: 'Xúc xích pepperoni, phô mai', image: null },
          { name: 'Pizza Hải Sản (L)', basePrice: 199000, description: 'Tôm, mực, nghêu', image: null },
        ]},
        { name: 'Đồ uống', items: [
          { name: 'Coca Cola', basePrice: 20000, description: null, image: null },
          { name: 'Khoai Tây Chiên', basePrice: 45000, description: 'Size L, giòn tan', image: null },
        ]},
      ],
    },
    3: { // Phở
      categories: [
        { name: 'Phở', items: [
          { name: 'Phở Bò Tái Nạm', basePrice: 55000, description: 'Phở bò tái nạm truyền thống', image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=300&h=300&fit=crop' },
          { name: 'Phở Bò Viên', basePrice: 50000, description: 'Bò viên dai giòn', image: null },
          { name: 'Phở Gà', basePrice: 50000, description: 'Gà ta xé nhỏ', image: null },
          { name: 'Phở Đặc Biệt', basePrice: 75000, description: 'Tái, nạm, gân, gầu, sách', image: null },
        ]},
      ],
    },
    4: { // Highlands
      categories: [
        { name: 'Cà phê', items: [
          { name: 'Phin Sữa Đá', basePrice: 39000, description: 'Cà phê phin truyền thống', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop' },
          { name: 'Cà Phê Đen Đá', basePrice: 29000, description: null, image: null },
          { name: 'Freeze Trà Xanh', basePrice: 55000, description: 'Trà xanh đá xay', image: null },
        ]},
        { name: 'Trà', items: [
          { name: 'Trà Sen Vàng', basePrice: 49000, description: 'Best seller', image: null },
          { name: 'Trà Thạch Đào', basePrice: 49000, description: null, image: null },
        ]},
      ],
    },
    5: { // Bánh mì
      categories: [
        { name: 'Bánh Mì', items: [
          { name: 'Bánh Mì Thịt Đặc Biệt', basePrice: 35000, description: 'Đầy đủ pate, thịt nguội, chả', image: 'https://images.unsplash.com/photo-1600688640154-9619e002df30?w=300&h=300&fit=crop' },
          { name: 'Bánh Mì Chả Cá', basePrice: 25000, description: null, image: null },
          { name: 'Bánh Mì Gà', basePrice: 30000, description: null, image: null },
        ]},
      ],
    },
    6: { // Trà sữa
      categories: [
        { name: 'Trà Sữa', items: [
          { name: 'Trà Sữa Trân Châu', basePrice: 35000, description: 'Trân châu đen dẻo', image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=300&h=300&fit=crop' },
          { name: 'Trà Sữa Matcha', basePrice: 40000, description: null, image: null },
          { name: 'Trà Sữa Oolong', basePrice: 38000, description: null, image: null },
        ]},
        { name: 'Topping', items: [
          { name: 'Trân Châu Trắng', basePrice: 8000, description: null, image: null },
          { name: 'Pudding', basePrice: 10000, description: null, image: null },
        ]},
      ],
    },
    7: { // Gà rán
      categories: [
        { name: 'Gà Rán', items: [
          { name: 'Gà Rán Sốt Cay (3 miếng)', basePrice: 79000, description: 'Sốt cay Hàn Quốc', image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&h=300&fit=crop' },
          { name: 'Gà Rán Truyền Thống (3 miếng)', basePrice: 69000, description: null, image: null },
          { name: 'Gà Viên Chiên', basePrice: 35000, description: '6 viên', image: null },
        ]},
        { name: 'Combo', items: [
          { name: 'Combo Gà + Khoai + Nước', basePrice: 99000, description: '3 miếng gà + khoai tây + 1 nước', image: null },
        ]},
      ],
    },
  };

  const menu = menus[restaurantIndex];
  if (!menu) return { categories: [], items: [] };

  const result: { categories: any[]; items: any[] } = { categories: [], items: [] };
  let catOrder = 0;

  for (const cat of menu.categories) {
    const catId = new ObjectId().toString();
    result.categories.push({
      _id: new ObjectId(catId),
      restaurantId,
      name: cat.name,
      sortOrder: catOrder++,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    let itemOrder = 0;
    for (const item of cat.items) {
      result.items.push({
        restaurantId,
        categoryId: catId,
        categoryName: cat.name,
        name: item.name,
        description: item.description,
        basePrice: item.basePrice,
        image: item.image,
        isAvailable: true,
        totalSold: Math.floor(Math.random() * 500),
        sortOrder: itemOrder++,
        optionGroups: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return result;
}

// ── Reviews ──
const REVIEW_COMMENTS = [
  'Quán ngon lắm, sẽ quay lại!',
  'Đồ ăn tươi, phục vụ nhanh.',
  'Giá hơi cao nhưng chất lượng tốt.',
  'Giao hàng nhanh, đóng gói cẩn thận.',
  'Món ăn vừa miệng, rất hài lòng.',
  'Phần ăn nhiều, giá phải chăng.',
  'Lần đầu đặt, rất ấn tượng!',
  'Hương vị đúng chuẩn, 10 điểm.',
];

// ══════════ MAIN ══════════
async function seed() {
  console.log('🌱 Starting QuickBite seed...\n');

  // ── 1. Seed Users (PostgreSQL - quickbite_users) ──
  const userDs = new DataSource({
    type: 'postgres',
    ...PG_CONFIG,
    database: 'quickbite_users',
    synchronize: false,
  });
  await userDs.initialize();
  console.log('✅ Connected to quickbite_users');

  for (const u of USERS) {
    const exists = await userDs.query('SELECT id FROM users WHERE id = $1', [u.id]);
    if (exists.length === 0) {
      await userDs.query(
        `INSERT INTO users (id, "fullName", phone, email, "passwordHash", role, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [u.id, u.fullName, u.phone, u.email, PASSWORD_HASH, u.role, u.status],
      );
      console.log(`  👤 Created user: ${u.fullName} (${u.role})`);
    } else {
      console.log(`  ⏭️  User exists: ${u.fullName}`);
    }
  }

  await userDs.destroy();

  // ── 2. Seed Restaurants + Categories (PostgreSQL - quickbite_restaurants) ──
  const restDs = new DataSource({
    type: 'postgres',
    ...PG_CONFIG,
    database: 'quickbite_restaurants',
    synchronize: false,
  });
  await restDs.initialize();
  console.log('✅ Connected to quickbite_restaurants');

  // Seed restaurant_categories
  const categoryIdMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const existing = await restDs.query('SELECT id FROM restaurant_categories WHERE name = $1', [cat.name]);
    if (existing.length > 0) {
      categoryIdMap[cat.name] = existing[0].id;
      console.log(`  ⏭️  Category exists: ${cat.name}`);
    } else {
      const result = await restDs.query(
        `INSERT INTO restaurant_categories (id, name, "sortOrder") VALUES (gen_random_uuid(), $1, $2) RETURNING id`,
        [cat.name, cat.sortOrder],
      );
      categoryIdMap[cat.name] = result[0].id;
      console.log(`  🏷️  Created category: ${cat.name}`);
    }
  }

  // Seed restaurants
  const restaurantIds: string[] = [];
  for (const r of RESTAURANTS) {
    const existing = await restDs.query('SELECT id FROM restaurants WHERE name = $1 AND "ownerId" = $2', [r.name, OWNER_ID]);
    let restId: string;

    if (existing.length > 0) {
      restId = existing[0].id;
      console.log(`  ⏭️  Restaurant exists: ${r.name}`);
    } else {
      const result = await restDs.query(
        `INSERT INTO restaurants (id, "ownerId", name, description, address, phone, "coverImage", latitude, longitude, "openTime", "closeTime", "isOnline", rating, "totalReviews", "totalOrders", "deliveryTime", status)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12, $13, $14, 'APPROVED')
         RETURNING id`,
        [OWNER_ID, r.name, r.description, r.address, r.phone, r.coverImage, r.latitude, r.longitude, r.openTime, r.closeTime, r.rating, r.totalReviews, r.totalOrders, r.deliveryTime],
      );
      restId = result[0].id;
      console.log(`  🍜 Created restaurant: ${r.name}`);

      // Link categories
      for (const catName of r.categoryNames) {
        const catId = categoryIdMap[catName];
        if (catId) {
          await restDs.query(
            `INSERT INTO restaurant_category_mapping ("restaurantId", "categoryId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [restId, catId],
          );
        }
      }
    }
    restaurantIds.push(restId);
  }

  // Seed reviews
  for (let i = 0; i < restaurantIds.length; i++) {
    const existingReviews = await restDs.query('SELECT COUNT(*) as cnt FROM reviews WHERE "restaurantId" = $1', [restaurantIds[i]]);
    if (parseInt(existingReviews[0].cnt) > 0) continue;

    const numReviews = 3 + Math.floor(Math.random() * 5);
    for (let j = 0; j < numReviews; j++) {
      await restDs.query(
        `INSERT INTO reviews (id, "restaurantId", "customerId", "orderId", "customerName", rating, comment, "createdAt")
         VALUES (gen_random_uuid(), $1, $2, NULL, $3, $4, $5, NOW() - interval '${j} days')`,
        [
          restaurantIds[i],
          'aaaaaaaa-3333-4000-a000-00000000000' + (j % 9 + 1),
          ['Nguyễn A', 'Trần B', 'Lê C', 'Phạm D', 'Hoàng E', 'Vũ F', 'Đặng G', 'Bùi H'][j % 8],
          Math.floor(4 + Math.random() * 2), // 4 or 5
          REVIEW_COMMENTS[j % REVIEW_COMMENTS.length],
        ],
      );
    }
    console.log(`  ⭐ Seeded ${numReviews} reviews for: ${RESTAURANTS[i].name}`);
  }

  await restDs.destroy();

  // ── 3. Seed Menu Items (MongoDB) ──
  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  const mongoDB = mongoClient.db(MONGO_DB);
  console.log('✅ Connected to MongoDB');

  const menuCategoriesCol = mongoDB.collection('menu_categories');
  const menuItemsCol = mongoDB.collection('menu_items');

  for (let i = 0; i < restaurantIds.length; i++) {
    const restId = restaurantIds[i];

    // Check if already seeded
    const existingItems = await menuItemsCol.countDocuments({ restaurantId: restId });
    if (existingItems > 0) {
      console.log(`  ⏭️  Menu exists for: ${RESTAURANTS[i].name}`);
      continue;
    }

    const { categories, items } = buildMenuItems(restId, i);

    if (categories.length > 0) {
      await menuCategoriesCol.insertMany(categories);
    }
    if (items.length > 0) {
      await menuItemsCol.insertMany(items);
    }
    console.log(`  🍽️  Seeded ${items.length} menu items for: ${RESTAURANTS[i].name}`);
  }

  await mongoClient.close();

  console.log('\n🎉 Seed completed successfully!');
  console.log(`\n📋 Accounts created:`);
  console.log(`   Owner: owner@quickbite.vn / 123456`);
  console.log(`   Driver: driver@quickbite.vn / 123456`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
