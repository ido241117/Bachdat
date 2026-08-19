export interface MenuItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  category: string;
  sortOrder?: number;
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
  categoryIds: string[];
  priceLevel: string;
  cuisine: string;
  freeship?: boolean;
  popular?: boolean;
  menu: MenuItem[];
}
