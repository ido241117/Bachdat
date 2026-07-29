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
  tags: string[];
  priceLevel: string;
  cuisine: string;
  freeship?: boolean;
  popular?: boolean;
  menu: MenuItem[];
}

export const HOME_CATEGORIES = [
  { id: '1', name: 'Cơm', icon: 'rice' as const },
  { id: '2', name: 'Trà sữa', icon: 'cup' as const },
  { id: '3', name: 'Bún/Phở', icon: 'noodles' as const },
  { id: '4', name: 'Ăn vặt', icon: 'food' as const },
];

export const RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Chicken King - Gà Rán & Mì Ý',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDd_H81L3mw1GheCCPkVqQQnzj-mX84kS7sRnwuug1G7dZetaT9i3I7FpseAebs3EcM6pa9AUsqdyymll_OjBTndYMChL2zi1CMQU5e8InKLCvjCmIftmNYKJo_GAkKB9ux1eFqwQoOE3M0Cv1zlYlh2S3E-xQatuB5YVsKw1fM4kvbugGhOOQl6HihxU1dZQWm9gZaOjPI1T3fPbFqacGSZZO2Pus1isCnRIgX7lY8DVadj_orn4s',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDd_H81L3mw1GheCCPkVqQQnzj-mX84kS7sRnwuug1G7dZetaT9i3I7FpseAebs3EcM6pa9AUsqdyymll_OjBTndYMChL2zi1CMQU5e8InKLCvjCmIftmNYKJo_GAkKB9ux1eFqwQoOE3M0Cv1zlYlh2S3E-xQatuB5YVsKw1fM4kvbugGhOOQl6HihxU1dZQWm9gZaOjPI1T3fPbFqacGSZZO2Pus1isCnRIgX7lY8DVadj_orn4s',
    rating: 4.8,
    reviewCount: '1k+',
    deliveryTime: '25-30 phút',
    distance: '1.2 km',
    tags: ['Gà rán', 'Mì Ý', 'Thức ăn nhanh'],
    priceLevel: '$$',
    cuisine: 'Gà rán, Mì Ý, Thức ăn nhanh',
    freeship: true,
    menu: [],
  },
  {
    id: '2',
    name: 'Bún Bò Huế Cô Ba',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA3SDt7ick9-gwc3XFZUhi_NNOVj5Al3coZSFN4n7mmqlxg_1buMDAu2AQqvZZuR-rbkusP5wACg5iC1ljIzG-uL6C3A-51pjueqDNVm9LmkG9fWCkF9UeLNTmfiEdTHScRXAuuKcSb6b6SX9cV82z7e0UNCawHWrGhsHBzkUCmK3dSXQfOzf0pIIqKE5G6VdEwwtdm-8ATOUY1nj-jcUhyUu8_2msMVBUm0HfxnoqL5DfTZVTalE4',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA3SDt7ick9-gwc3XFZUhi_NNOVj5Al3coZSFN4n7mmqlxg_1buMDAu2AQqvZZuR-rbkusP5wACg5iC1ljIzG-uL6C3A-51pjueqDNVm9LmkG9fWCkF9UeLNTmfiEdTHScRXAuuKcSb6b6SX9cV82z7e0UNCawHWrGhsHBzkUCmK3dSXQfOzf0pIIqKE5G6VdEwwtdm-8ATOUY1nj-jcUhyUu8_2msMVBUm0HfxnoqL5DfTZVTalE4',
    rating: 4.5,
    reviewCount: '800+',
    deliveryTime: '15-20 phút',
    distance: '0.8 km',
    tags: ['Món nước', 'Đặc sản Huế'],
    priceLevel: '$',
    cuisine: 'Món nước, Đặc sản Huế',
    menu: [],
  },
  {
    id: '3',
    name: 'Bếp Việt Delights - Quận 1',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDdoG0rhEdvGoEMp5V7fpXjUapnL9hX5zi5cIOA0QBbcQXSjJLFBIj6FmTwGO3Jv_7GoouqAiQBPF6EMIXXIH4w3k6_tRD5rkCOjq6B0cyQvZ2v_ZnxR2RZD4vzmnPbCXjgMMnapEHKHsoXcyHY7PY05GMr1ZG8bvpvwX0GFHCOxtmTxnsK9tzSwGz0oFhffQTm4xlXeXcQrB16_T2IrpQBTlOjQMBHdbzhIF5w-8IIhtM4X7oS39k',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDdoG0rhEdvGoEMp5V7fpXjUapnL9hX5zi5cIOA0QBbcQXSjJLFBIj6FmTwGO3Jv_7GoouqAiQBPF6EMIXXIH4w3k6_tRD5rkCOjq6B0cyQvZ2v_ZnxR2RZD4vzmnPbCXjgMMnapEHKHsoXcyHY7PY05GMr1ZG8bvpvwX0GFHCOxtmTxnsK9tzSwGz0oFhffQTm4xlXeXcQrB16_T2IrpQBTlOjQMBHdbzhIF5w-8IIhtM4X7oS39k',
    rating: 4.8,
    reviewCount: '1k+',
    deliveryTime: "25'",
    distance: '1.2km',
    tags: ['Việt Nam', 'Phổ biến'],
    priceLevel: '$$',
    cuisine: 'Ẩm thực Việt Nam',
    popular: true,
    menu: [
      {
        id: 'm1',
        name: 'Phở Bò Đặc Biệt',
        price: 65000,
        description: 'Nước dùng hầm xương 12 tiếng, thịt bò bắp hoa tươi ngon kèm quẩy giòn rụm.',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuD34uAYy_hpFBjtKvE-kxk8-DF9pzJoEk3laZsQhTCcxWutHvCvkiHEvqEPkE38a_IHxRw6IggJKdZ3IJUheHqfzCEwMM6ncMprzRTZF1yX4JCdXrfRCFyPwBIH2015xK2oJOKJS6Bby6kBUee1rfWmGhp95o9jFL4MEEtZt0q1B2xurt3sbPzJ7UPQBlmK1SZVY3wsEsKFtRNvL3D4ObvHq6BnMPJS1_Y2UDjdMo0xLivRqKWNIoY',
        category: 'featured',
        layout: 'card',
      },
      {
        id: 'm2',
        name: 'Bún Chả Hà Nội',
        price: 55000,
        description: 'Chả nướng than hoa thơm lừng, nước chấm chua ngọt chuẩn vị phố cổ.',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAwDIF-2y0Ba4C3y5-9yVYr-VDE9GFLcxn-hQVoxgpS2XP-gnuQ0Hm37Ur30ZRotVJPiQ0DKjmssQD2Kot7bC0T3YkHmV7kBUhnsmEBfgzjY7bNbOR-x56VH8XHehqM4GPbCLzPIK-zO4LD1yZdBrEs4-6eOMvwrdXGBIuW3bKqwQDtoMd3yG4u7yXTg7LMTAn-LtK0PQ4p1TX0nqR6bjdto6--QSiBuJgnFov2nCy-vkTOlmlUymk',
        category: 'featured',
        layout: 'card',
      },
      {
        id: 'm3',
        name: 'Cơm Tấm Sườn Bì Chả',
        price: 45000,
        description: 'Sườn nướng mật ong, bì thính, chả trứng.',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBUBva5zlOig1rImU_CrmGW4xAirr-3_aa11fEnx9qAe-LMYCVDtYoheyHiYdRK2w_n3CJqup_4rQ_K-MU1fnQzsp5u4jltzXtXm1hy9Pgz8yI-vhZ7iVhRUAYiH1kjyE1E1IqU_Q2PDZ7VYiSw5PfyYXRUbZ3JW5Ordmu4JEcAFVY3RrRvcZmZtDJWO-m4LGeVxnwiijB0H3q8wzO8-9sYiR_173Uo0ni9FF0L1GQ_93wSt7_hsDg',
        category: 'mains',
        layout: 'list',
      },
      {
        id: 'm4',
        name: 'Bún Bò Huế',
        price: 60000,
        description: 'Nước dùng cay nồng, bắp bò, giò heo, chả cua.',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBvIjOTQ1rixrlSMG3Ywh4qtudksLjOVZTvSR4bwKrfPh3-1Ji8rJt5onlw5BtNp0eaVpr78PRjoLFyllMYhadcahCPx0AKB3z_vKY3tDTRtvXEUiWEAKn92fjBb9dpKiof_mjK-HhVlZZDaA7FzQFqlkYI0TOWGpxlJaSsVD6YIOo0VMKHmPwx4nd1hJINDshCR8Gug3aFqSQ96z3ORIHVa3pesXdv5lv9UIAa273MwlvCCGGsdrY',
        category: 'mains',
        layout: 'list',
      },
      {
        id: 'm5',
        name: 'Cà Phê Sữa Đá',
        price: 25000,
        description: 'Cà phê robusta rang xay pha sữa đặc.',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBmPg1agCJ-5H0G9lWY7SdiajYr1K5kWMkKWu3Z8i6RJnk1Lfr6nx0eR71M1oL-mzH7CI9y05YMr-uOoDQG8wJbGXIyYxIgx4lIKSya1hMTjeOsRohjleS7zMa8wvYsTY7fLTf13rV2NIIbEsm6Jg0Xxjc1B9zgBQhafSDnqBwWm6lwMupuaYmm7C6SF_QerIICRUHPDh7SEJylVEuAW2KYGg9kcm2ZxVMk9TzL5LlH6ZcJzS-H7sg',
        category: 'drinks',
        layout: 'grid',
      },
      {
        id: 'm6',
        name: 'Trà Đào Cam Sả',
        price: 35000,
        description: 'Trà đào cam sả mát lạnh.',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuALiopSyqHxqpY2LigMVFTU9yncxl0mHQX8s5IPfhhrUw_pomHu46GTZr4SfC7v-DnDXI8zSHp75m-4McfhB-lSMt3SphjtWpQcHOaUZ0M2C3e9oV-_GUTz_wW1nOc1O6HOoEmUryhFnH4kPZLiXSO2h7GRRM1WFolF_vjTuinKV4q6b7E6IAhc-6-SD1I6_d8shD8cxVHDfvmwjP_HTUABXcKdQgAajA0zxjtkUEaHQxPDu5HuDfw',
        category: 'drinks',
        layout: 'grid',
      },
    ],
  },
];

export const PROMO_BANNER = {
  tag: 'ƯU ĐÃI KHỦNG',
  title: 'Giảm ngay 50%',
  subtitle: 'Cho đơn đầu tiên',
  image:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBqSxov4nwtF8PjMmhMRxltEHN2V5VWNMLuwaTBhlNbwdzJgDeTL1d0F7ntTOm1aMBTM9khYkavgKdXnry-l2QLO9BmgKQhvZozTsaAbpdJNExSHYD7J20tnXaM-7ZOazDOf-uijq_QgRDjcwcGHhvNvAbYSFXGCp7tkUK9Pa2Np--Knc3Q1ndWm1B77J3TuLasxzm-sRpnIiPLtVNlTo3uO046A62sySlBWxhvX1GdjV3ZKvYAps8',
};

export const MENU_CATEGORIES = [
  { id: 'featured', label: 'Món nổi bật' },
  { id: 'mains', label: 'Món chính' },
  { id: 'drinks', label: 'Đồ uống' },
  { id: 'desserts', label: 'Tráng miệng' },
];

export function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + 'đ';
}

export function getRestaurantById(id: string): Restaurant | undefined {
  return RESTAURANTS.find((r) => r.id === id);
}
