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

export const VOUCHER_FILTERS = [
  'Tất cả',
  'Freeship',
  'Giảm giá món',
  'Thanh toán',
  'Đã lưu',
] as const;
