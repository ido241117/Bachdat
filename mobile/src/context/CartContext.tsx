import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { MenuItem } from '../data/restaurants';

export type CartLine = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  options: string[];
  note: string;
  image: string;
};

type CartContextValue = {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  wouldSwitchRestaurant: (nextRestaurantId: string) => boolean;
  addItem: (restaurantId: string, restaurantName: string, item: MenuItem) => void;
  updateQty: (menuItemId: string, delta: number) => void;
  removeItem: (menuItemId: string) => void;
  replaceCart: (
    restaurantId: string,
    restaurantName: string,
    lines: CartLine[],
  ) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [items, setItems] = useState<CartLine[]>([]);

  const clear = useCallback(() => {
    setRestaurantId(null);
    setRestaurantName(null);
    setItems([]);
  }, []);

  const wouldSwitchRestaurant = useCallback(
    (nextRestaurantId: string) =>
      restaurantId != null &&
      restaurantId !== nextRestaurantId &&
      items.length > 0,
    [restaurantId, items.length],
  );

  const replaceCart = useCallback(
    (
      nextRestaurantId: string,
      nextRestaurantName: string,
      lines: CartLine[],
    ) => {
      setRestaurantId(nextRestaurantId);
      setRestaurantName(nextRestaurantName);
      setItems(lines);
    },
    [],
  );

  const addItem = useCallback(
    (nextRestaurantId: string, nextRestaurantName: string, item: MenuItem) => {
      setItems((prev) => {
        const switching =
          restaurantId != null && restaurantId !== nextRestaurantId;
        const base = switching ? [] : prev;

        if (switching || restaurantId == null) {
          setRestaurantId(nextRestaurantId);
          setRestaurantName(nextRestaurantName);
        }

        const existing = base.find((l) => l.menuItemId === item.id);
        if (existing) {
          return base.map((l) =>
            l.menuItemId === item.id
              ? { ...l, quantity: l.quantity + 1 }
              : l,
          );
        }

        return [
          ...base,
          {
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            options: [],
            note: '',
            image: item.image,
          },
        ];
      });
    },
    [restaurantId],
  );

  const updateQty = useCallback((menuItemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((l) =>
          l.menuItemId === menuItemId
            ? { ...l, quantity: Math.max(0, l.quantity + delta) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => prev.filter((l) => l.menuItemId !== menuItemId));
  }, []);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const value = useMemo(
    () => ({
      restaurantId,
      restaurantName,
      items,
      itemCount,
      subtotal,
      wouldSwitchRestaurant,
      addItem,
      updateQty,
      removeItem,
      replaceCart,
      clear,
    }),
    [
      restaurantId,
      restaurantName,
      items,
      itemCount,
      subtotal,
      wouldSwitchRestaurant,
      addItem,
      updateQty,
      removeItem,
      replaceCart,
      clear,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
