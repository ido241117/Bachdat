export type OrderStatus = 'delivering' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  restaurantName: string;
  date: string;
  items: string;
  total: number;
  status: OrderStatus;
  image: string;
}

export const ACTIVE_ORDERS: Order[] = [
  {
    id: '1',
    restaurantName: 'Burger King - Xuân Thủy',
    date: 'Hôm nay, 12:30',
    items: '2x Whopper, 1x Khoai tây chiên (L), 1x Coca-Cola...',
    total: 245000,
    status: 'delivering',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCRUxy6cZkMVUO11nIYkDc4bATsYwTgku77QsTbOELF1vogmuiktZG3Xn9VLPml6HORK3fsL7UGfix3vvCbjfkFkcnLcU3VGbX9F1qWE6C8qqj7gxIXF3W5oKWmmJquXWgI_68HZ4coaApuJU1ImuOhbl6kxHJjou0ZiBcyCsGfNnam-Z-z4_Bf0jZxlhzb8nukBLVllfHjkUGVJIi5efKm30uUqMydMPAX5G6OErfw1MDKpdCCHpA',
  },
];

export const HISTORY_ORDERS: Order[] = [
  {
    id: '2',
    restaurantName: 'Phở Thìn Lò Đúc',
    date: '20 Tháng 5, 2024',
    items: '1x Phở tái lăn đặc biệt, 1x Quẩy giòn (10 chiếc)',
    total: 115000,
    status: 'completed',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDySCSbHDD4o3ubzSvKxhuj-DxmduDbnLHxl9ro6H6xAQU9_N4YCRIclTixvrfdZT4VQXroCGenDH7DDfidPO5BEq_YaRwwQC4-Whet6cyLpT_OUB5Yak3nNVfjo06OJZaRzII3JB6EwojuZMAfOdCvC55KJhl2T4dlKSNl1Uvf-HAJlbd3Cp3-adsDefGn4FSL9Uo36jMG2WshU0s4xrCZIVlsD8F-eynOkX5hG2K1IMrD76OyVtg',
  },
  {
    id: '3',
    restaurantName: 'The Sushi House',
    date: '15 Tháng 5, 2024',
    items: 'Set Sushi Family (24 miếng), 2x Miso soup',
    total: 540000,
    status: 'cancelled',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBUCdU0UlkSvnZDelLMk5SaJbGOWrpmhU1ufUkxEagbUtz94-cEGmlU0HcMfuJLlEb3XUviD_ctYKf2z-PZH6ETnInwB52l6KWGTwCA4e_XjFlL_jxi7t68bQJgG7RYmWS_2D5KmnzyKS4AIyY3QvfwETmZHQW2_FCx_eI6TEn9ZFYwmCRNLRTHw05Tr3EU6CMxTWEC8NZKak-0xohXTf0oHDq19SHElYWTJenc2inFd4WiCEBfM_Q',
  },
  {
    id: '4',
    restaurantName: 'Koi Thé - Royal City',
    date: '10 Tháng 5, 2024',
    items: '2x Trà sữa trân châu hoàng kim (M)',
    total: 132000,
    status: 'completed',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBmTTjOFDJjo40AYqi4ShNB9bYr2hjw2IREYMOjVL04cPyxbT1CxB0DQkR3D3YTAl5NTqNZOWtoSep_BWIqaeFfd-_MLt3KaS-GG7gPbuZ61IUi5WyjbEnI50kUw-MSTWyNLpkcApJcmNwXZG9PhPTIyrs3OXK_-T67bisJu4GaFnwtiMdBrDZmFOhIBawxHDkqKcTJKY3zdKZ3u1pq4K0AWHdomI-wFQjSPOzxkU7jvXhMr16_928',
  },
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  delivering: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};
