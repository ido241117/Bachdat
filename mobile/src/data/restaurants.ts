export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: 'featured' | 'mains' | 'drinks' | 'desserts';
  layout?: 'card' | 'list' | 'grid';
}

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  heroImage: string;
  rating: number;
  reviewCount: string;
  deliveryTime: string;
  distance: string;
  /** Số km để sort “Gần tôi” */
  distanceKm?: number;
  tags: string[];
  priceLevel: string;
  cuisine: string;
  freeship?: boolean;
  popular?: boolean;
  menu: MenuItem[];
}

export const MENU_CATEGORIES = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'mains', label: 'Món chính' },
  { id: 'drinks', label: 'Đồ uống' },
  { id: 'desserts', label: 'Tráng miệng' },
] as const;
