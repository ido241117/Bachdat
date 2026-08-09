import "dotenv/config";
import mongoose from "mongoose";
import { env } from "./config/env";
import { Category, Restaurant, MenuItem } from "./models";
import { slugify } from "./utils/helpers";

type MenuDef = {
  name: string;
  description: string;
  price: number;
  image: string;
  menuSection: "featured" | "mains" | "drinks" | "desserts";
  isFeatured?: boolean;
  sortOrder: number;
};

type RestaurantDef = {
  name: string;
  coverImage: string;
  tags: string[];
  categorySlug: string;
  rating: number;
  reviewCount: number;
  priceLevel: "$" | "$$" | "$$$";
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  coordinates: [number, number];
  address: string;
  hasFreeShip: boolean;
  isPopular: boolean;
  openingHours: string;
  menu: MenuDef[];
};

const NEW_CATEGORIES = [
  { name: "Bánh mì", slug: "banh-mi", icon: "bakery", sortOrder: 5 },
  { name: "Pizza", slug: "pizza", icon: "pizza", sortOrder: 6 },
  { name: "Sushi", slug: "sushi", icon: "sushi", sortOrder: 7 },
  { name: "Gà rán", slug: "ga-ran", icon: "chicken", sortOrder: 8 },
  { name: "Cà phê", slug: "ca-phe", icon: "coffee", sortOrder: 9 },
];

