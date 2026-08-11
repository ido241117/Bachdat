export type OrderStatus = 'delivering' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  restaurantName: string;
  date: string;
  items: string;
  total: number;
  status: OrderStatus;
  image: string;
  apiStatus: string;
  restaurantId?: string;
  reviewed?: boolean;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  delivering: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};
