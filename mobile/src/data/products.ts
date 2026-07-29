export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  category: string;
  rating: number;
  sold: number;
  shop: string;
  description: string;
  images: string[];
}

export const CATEGORIES = [
  { id: '1', name: 'Phở & Bún', icon: 'bowl-mix' },
  { id: '2', name: 'Cơm & Thịt', icon: 'food-drumstick' },
  { id: '3', name: 'Bánh mì', icon: 'bread-slice' },
  { id: '4', name: 'Trà sữa', icon: 'cup' },
  { id: '5', name: 'Pizza', icon: 'pizza' },
  { id: '6', name: 'Sushi', icon: 'fish' },
  { id: '7', name: 'Gà rán', icon: 'food-drumstick-outline' },
  { id: '8', name: 'Cà phê', icon: 'coffee' },
];

export const QUICK_ACTIONS = [
  { id: '1', name: 'Giao nhanh', icon: 'bicycle', color: '#FF7020' },
  { id: '2', name: 'Ưu đãi', icon: 'tag', color: '#00B894' },
  { id: '3', name: 'Flash Sale', icon: 'bolt', color: '#FFC107' },
  { id: '4', name: 'Đồ uống', icon: 'mug-hot', color: '#FF7020' },
];

export const BANNERS = [
  {
    id: '1',
    tag: 'Ưu đãi mới',
    title: 'Miễn phí giao hàng',
    subtitle: 'Cho đơn hàng đầu tiên',
    image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400',
  },
  {
    id: '2',
    tag: 'Hot deal',
    title: 'Giảm 50% món mới',
    subtitle: 'Áp dụng hôm nay',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
  },
  {
    id: '3',
    tag: 'Combo',
    title: 'Combo tiết kiệm',
    subtitle: 'Chỉ từ 49.000đ',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
  },
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Phở bò tái đặc biệt',
    price: 45000,
    originalPrice: 65000,
    discount: 30,
    image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400',
    category: 'Phở & Bún',
    rating: 4.8,
    sold: 1250,
    shop: 'Phở Hà Nội',
    description: 'Phở bò tái đặc biệt với nước dùng ninh 12 giờ, thịt bò tươi ngon, bánh phở mềm dai. Được phục vụ kèm rau thơm, chanh, ớt.',
    images: [
      'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600',
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc86?w=600',
    ],
  },
  {
    id: '2',
    name: 'Bún bò Huế',
    price: 48000,
    originalPrice: 65000,
    discount: 27,
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc86?w=400',
    category: 'Phở & Bún',
    rating: 4.7,
    sold: 890,
    shop: 'Bún Huế Xưa',
    description: 'Bún bò Huế chuẩn vị với nước lèo đậm đà, chả cua, giò heo, tiết luộc.',
    images: [
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc86?w=600',
    ],
  },
  {
    id: '3',
    name: 'Cơm tấm sườn bì chả',
    price: 35000,
    originalPrice: 50000,
    discount: 30,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    category: 'Cơm & Thịt',
    rating: 4.6,
    sold: 2100,
    shop: 'Cơm Tấm Cali',
    description: 'Cơm tấm sườn nướng, bì, chả trứng đầy đủ. Kèm đồ chua và nước mắm pha.',
    images: [
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600',
    ],
  },
  {
    id: '4',
    name: 'Bánh mì thịt nướng',
    price: 25000,
    originalPrice: 35000,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    category: 'Bánh mì',
    rating: 4.9,
    sold: 3200,
    shop: 'Bánh Mì 365',
    description: 'Bánh mì giòn rụm với thịt nướng thơm lừng, pate, chả, rau củ tươi.',
    images: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
    ],
  },
  {
    id: '5',
    name: 'Trà sữa matcha',
    price: 32000,
    originalPrice: 48000,
    discount: 33,
    image: 'https://images.unsplash.com/photo-1563822249366-3efb23b8c0e6?w=400',
    category: 'Trà sữa',
    rating: 4.5,
    sold: 1560,
    shop: 'Tea House',
    description: 'Trà sữa matcha Nhật Bản, vị béo nhẹ, topping trân châu đen.',
    images: [
      'https://images.unsplash.com/photo-1563822249366-3efb23b8c0e6?w=600',
    ],
  },
  {
    id: '6',
    name: 'Pizza hải sản',
    price: 89000,
    originalPrice: 120000,
    discount: 26,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    category: 'Pizza',
    rating: 4.4,
    sold: 670,
    shop: 'Pizza Italia',
    description: 'Pizza size M với tôm, mực, nghêu tươi trên nền phô mai mozzarella.',
    images: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    ],
  },
  {
    id: '7',
    name: 'Sushi set 12 miếng',
    price: 120000,
    originalPrice: 160000,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
    category: 'Sushi',
    rating: 4.8,
    sold: 430,
    shop: 'Sushi Master',
    description: 'Set sushi 12 miếng đa dạng: salmon, tuna, ebi, tamago.',
    images: [
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600',
    ],
  },
  {
    id: '8',
    name: 'Gà rán cay 5 miếng',
    price: 69000,
    originalPrice: 99000,
    discount: 30,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400',
    category: 'Gà rán',
    rating: 4.7,
    sold: 1890,
    shop: 'KFC Style',
    description: 'Gà rán giòn cay 5 miếng, kèm khoai tây chiên và nước ngọt.',
    images: [
      'https://images.unsplash.com/photo-1562967914-608f82629710?w=600',
    ],
  },
  {
    id: '9',
    name: 'Cà phê sữa đá',
    price: 18000,
    originalPrice: 25000,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1514432324607-09f9847a4d4f?w=400',
    category: 'Cà phê',
    rating: 4.6,
    sold: 4500,
    shop: 'Highlands Coffee',
    description: 'Cà phê robusta rang xay, pha với sữa đặc, phục vụ đá viên.',
    images: [
      'https://images.unsplash.com/photo-1514432324607-09f9847a4d4f?w=600',
    ],
  },
  {
    id: '10',
    name: 'Bún chả Hà Nội',
    price: 42000,
    originalPrice: 55000,
    discount: 24,
    image: 'https://images.unsplash.com/photo-1585032226701-759b368d7246?w=400',
    category: 'Phở & Bún',
    rating: 4.5,
    sold: 780,
    shop: 'Bún Chả 1980',
    description: 'Bún chả Hà Nội chuẩn vị với chả nướng than hoa, nước mắm pha chua ngọt.',
    images: [
      'https://images.unsplash.com/photo-1585032226701-759b368d7246?w=600',
    ],
  },
];

export const FLASH_SALE_PRODUCTS = PRODUCTS.filter((p) => p.discount && p.discount >= 27);

export function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + 'đ';
}
