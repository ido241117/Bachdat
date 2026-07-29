export interface Voucher {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeType: 'freeship' | 'discount' | 'ewallet';
  expiry: string;
  expiryType: 'normal' | 'urgent' | 'date';
  action: string;
  discountAmount?: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  image: string;
}

export interface Mission {
  id: string;
  title: string;
  subtitle: string;
  points: string;
  icon: string;
  wide?: boolean;
}

export const LOYALTY = {
  tier: 'Thành viên Vàng',
  points: 2450,
  nextTier: 'Kim Cương',
  pointsToNext: 550,
  progress: 0.7,
};

export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: '1',
    title: 'Giảm 50% cho Pizza',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD0IR8qX3t7iWPKk6r2JqEie7Q_dmE22DYWwmhPA5RoD7WCoglEJSIekQodk_18QSNSifqGJ6uDSdMLqdSpppf69b1FHLVXmkocTPFwM0Wqr8dt92w9riXhyiMDmP8qA7OivgsiHtOByAY51LAKq1EMr7kyxURY71ThE68o_heKgILPx71RrVlOi-Q6MfHJPXQhmsys1FN8YrFGKc0Ly7r2LEAwR7MYBa-6i4wXXz7PCOnYoiiWS6w',
  },
  {
    id: '2',
    title: 'Freeship mọi đơn hàng',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCi8hMFgwioXamAGhATzK5xqeYuJoefBh_miH44EvJpL_qp38AI0vwnTtWdZlFyDKJK3f9cCkC3PrE4fwxe0c7wN83_otUS71zqiHmOdvmmn-u2Sll2iQqw31GpOeEEtA-OE0PhS_JUHqXQSZ_1LOsC8vxtMUFuOyLPdIaHAobC0_48jSX4Uo5CoCqwmGD0DPEc2YGp4ZOVThjyuP_dw-flxZZEzN76Uksjk_NrJE0Jo0VmZ1HHflg',
  },
];

export const VOUCHER_FILTERS = ['Tất cả', 'Freeship', 'Giảm giá món', 'Thanh toán'];

export const VOUCHERS: Voucher[] = [
  {
    id: '1',
    title: 'Miễn phí vận chuyển',
    subtitle: 'Đơn tối thiểu 100k',
    badge: 'Freeship',
    badgeType: 'freeship',
    expiry: 'Hết hạn sau 2 ngày',
    expiryType: 'normal',
    action: 'Lưu',
  },
  {
    id: '2',
    title: 'Giảm 30k cho Coffee',
    subtitle: 'Tất cả cửa hàng đối tác',
    badge: 'Giảm giá',
    badgeType: 'discount',
    discountAmount: '-30k',
    expiry: 'Sắp hết lượt',
    expiryType: 'urgent',
    action: 'Dùng ngay',
  },
  {
    id: '3',
    title: 'Hoàn 10% khi thanh toán',
    subtitle: 'Áp dụng cho Ví QuickPay',
    badge: 'E-Wallet',
    badgeType: 'ewallet',
    expiry: 'Hết hạn: 31/12',
    expiryType: 'date',
    action: 'Lưu',
  },
];

export const MISSIONS: Mission[] = [
  {
    id: '1',
    title: 'Thử món mới ngay',
    subtitle: 'Đặt 1 đơn món Á để nhận 50 điểm',
    points: '+50',
    icon: 'food',
    wide: true,
  },
  {
    id: '2',
    title: 'Mời bạn bè',
    subtitle: 'Nhận 100 điểm/lượt',
    points: '',
    icon: 'share',
  },
  {
    id: '3',
    title: 'Đánh giá 5⭐',
    subtitle: 'Nhận 10 điểm mỗi review',
    points: '',
    icon: 'star',
  },
];

export const PROFILE = {
  name: 'Nguyễn Minh Quân',
  phone: '+84 987 654 321',
  avatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuABQ4La5aOvcwTWaG21LMK1FVowfil83asQ3-tWV0vDct0ECaOwN_HXDvbX-CKMoLJAfeKEiUOZmJo7vHoEkfwZfeNcxPyfuUtZl3Sn9_2EjNMYzAG1TmDRQlE9GcmT1rtqxW6j5RILg3wAzACee9TlBF7vK89GSKvMZqEBvVeNgP8UBCwFpFJ8lehgycjsndm42ngVWblpu72TWXz4xOSqucha1CJdfDytttYZxcARWnE6_tgY_k8',
  tier: 'Thành viên Vàng',
  points: 1250,
  version: '2.4.12',
};

export const CHECKOUT_ITEMS = [
  {
    id: '1',
    name: 'Burger Bò Wagyu Đặc Biệt',
    note: 'Thêm phô mai, Ít hành',
    price: 150000,
    quantity: 1,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBsFqaHNQbjziND6AjInOeQZ2e9_caEz8KIXLOceLZ09dv67jIjvwOPpMl-wYM4tGNBmvRG96Z677NSXMmyFqNuK3wFJySmnU48VjD7I94SXdpmuQDQ-GJWNTfBhx8Upn3cc85iL6EaMMkeKd4IN4GikTH6bcdVXkOJgnZX0XupXlsOB5jQLlbeqvNaTjn-ZnNH60CeNUQtvLL8g3v01Josug1Z8y76RZsx9nmgZodwjcWdc-sLV60',
  },
  {
    id: '2',
    name: 'Salad Ức Gà Nướng',
    note: 'Sốt mè rang',
    price: 85000,
    quantity: 2,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD98NWyvTik6F0bi57gi32sVGxhhlZnGcsPWxt-ZX5s5L9vz3vcFmeJpRIuDzK3aDTsZXJ__7aGh77kyOa5ewK1UF2ywT5M55K-IBK7hdCDi2-4cEquOkJfvSGt8bDJntFNTu0TUMUt3eD2klDYYfvLvOxCW7U6dKJj2sLs6ZN025zuos3A55_Z_Tu3w3YCeYL_TLb6oiKOXppZo9VdQBjBaOo9DDx3-OLFmjfnbxxZyXjMZxCpqB8',
  },
];

export const DELIVERY_ADDRESS = {
  title: 'Căn hộ B12, Tòa nhà Sky',
  address: '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh',
  note: 'Ghi chú: Để ở sảnh lễ tân',
};
