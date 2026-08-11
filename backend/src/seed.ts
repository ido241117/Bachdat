import "dotenv/config";
import mongoose from "mongoose";
import { env } from "./config/env";
import {
  User,
  Category,
  Restaurant,
  MenuItem,
  Banner,
  Voucher,
  Order,
  Cart,
} from "./models";
import { slugify, defaultTrackingSteps } from "./utils/helpers";

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected. Clearing collections...");

  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Restaurant.deleteMany({}),
    MenuItem.deleteMany({}),
    Banner.deleteMany({}),
    Voucher.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
  ]);

  const categories = await Category.insertMany([
    { name: "Cơm", slug: "com", icon: "rice_bowl", sortOrder: 1 },
    { name: "Trà sữa", slug: "tra-sua", icon: "bubble_tea", sortOrder: 2 },
    { name: "Bún/Phở", slug: "bun-pho", icon: "ramen_dining", sortOrder: 3 },
    { name: "Ăn vặt", slug: "an-vat", icon: "fastfood", sortOrder: 4 },
  ]);

  const [catCom, catTraSua, catBunPho, catAnVat] = categories;

  const chickenKing = await Restaurant.create({
    name: "Chicken King - Gà Rán & Mì Ý",
    slug: slugify("Chicken King"),
    coverImage:
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=800",
    tags: ["Gà rán", "Mì Ý", "Thức ăn nhanh"],
    categoryIds: [catAnVat._id],
    rating: 4.8,
    reviewCount: 1200,
    priceLevel: "$$",
    deliveryTimeMin: 25,
    deliveryTimeMax: 30,
    location: { type: "Point", coordinates: [105.7832, 10.0318] },
    address: "112 Hoàng Quốc Việt",
    district: "Ninh Kiều",
    city: "Cần Thơ",
    hasFreeShip: true,
    isPopular: true,
    isOpen: true,
    openingHours: "09:00 - 22:00",
  });

  const bunBoHue = await Restaurant.create({
    name: "Bún Bò Huế Cô Ba",
    slug: slugify("Bun Bo Hue Co Ba"),
    coverImage:
      "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc86?w=800",
    tags: ["Món nước", "Đặc sản Huế"],
    categoryIds: [catBunPho._id],
    rating: 4.5,
    reviewCount: 860,
    priceLevel: "$",
    deliveryTimeMin: 15,
    deliveryTimeMax: 20,
    location: { type: "Point", coordinates: [105.7855, 10.0345] },
    address: "45 Lê Lợi",
    district: "Ninh Kiều",
    city: "Cần Thơ",
    hasFreeShip: false,
    isPopular: true,
    isOpen: true,
    openingHours: "07:00 - 21:00",
  });

  const bepViet = await Restaurant.create({
    name: "Bếp Việt Delights",
    slug: slugify("Bep Viet Delights"),
    coverImage:
      "https://images.unsplash.com/photo-1555126634-323283e090fa?w=800",
    tags: ["Phở", "Cơm tấm", "Món Việt"],
    categoryIds: [catBunPho._id, catCom._id],
    rating: 4.9,
    reviewCount: 2100,
    priceLevel: "$$",
    deliveryTimeMin: 20,
    deliveryTimeMax: 30,
    location: { type: "Point", coordinates: [105.7798, 10.0295] },
    address: "134 Đường 3 Tháng 2",
    district: "Ninh Kiều",
    city: "Cần Thơ",
    hasFreeShip: true,
    isPopular: true,
    isOpen: true,
    openingHours: "08:00 - 22:00",
  });

  const teaHouse = await Restaurant.create({
    name: "Tea House",
    slug: "tea-house",
    coverImage:
      "https://images.unsplash.com/photo-1563822249366-3efb23b8c0e6?w=800",
    tags: ["Trà sữa", "Trà đào"],
    categoryIds: [catTraSua._id],
    rating: 4.6,
    reviewCount: 540,
    priceLevel: "$",
    deliveryTimeMin: 15,
    deliveryTimeMax: 25,
    location: { type: "Point", coordinates: [105.7885, 10.0362] },
    address: "22 Mậu Thân",
    district: "Ninh Kiều",
    city: "Cần Thơ",
    hasFreeShip: false,
    isPopular: false,
    isOpen: true,
  });

  await MenuItem.insertMany([
    // Bếp Việt
    {
      restaurantId: bepViet._id,
      name: "Phở Bò Đặc Biệt",
      description:
        "Nước dùng hầm xương 12 tiếng, thịt bò bắp hoa tươi ngon kèm quẩy giòn rụm.",
      price: 65000,
      image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400",
      menuSection: "featured",
      isFeatured: true,
      sortOrder: 1,
      options: [
        { name: "Thêm thịt bò", price: 15000 },
        { name: "Thêm quẩy", price: 5000 },
        { name: "Ít hành", price: 0 },
      ],
    },
    {
      restaurantId: bepViet._id,
      name: "Bún Chả Hà Nội",
      description: "Chả nướng than hoa thơm lừng, nước chấm chua ngọt chuẩn vị phố cổ.",
      price: 55000,
      image: "https://images.unsplash.com/photo-1585032226701-759b368d7246?w=400",
      menuSection: "featured",
      isFeatured: true,
      sortOrder: 2,
    },
    {
      restaurantId: bepViet._id,
      name: "Cơm Tấm Sườn Bì Chả",
      description: "Sườn nướng mật ong, bì thính, chả trứng.",
      price: 45000,
      image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400",
      menuSection: "mains",
      sortOrder: 1,
    },
    {
      restaurantId: bepViet._id,
      name: "Bún Bò Huế",
      description: "Nước dùng cay nồng, bắp bò, giò heo, chả cua.",
      price: 60000,
      image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc86?w=400",
      menuSection: "mains",
      sortOrder: 2,
    },
    {
      restaurantId: bepViet._id,
      name: "Cà Phê Sữa Đá",
      description: "Cà phê robusta rang xay, sữa đặc.",
      price: 25000,
      image: "https://images.unsplash.com/photo-1514432324607-09f9847a4d4f?w=400",
      menuSection: "drinks",
      sortOrder: 1,
    },
    {
      restaurantId: bepViet._id,
      name: "Trà Đào Cam Sả",
      description: "Trà đào mát lạnh với cam và sả.",
      price: 35000,
      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
      menuSection: "drinks",
      sortOrder: 2,
    },
    {
      restaurantId: bepViet._id,
      name: "Chè Đậu Xanh",
      description: "Chè đậu xanh nước cốt dừa.",
      price: 20000,
      image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400",
      menuSection: "desserts",
      sortOrder: 1,
    },
    // Chicken King
    {
      restaurantId: chickenKing._id,
      name: "Gà rán cay 5 miếng",
      description: "Gà rán giòn cay 5 miếng, kèm khoai tây chiên.",
      price: 69000,
      image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400",
      menuSection: "featured",
      isFeatured: true,
      sortOrder: 1,
      options: [
        { name: "Thêm phô mai", price: 10000 },
        { name: "Ít cay", price: 0 },
      ],
    },
    {
      restaurantId: chickenKing._id,
      name: "Mì Ý bò bằm",
      description: "Sốt cà chua bò bằm, phô mai mozzarella.",
      price: 59000,
      image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
      menuSection: "mains",
      sortOrder: 1,
    },
    {
      restaurantId: chickenKing._id,
      name: "Pepsi lon",
      description: "330ml",
      price: 15000,
      image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400",
      menuSection: "drinks",
      sortOrder: 1,
    },
    // Bún Bò Huế Cô Ba
    {
      restaurantId: bunBoHue._id,
      name: "Bún bò đặc biệt",
      description: "Bắp bò, giò heo, chả cua, huyết.",
      price: 55000,
      image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc86?w=400",
      menuSection: "featured",
      isFeatured: true,
      sortOrder: 1,
    },
    {
      restaurantId: bunBoHue._id,
      name: "Bún bò thường",
      description: "Bắp bò, giò heo.",
      price: 45000,
      image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc86?w=400",
      menuSection: "mains",
      sortOrder: 1,
    },
    // Tea House
    {
      restaurantId: teaHouse._id,
      name: "Trà sữa matcha",
      description: "Matcha Nhật, trân châu đen.",
      price: 32000,
      image: "https://images.unsplash.com/photo-1563822249366-3efb23b8c0e6?w=400",
      menuSection: "featured",
      isFeatured: true,
      sortOrder: 1,
    },
    {
      restaurantId: teaHouse._id,
      name: "Trà sữa truyền thống",
      description: "Trà Đài Loan, topping trân châu.",
      price: 28000,
      image: "https://images.unsplash.com/photo-1558857563-b371033873b8?w=400",
      menuSection: "mains",
      sortOrder: 1,
    },
  ]);

  await Banner.insertMany([
    {
      title: "Giảm 50% cho đơn đầu tiên",
      subtitle: "Áp dụng hôm nay",
      tag: "Ưu đãi mới",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
      linkType: "voucher",
      screen: "home",
      sortOrder: 1,
      isActive: true,
    },
    {
      title: "Miễn phí giao hàng",
      subtitle: "Cho đơn hàng từ 100k",
      tag: "Freeship",
      image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=800",
      linkType: "none",
      screen: "home",
      sortOrder: 2,
      isActive: true,
    },
    {
      title: "Hoàn 10% điểm thưởng",
      subtitle: "Thanh toán MoMo",
      tag: "Cashback",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
      linkType: "none",
      screen: "rewards",
      sortOrder: 1,
      isActive: true,
    },
  ]);

  const vouchers = await Voucher.insertMany([
    {
      code: "MEALNOW20",
      type: "discount_percent",
      title: "Giảm 20% đơn hàng",
      description: "Giảm 20%, tối đa 30.000đ cho đơn từ 50k",
      value: 20,
      maxDiscount: 30000,
      minOrderAmount: 50000,
      applicableTo: "all",
      totalLimit: 5000,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      filterTag: "discount",
      isActive: true,
    },
    {
      code: "FREESHIP",
      type: "freeship",
      title: "Miễn phí vận chuyển",
      description: "Freeship đến 30.000đ, đơn từ 30k",
      value: 30000,
      minOrderAmount: 30000,
      applicableTo: "all",
      totalLimit: 5000,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      filterTag: "freeship",
      isActive: true,
    },
    {
      code: "GIAM15K",
      type: "discount_fixed",
      title: "Giảm 15.000đ",
      description: "Áp dụng mọi đơn từ 0đ — mã demo",
      value: 15000,
      minOrderAmount: 0,
      applicableTo: "all",
      totalLimit: 5000,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      filterTag: "discount",
      isActive: true,
    },
    {
      code: "GIAM30K",
      type: "discount_fixed",
      title: "Giảm 30.000đ",
      description: "Cho đơn từ 100k",
      value: 30000,
      minOrderAmount: 100000,
      applicableTo: "all",
      totalLimit: 5000,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      filterTag: "discount",
      isActive: true,
    },
    {
      code: "MOMO10",
      type: "cashback",
      title: "Hoàn 10% MoMo",
      description: "Cashback tối đa 20k — không trừ ngay trên đơn",
      value: 10,
      maxDiscount: 20000,
      minOrderAmount: 0,
      applicableTo: "all",
      filterTag: "payment",
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ]);

  const user = await User.create({
    phone: "0901234567",
    name: "Minh Anh",
    avatar: "",
    tier: "gold",
    points: 2450,
    role: "user",
    referralCode: "QB4567MINH",
    addresses: [
      {
        label: "Nhà",
        fullAddress: "134 Đ. 3 Tháng 2, An Bình, Ninh Kiều, Cần Thơ",
        note: "Gọi trước khi đến",
        lat: 10.0312,
        lng: 105.783,
        isDefault: true,
      },
      {
        label: "Công ty",
        fullAddress: "22 Mậu Thân, Ninh Kiều, Cần Thơ",
        note: "",
        lat: 10.0362,
        lng: 105.7885,
        isDefault: false,
      },
    ],
    paymentMethods: [
      { type: "momo", label: "MoMo", isDefault: true },
      { type: "zalopay", label: "ZaloPay", isDefault: false },
      { type: "card", label: "Visa •••• 4242", last4: "4242", isDefault: false },
      { type: "cash", label: "Tiền mặt", isDefault: false },
    ],
    savedVoucherIds: [vouchers[0]._id, vouchers[1]._id],
  });

  await User.create({
    phone: "0909999999",
    name: "Admin Mealnow",
    avatar: "",
    tier: "diamond",
    points: 0,
    role: "admin",
    referralCode: "ADMINMEALNOW",
  });

  console.log("Admin login → phone 0909999999 / OTP 123456");

  const pho = await MenuItem.findOne({
    restaurantId: bepViet._id,
    name: "Phở Bò Đặc Biệt",
  });
  const bunCha = await MenuItem.findOne({
    restaurantId: bepViet._id,
    name: "Bún Chả Hà Nội",
  });

  await Order.create({
    userId: user._id,
    restaurantId: bepViet._id,
    restaurantName: bepViet.name,
    restaurantImage: bepViet.coverImage,
    status: "delivering",
    items: [
      {
        menuItemId: pho!._id,
        name: pho!.name,
        price: pho!.price,
        quantity: 1,
        options: ["Ít hành"],
        note: "",
        image: pho!.image,
      },
      {
        menuItemId: bunCha!._id,
        name: bunCha!.name,
        price: bunCha!.price,
        quantity: 1,
        options: [],
        note: "",
        image: bunCha!.image,
      },
    ],
    deliveryAddress: {
      label: "Nhà",
      fullAddress: "134 Đ. 3 Tháng 2, An Bình, Ninh Kiều, Cần Thơ",
      note: "Gọi trước khi đến",
      lat: 10.0312,
      lng: 105.783,
    },
    paymentMethod: "momo",
    subtotal: 120000,
    deliveryFee: 0,
    discount: 0,
    total: 120000,
    note: "",
    trackingSteps: defaultTrackingSteps("delivering"),
  });

  await Order.create({
    userId: user._id,
    restaurantId: chickenKing._id,
    restaurantName: chickenKing.name,
    restaurantImage: chickenKing.coverImage,
    status: "completed",
    items: [
      {
        name: "Gà rán cay 5 miếng",
        price: 69000,
        quantity: 1,
        options: ["Thêm phô mai"],
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400",
      },
    ],
    deliveryAddress: {
      label: "Nhà",
      fullAddress: "134 Đ. 3 Tháng 2, An Bình, Ninh Kiều, Cần Thơ",
      lat: 10.0312,
      lng: 105.783,
    },
    paymentMethod: "cash",
    subtotal: 79000,
    deliveryFee: 0,
    discount: 10000,
    total: 69000,
    voucherCode: "GIAM30K",
    deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    trackingSteps: defaultTrackingSteps("completed"),
  });

  console.log("\n✅ Seed xong!");
  console.log("Demo user: phone=0901234567  OTP=123456");
  console.log(`Restaurants: ${await Restaurant.countDocuments()}`);
  console.log(`Menu items: ${await MenuItem.countDocuments()}`);
  console.log(`Vouchers: ${await Voucher.countDocuments()}`);
  console.log(`Orders: ${await Order.countDocuments()}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