const RESTAURANTS: RestaurantDef[] = [
  {
    name: "Phở 24 - Lý Chính Thắng",
    coverImage:
      "https://images.unsplash.com/photo-1779738193053-bcfc5623f954?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    tags: ["Phở", "Bún", "Soup"],
    categorySlug: "bun-pho",
    rating: 4.8,
    reviewCount: 1240,
    priceLevel: "$",
    deliveryTimeMin: 20,
    deliveryTimeMax: 25,
    coordinates: [106.6935, 10.7865],
    address: "60 Lý Chính Thắng, Quận 3",
    hasFreeShip: true,
    isPopular: true,
    openingHours: "06:00 - 22:00",
    menu: [
      { name: "Phở bò tái chín đặc biệt", description: "Nước dùng hầm xương 8 tiếng, thịt tái mềm, bánh phở dai", price: 65000, image: "https://images.unsplash.com/photo-1597345637412-9fd611e758f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 1 },
      { name: "Phở bò viên bắp", description: "Viên bò thủ công, bắp hoa giòn, nước dùng thanh ngọt", price: 55000, image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 2 },
      { name: "Bún bò Huế cay đặc biệt", description: "Sả, mắm ruốc Huế, chả cua, thịt bắp heo, ớt tươi", price: 60000, image: "https://images.unsplash.com/photo-1677837914128-2367031a11e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 3 },
      { name: "Phở gà truyền thống", description: "Gà ta thả vườn, nước dùng ngọt tự nhiên, không bột ngọt", price: 55000, image: "https://images.unsplash.com/photo-1509072619873-adb3dc289b50?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 1 },
      { name: "Phở bò sốt vang", description: "Đặc sản miền Bắc, thịt hầm mềm tan, vị đậm đà, thơm sả ớt", price: 75000, image: "https://images.unsplash.com/photo-1503764654157-72d979d9af2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 2 },
      { name: "Phở gà nướng", description: "Gà nướng than hoa xé thịt, ăn kèm rau thơm và tương hoisin", price: 70000, image: "https://images.unsplash.com/photo-1535007813616-79dc02ba4021?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 3 },
      { name: "Phở chay nấm đặc biệt", description: "Nước dùng rau củ thuần chay, nấm hương, đậu hũ non, hành phi", price: 50000, image: "https://images.unsplash.com/photo-1511910849309-0dffb8785146?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 4 },
      { name: "Bún thịt nướng chả giò", description: "Bún tươi, thịt nướng thơm, chả giò giòn, rau sống đồ chua", price: 55000, image: "https://images.unsplash.com/photo-1632558610168-8377309e34c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 5 },
      { name: "Bún riêu cua đồng", description: "Riêu cua xay tươi, cà chua, mắm tôm, đậu hũ chiên vàng", price: 58000, image: "https://images.unsplash.com/photo-1677837914128-2367031a11e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 6 },
      { name: "Trà đá Việt Nam", description: "Trà sen ướp lạnh, uống kèm phở cực hợp", price: 10000, image: "https://images.unsplash.com/photo-1558857563-b371033873b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 1 },
      { name: "Nước mía ép tắc", description: "Mía tươi ép lạnh, thêm tắc chua thanh mát", price: 20000, image: "https://images.unsplash.com/photo-1734770580735-796a00e42cb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 2 },
    ],
  },
  {
    name: "Quán Nướng Hàn Quốc BBQ",
    coverImage:
      "https://images.unsplash.com/photo-1775471246402-65394d074a14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    tags: ["Nướng", "BBQ", "Hàn Quốc"],
    categorySlug: "com",
    rating: 4.7,
    reviewCount: 856,
    priceLevel: "$$",
    deliveryTimeMin: 25,
    deliveryTimeMax: 30,
    coordinates: [106.7101, 10.7825],
    address: "18 Thái Văn Lung, Quận 1",
    hasFreeShip: true,
    isPopular: true,
    openingHours: "10:00 - 23:00",
    menu: [
      { name: "Set BBQ Hàn đặc biệt", description: "Bò, heo, gà nướng than hoa, ăn kèm kim chi và rau cuốn", price: 250000, image: "https://images.unsplash.com/photo-1586058584825-c1e87ed735b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 1 },
      { name: "Sườn bò nướng mật ong", description: "Sườn bò Mỹ ướp 24h, nướng than, sốt mật ong gừng", price: 150000, image: "https://images.unsplash.com/photo-1632558610168-8377309e34c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 2 },
      { name: "Gà nướng sốt gochujang", description: "Gà ta nướng áp chảo, sốt ớt Hàn cay ngọt đặc trưng", price: 120000, image: "https://images.unsplash.com/photo-1632558610168-8377309e34c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 3 },
      { name: "Bò nướng lá lốt", description: "Thịt bò xay ướp sả, nướng cuốn lá lốt, chấm mắm nêm", price: 85000, image: "https://images.unsplash.com/photo-1586058584825-c1e87ed735b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 1 },
      { name: "Heo nướng cổ xả ớt", description: "Cổ heo ướp sả ớt, nướng than hoa giòn bên ngoài, mềm bên trong", price: 95000, image: "https://images.unsplash.com/photo-1677354469663-dc918927fd93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 2 },
      { name: "Bạch tuộc nướng muối ớt", description: "Bạch tuộc tươi nướng, ướp muối ớt xanh, chanh tươi", price: 130000, image: "https://images.unsplash.com/photo-1586058584825-c1e87ed735b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 3 },
      { name: "Cơm trộn bibimbap bò", description: "Cơm trộn Hàn Quốc, rau namul, trứng, bò xào, tương bibimbap", price: 110000, image: "https://images.unsplash.com/photo-1682566509568-ded8649b26bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 4 },
      { name: "Cơm chiên kimchi", description: "Cơm chiên với kim chi, trứng ốp, lạp xưởng Hàn, rong biển", price: 85000, image: "https://images.unsplash.com/photo-1557132853-d4a0a1101bf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 5 },
      { name: "Kim chi cải thảo", description: "Kim chi cải thảo muối chua truyền thống, cay vừa", price: 35000, image: "https://images.unsplash.com/photo-1611520189922-f7b1ba7d801e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 6 },
      { name: "Canh tương doenjang", description: "Canh tương đặc trưng Hàn Quốc, đậu phụ, nấm, rau cải", price: 45000, image: "https://images.unsplash.com/photo-1503764654157-72d979d9af2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 7 },
      { name: "Soju Jinro", description: "Rượu soju Hàn Quốc 360ml, hương vị nguyên bản", price: 80000, image: "https://images.unsplash.com/photo-1639927663411-35f23bb792b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 1 },
      { name: "Nước ép táo Hàn", description: "Nước ép táo Hàn Quốc tự nhiên, lạnh sảng khoái", price: 35000, image: "https://images.unsplash.com/photo-1734770580735-796a00e42cb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 2 },
    ],
  },
  {
    name: "Cơm Tấm Bà Bảy",
    coverImage:
      "https://images.unsplash.com/photo-1771830916708-94e321da6e6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    tags: ["Cơm Tấm", "Cơm", "Thịt"],
    categorySlug: "com",
    rating: 4.9,
    reviewCount: 2103,
    priceLevel: "$",
    deliveryTimeMin: 15,
    deliveryTimeMax: 20,
    coordinates: [106.6958, 10.7691],
    address: "34 Nguyễn Trãi, Quận 1",
    hasFreeShip: false,
    isPopular: true,
    openingHours: "06:00 - 21:00",
    menu: [
      { name: "Cơm tấm sườn bì chả", description: "Combo đầy đủ: sườn nướng, bì, chả trứng, đồ chua, mắm pha", price: 65000, image: "https://images.unsplash.com/photo-1682566509568-ded8649b26bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 1 },
      { name: "Cơm tấm sườn đặc biệt", description: "Sườn non nướng mật ong 3 miếng, ăn kèm bì và chả hấp", price: 75000, image: "https://images.unsplash.com/photo-1557132853-d4a0a1101bf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 2 },
      { name: "Cơm gà Hải Nam", description: "Gà hấp mềm ngọt, cơm gà nấu nước dùng gà, nước chấm gừng", price: 70000, image: "https://images.unsplash.com/photo-1679279726937-122c49626802?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 3 },
      { name: "Cơm tấm sườn nướng", description: "Sườn non nướng than hoa, cơm tấm dẻo, dưa cải chua", price: 55000, image: "https://images.unsplash.com/photo-1682566509568-ded8649b26bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 1 },
      { name: "Cơm tấm bì", description: "Bì heo sợi trộn thính, thơm và ăn kèm dưa leo, cà chua", price: 45000, image: "https://images.unsplash.com/photo-1557132853-d4a0a1101bf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 2 },
      { name: "Cơm tấm chả trứng", description: "Chả trứng hấp mềm, bì heo thính, mắm pha chuẩn vị", price: 50000, image: "https://images.unsplash.com/photo-1679279726937-122c49626802?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 3 },
      { name: "Cơm chiên dương châu", description: "Trứng, tôm, lạp xưởng, hành lá, cơm hạt dài thơm", price: 55000, image: "https://images.unsplash.com/photo-1677354469663-dc918927fd93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 4 },
      { name: "Trứng ốp la", description: "Trứng gà ta ốp vàng, lòng đào mềm", price: 10000, image: "https://images.unsplash.com/photo-1611520189922-f7b1ba7d801e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 5 },
      { name: "Thêm sườn nướng", description: "1 miếng sườn non nướng than hoa thêm vào phần ăn", price: 25000, image: "https://images.unsplash.com/photo-1586058584825-c1e87ed735b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 6 },
      { name: "Cà phê đá", description: "Cà phê phin Việt Nam, đá viên, sữa đặc", price: 20000, image: "https://images.unsplash.com/photo-1639927663411-35f23bb792b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 1 },
      { name: "Nước dừa tươi", description: "Dừa tươi nguyên trái, nước dừa ngọt thanh mát", price: 25000, image: "https://images.unsplash.com/photo-1734770580735-796a00e42cb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 2 },
    ],
  },
  {
    name: "Bánh Mì Huỳnh Hoa",
    coverImage:
      "https://images.unsplash.com/photo-1775471246402-65394d074a14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    tags: ["Bánh Mì", "Sandwich"],
    categorySlug: "banh-mi",
    rating: 4.9,
    reviewCount: 3214,
    priceLevel: "$",
    deliveryTimeMin: 10,
    deliveryTimeMax: 15,
    coordinates: [106.6981, 10.7773],
    address: "26 Lê Thị Riêng, Quận 1",
    hasFreeShip: true,
    isPopular: true,
    openingHours: "07:00 - 20:00",
    menu: [
      { name: "Bánh mì thịt đặc biệt", description: "Đặc sản nổi tiếng: thịt nguội, pate, chả lụa, rau thơm", price: 35000, image: "https://images.unsplash.com/photo-1715925717150-2a6d181d8846?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 1 },
      { name: "Bánh mì pate trứng", description: "Pate gan heo mịn, trứng ốp mềm, bơ và rau mùi", price: 30000, image: "https://images.unsplash.com/photo-1600454309261-3dc9b7597637?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 2 },
      { name: "Bánh mì gà xé", description: "Gà xé phay, sốt mayonnaise, dưa leo, cà rốt bào", price: 30000, image: "https://images.unsplash.com/photo-1715925717150-2a6d181d8846?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 1 },
      { name: "Bánh mì chả cá", description: "Chả cá thác lác tươi, sả ớt, húng quế tươi giòn", price: 30000, image: "https://images.unsplash.com/photo-1600454309261-3dc9b7597637?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 2 },
      { name: "Bánh mì bò kho", description: "Bò kho sốt đậm đà, cà rốt mềm, ăn kèm bánh mì nóng giòn", price: 40000, image: "https://images.unsplash.com/photo-1677837914128-2367031a11e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 3 },
      { name: "Bánh mì ốp la xúc xích", description: "Trứng ốp vàng, xúc xích heo, pate, bơ và rau thơm", price: 32000, image: "https://images.unsplash.com/photo-1715925717150-2a6d181d8846?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 4 },
      { name: "Bánh mì chay nấm", description: "Nấm xào sả ớt, đậu hũ chiên, rau thơm, không thịt", price: 25000, image: "https://images.unsplash.com/photo-1511910849309-0dffb8785146?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 5 },
      { name: "Cà phê sữa đá", description: "Cà phê phin đậm, đá viên, sữa đặc Ông Thọ", price: 25000, image: "https://images.unsplash.com/photo-1639927663411-35f23bb792b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 1 },
      { name: "Nước cam vắt", description: "Cam tươi vắt lạnh, không đường, nguyên chất", price: 25000, image: "https://images.unsplash.com/photo-1734770580735-796a00e42cb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 2 },
    ],
  },
  {
    name: "Pizza Express - Đồng Khởi",
    coverImage:
      "https://images.unsplash.com/photo-1775471246402-65394d074a14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    tags: ["Pizza", "Ý", "Fast Food"],
    categorySlug: "pizza",
    rating: 4.5,
    reviewCount: 620,
    priceLevel: "$$",
    deliveryTimeMin: 30,
    deliveryTimeMax: 35,
    coordinates: [106.7038, 10.7767],
    address: "72 Đồng Khởi, Quận 1",
    hasFreeShip: true,
    isPopular: false,
    openingHours: "10:00 - 22:00",
    menu: [
      { name: "Pizza hải sản đặc biệt", description: "Tôm, mực, ngao, sốt cà chua, phô mai mozzarella tan chảy", price: 189000, image: "https://images.unsplash.com/photo-1652862729869-2f4e80c1849d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 1 },
      { name: "Pizza bò BBQ", description: "Thịt bò xé, sốt BBQ, hành tây, ớt chuông, phô mai Gouda", price: 175000, image: "https://images.unsplash.com/photo-1677354469663-dc918927fd93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 2 },
      { name: "Pizza Margherita", description: "Sốt cà chua San Marzano, mozzarella tươi, húng quế tươi", price: 145000, image: "https://images.unsplash.com/photo-1652862729869-2f4e80c1849d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 1 },
      { name: "Pizza gà nướng", description: "Gà nướng, ớt chuông, hành tây, sốt trắng béchamel", price: 160000, image: "https://images.unsplash.com/photo-1677354469663-dc918927fd93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 2 },
      { name: "Pizza 4 phô mai", description: "Mozzarella, Gouda, Cheddar, Parmesan, sốt trắng kem", price: 185000, image: "https://images.unsplash.com/photo-1652862729869-2f4e80c1849d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 3 },
      { name: "Pasta carbonara", description: "Mì linguine, trứng, guanciale, phô mai Pecorino, tiêu đen", price: 145000, image: "https://images.unsplash.com/photo-1535007813616-79dc02ba4021?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 4 },
      { name: "Pasta bò băm cà chua", description: "Sốt bolognese truyền thống, thịt bò, cà chua, rượu vang đỏ", price: 135000, image: "https://images.unsplash.com/photo-1503764654157-72d979d9af2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 5 },
      { name: "Pepsi lon", description: "Pepsi lạnh 330ml", price: 25000, image: "https://images.unsplash.com/photo-1558857563-b371033873b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 1 },
      { name: "Nước chanh mint", description: "Chanh tươi, bạc hà, soda lạnh sảng khoái", price: 45000, image: "https://images.unsplash.com/photo-1734770580735-796a00e42cb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 2 },
    ],
  },
  {
    name: "Sushi Hokkaido",
    coverImage:
      "https://images.unsplash.com/photo-1779738193053-bcfc5623f954?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    tags: ["Sushi", "Sashimi", "Nhật"],
    categorySlug: "sushi",
    rating: 4.8,
    reviewCount: 980,
    priceLevel: "$$$",
    deliveryTimeMin: 35,
    deliveryTimeMax: 40,
    coordinates: [106.6978, 10.7708],
    address: "15 Nguyễn Thiệp, Quận 1",
    hasFreeShip: false,
    isPopular: true,
    openingHours: "11:00 - 22:00",
    menu: [
      { name: "Set sushi 16 miếng", description: "Salmon, cá ngừ, tôm, bạch tuộc, trứng cá, cuộn rong biển", price: 320000, image: "https://images.unsplash.com/photo-1557132853-d4a0a1101bf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 1 },
      { name: "Sashimi salmon 8 lát", description: "Cá hồi Na Uy tươi nhập khẩu, lát dày, ăn kèm wasabi xịn", price: 185000, image: "https://images.unsplash.com/photo-1535007813616-79dc02ba4021?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 2 },
      { name: "Sushi salmon avocado", description: "Cá hồi tươi, bơ, dưa leo, cơm nhật, rong biển", price: 145000, image: "https://images.unsplash.com/photo-1557132853-d4a0a1101bf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 1 },
      { name: "Sushi tôm hùm", description: "Tôm hùm tươi hấp, đặt trên cơm nhật, sốt đặc biệt", price: 250000, image: "https://images.unsplash.com/photo-1535007813616-79dc02ba4021?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 2 },
      { name: "Dragon roll", description: "Cuộn tôm tempura, dưa leo, phủ salmon, sốt unagi", price: 195000, image: "https://images.unsplash.com/photo-1557132853-d4a0a1101bf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 3 },
      { name: "Sashimi cá ngừ vây xanh", description: "Bluefin tuna nhập khẩu, vị béo đặc trưng, tươi sống hàng ngày", price: 220000, image: "https://images.unsplash.com/photo-1535007813616-79dc02ba4021?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 4 },
      { name: "Sashimi bạch tuộc", description: "Bạch tuộc tươi cắt lát, giòn dai, ăn kèm gừng ngâm wasabi", price: 145000, image: "https://images.unsplash.com/photo-1557132853-d4a0a1101bf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 5 },
      { name: "Trà xanh matcha lạnh", description: "Matcha Nhật Bản cao cấp, đá viên, sữa tươi", price: 55000, image: "https://images.unsplash.com/photo-1558857563-b371033873b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 1 },
      { name: "Sake Nhật Bản", description: "Rượu sake Nhật truyền thống, uống lạnh hoặc ấm", price: 120000, image: "https://images.unsplash.com/photo-1639927663411-35f23bb792b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 2 },
    ],
  },
  {
    name: "Gà Rán KFC - Nguyễn Huệ",
    coverImage:
      "https://images.unsplash.com/photo-1775471246402-65394d074a14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    tags: ["Gà Rán", "Fast Food"],
    categorySlug: "ga-ran",
    rating: 4.4,
    reviewCount: 1850,
    priceLevel: "$",
    deliveryTimeMin: 15,
    deliveryTimeMax: 20,
    coordinates: [106.7042, 10.7745],
    address: "40 Nguyễn Huệ, Quận 1",
    hasFreeShip: true,
    isPopular: false,
    openingHours: "09:00 - 23:00",
    menu: [
      { name: "Combo 2 gà giòn đặc biệt", description: "2 miếng gà giòn original, khoai tây chiên L, nước ngọt lon", price: 145000, image: "https://images.unsplash.com/photo-1632558610168-8377309e34c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 1 },
      { name: "Gà giòn hot & spicy", description: "3 miếng gà hot & spicy cay nồng, giòn bên ngoài mềm bên trong", price: 115000, image: "https://images.unsplash.com/photo-1586058584825-c1e87ed735b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 2 },
      { name: "Gà nguyên cánh", description: "Cánh gà giòn phủ bột gia vị đặc biệt, chiên vàng ươm", price: 45000, image: "https://images.unsplash.com/photo-1632558610168-8377309e34c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 1 },
      { name: "Gà filét không xương", description: "Filét ức gà không xương, bột giòn, sốt honey mustard", price: 55000, image: "https://images.unsplash.com/photo-1586058584825-c1e87ed735b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 2 },
      { name: "Popcorn gà cay", description: "Gà cắt nhỏ phủ bột cay, ăn vặt siêu nghiện", price: 55000, image: "https://images.unsplash.com/photo-1632558610168-8377309e34c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 3 },
      { name: "Burger gà giòn", description: "Filét gà giòn, rau xà lách, sốt burger đặc biệt, bánh mì mềm", price: 75000, image: "https://images.unsplash.com/photo-1715925717150-2a6d181d8846?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 4 },
      { name: "Zinger burger", description: "Gà cay Zinger kinh điển, phô mai, sốt cay đặc trưng", price: 85000, image: "https://images.unsplash.com/photo-1715925717150-2a6d181d8846?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 5 },
      { name: "Khoai tây chiên L", description: "Khoai tây chiên vàng giòn, muối tiêu", price: 35000, image: "https://images.unsplash.com/photo-1682566509568-ded8649b26bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 6 },
      { name: "Pepsi lon", description: "Pepsi lạnh 330ml, uống kèm gà", price: 20000, image: "https://images.unsplash.com/photo-1558857563-b371033873b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 1 },
    ],
  },
  {
    name: "The Alley - Trà Sữa",
    coverImage:
      "https://images.unsplash.com/photo-1771830916708-94e321da6e6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    tags: ["Trà Sữa", "Đồ Uống"],
    categorySlug: "tra-sua",
    rating: 4.7,
    reviewCount: 760,
    priceLevel: "$",
    deliveryTimeMin: 20,
    deliveryTimeMax: 25,
    coordinates: [106.7002, 10.7761],
    address: "9 Mạc Thị Bưởi, Quận 1",
    hasFreeShip: true,
    isPopular: false,
    openingHours: "08:00 - 22:30",
    menu: [
      { name: "Trà sữa trân châu đường đen", description: "Trà sữa oolong, trân châu đen đường nâu, lắc đều trước uống", price: 55000, image: "https://images.unsplash.com/photo-1558857563-b371033873b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 1 },
      { name: "Matcha latte trân châu", description: "Matcha Nhật Bản, sữa tươi, trân châu trắng, ngọt vừa", price: 65000, image: "https://images.unsplash.com/photo-1734770580735-796a00e42cb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 2 },
      { name: "Cà phê sữa đá Việt Nam", description: "Cà phê phin đậm đà truyền thống, sữa đặc, đá viên", price: 40000, image: "https://images.unsplash.com/photo-1639927663411-35f23bb792b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "featured", isFeatured: true, sortOrder: 3 },
      { name: "Trà sữa hồng trà", description: "Hồng trà Ceylon, sữa tươi, trân châu, ngọt vừa thanh mát", price: 50000, image: "https://images.unsplash.com/photo-1558857563-b371033873b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 1 },
      { name: "Trà sữa khoai môn", description: "Khoai môn tím, sữa tươi, trân châu, màu tím đẹp mắt", price: 55000, image: "https://images.unsplash.com/photo-1734770580735-796a00e42cb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 2 },
      { name: "Trà sữa dâu tây", description: "Dâu tây tươi xay, sữa tươi, trân châu, ngọt ngào hương dâu", price: 60000, image: "https://images.unsplash.com/photo-1558857563-b371033873b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "mains", sortOrder: 3 },
      { name: "Bạc xỉu đặc biệt", description: "Cà phê nhạt, nhiều sữa đặc, uống ấm hoặc lạnh", price: 35000, image: "https://images.unsplash.com/photo-1639927663411-35f23bb792b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 1 },
      { name: "Cold brew 24 giờ", description: "Cà phê ủ lạnh 24h, vị đậm mượt, ít chua, uống đá", price: 55000, image: "https://images.unsplash.com/photo-1639927663411-35f23bb792b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 2 },
      { name: "Nước ép dưa hấu", description: "Dưa hấu tươi nguyên chất, không đường, lạnh mát", price: 35000, image: "https://images.unsplash.com/photo-1734770580735-796a00e42cb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 3 },
      { name: "Sinh tố bơ đậu xanh", description: "Bơ sáp, đậu xanh hấp, sữa tươi, đá xay béo ngậy", price: 55000, image: "https://images.unsplash.com/photo-1611520189922-f7b1ba7d801e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", menuSection: "drinks", sortOrder: 4 },
    ],
  },
];

async function seedExtra() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected. Adding extra restaurant data (non-destructive)...");

  const categoryIdBySlug: Record<string, mongoose.Types.ObjectId> = {};

  // Reuse existing categories (com, tra-sua, bun-pho) or create the new ones
  for (const cat of NEW_CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: cat },
      { upsert: true, new: true }
    );
    categoryIdBySlug[cat.slug] = doc._id;
  }
  const existingCats = await Category.find({
    slug: { $in: ["com", "tra-sua", "bun-pho", "an-vat"] },
  });
  for (const c of existingCats) categoryIdBySlug[c.slug] = c._id;

  let addedRestaurants = 0;
  let addedItems = 0;

  for (const def of RESTAURANTS) {
    const slug = slugify(def.name);
    const already = await Restaurant.findOne({ slug });
    if (already) {
      console.log(`Skip (already exists): ${def.name}`);
      continue;
    }

    const categoryId = categoryIdBySlug[def.categorySlug];
    const restaurant = await Restaurant.create({
      name: def.name,
      slug,
      coverImage: def.coverImage,
      tags: def.tags,
      categoryIds: categoryId ? [categoryId] : [],
      rating: def.rating,
      reviewCount: def.reviewCount,
      priceLevel: def.priceLevel,
      deliveryTimeMin: def.deliveryTimeMin,
      deliveryTimeMax: def.deliveryTimeMax,
      location: { type: "Point", coordinates: def.coordinates },
      address: def.address,
      district: "Quận 1",
      city: "TP. Hồ Chí Minh",
      hasFreeShip: def.hasFreeShip,
      isPopular: def.isPopular,
      isOpen: true,
      openingHours: def.openingHours,
    });

    await MenuItem.insertMany(
      def.menu.map((m) => ({
        restaurantId: restaurant._id,
        name: m.name,
        description: m.description,
        price: m.price,
        image: m.image,
        menuSection: m.menuSection,
        isFeatured: Boolean(m.isFeatured),
        sortOrder: m.sortOrder,
      }))
    );

    addedRestaurants += 1;
    addedItems += def.menu.length;
    console.log(`Added: ${def.name} (${def.menu.length} món)`);
  }

  console.log(`\n✅ Xong! Thêm ${addedRestaurants} nhà hàng, ${addedItems} món.`);
  console.log(`Tổng nhà hàng hiện có: ${await Restaurant.countDocuments()}`);
  console.log(`Tổng món hiện có: ${await MenuItem.countDocuments()}`);

  await mongoose.disconnect();
}

seedExtra().catch((err) => {
  console.error(err);
  process.exit(1);
});
