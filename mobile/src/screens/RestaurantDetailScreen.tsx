import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Restaurant, MenuItem, MENU_CATEGORIES } from '../data/restaurants';
import { formatPrice } from '../api/format';
import { restaurantApi } from '../api';
import { mapMenuItem } from '../api/mappers';
import { useCart } from '../context/CartContext';

interface Props {
  restaurant: Restaurant;
  onBack: () => void;
  onCheckoutPress: () => void;
}

export function RestaurantDetailScreen({
  restaurant,
  onBack,
  onCheckoutPress,
}: Props) {
  const {
    addItem,
    updateQty,
    items,
    itemCount,
    subtotal,
    wouldSwitchRestaurant,
  } = useCart();
  const [activeCategory, setActiveCategory] = useState('featured');
  const [menu, setMenu] = useState<MenuItem[]>(restaurant.menu || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [sheetQty, setSheetQty] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await restaurantApi.getMenu(restaurant.id);
        if (cancelled) return;
        setMenu(data.items.map(mapMenuItem));
        const firstWithItems = MENU_CATEGORIES.find((c) =>
          data.items.some((i) => i.menuSection === c.id),
        );
        if (firstWithItems) setActiveCategory(firstWithItems.id);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không tải được menu');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurant.id]);

  const visibleCats = useMemo(
    () =>
      MENU_CATEGORIES.filter((c) => menu.some((m) => m.category === c.id)),
    [menu],
  );

  const filteredMenu = useMemo(() => {
    let list = menu.filter((m) => m.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = menu.filter((m) => m.name.toLowerCase().includes(q));
    }
    return list;
  }, [menu, activeCategory, search]);

  const qtyInCart = (id: string) =>
    items.find((i) => i.menuItemId === id)?.quantity || 0;

  const doAdd = (item: MenuItem, qty = 1) => {
    for (let i = 0; i < qty; i++) {
      addItem(restaurant.id, restaurant.name, item);
    }
  };

  const handleAdd = (item: MenuItem, qty = 1) => {
    if (wouldSwitchRestaurant(restaurant.id)) {
      Alert.alert(
        'Đổi nhà hàng?',
        'Giỏ hàng hiện tại sẽ bị xóa nếu bạn thêm món từ quán khác.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa giỏ & thêm',
            style: 'destructive',
            onPress: () => doAdd(item, qty),
          },
        ],
      );
      return;
    }
    doAdd(item, qty);
  };

  const openSheet = (item: MenuItem) => {
    setSelected(item);
    setSheetQty(Math.max(1, qtyInCart(item.id) || 1));
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroWrap}>
        <ImageBackground source={{ uri: restaurant.heroImage }} style={styles.hero}>
          <View style={styles.heroGradient} />
          <SafeAreaView edges={['top']} style={styles.heroHeader}>
            <TouchableOpacity style={styles.heroBtn} onPress={onBack}>
              <MaterialIcons name="arrow-back" size={22} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroBtn} onPress={onCheckoutPress}>
              <MaterialIcons name="shopping-cart" size={22} color={Colors.white} />
              {itemCount > 0 && (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.heroContent}>
            {restaurant.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>PHỔ BIẾN</Text>
              </View>
            )}
            <Text style={styles.heroTitle}>{restaurant.name}</Text>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <View style={styles.statValue}>
            <MaterialIcons name="star" size={16} color={Colors.yellow} />
            <Text style={styles.statNumber}>{restaurant.rating}</Text>
          </View>
          <Text style={styles.statLabel}>{restaurant.reviewCount}</Text>
        </View>
        <View style={[styles.statItem, styles.statBorder]}>
          <Text style={styles.statNumber}>{restaurant.deliveryTime}</Text>
          <Text style={styles.statLabel}>Giao hàng</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{restaurant.distance}</Text>
          <Text style={styles.statLabel}>Khoảng cách</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={18} color={Colors.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm món trong quán"
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryNav}
      >
        {visibleCats.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              activeCategory === cat.id && !search && styles.categoryChipActive,
            ]}
            onPress={() => {
              setSearch('');
              setActiveCategory(cat.id);
            }}
          >
            <Text
              style={[
                styles.categoryChipText,
                activeCategory === cat.id &&
                  !search &&
                  styles.categoryChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.menuLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.menuLoading}>
          <Text style={styles.menuError}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.menuList}
          showsVerticalScrollIndicator={false}
        >
          {filteredMenu.map((item) => {
            const qty = qtyInCart(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.listItem}
                onPress={() => openSheet(item)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: item.image }} style={styles.listImage} />
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>{item.name}</Text>
                  <Text style={styles.listDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={styles.listPrice}>{formatPrice(item.price)}</Text>
                </View>
                <View style={styles.qtyCol}>
                  {qty > 0 ? (
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateQty(item.id, -1)}
                      >
                        <MaterialIcons name="remove" size={16} color={Colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.stepVal}>{qty}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleAdd(item)}
                      >
                        <MaterialIcons name="add" size={16} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addCircle}
                      onPress={() => handleAdd(item)}
                    >
                      <MaterialIcons name="add" size={20} color={Colors.white} />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={onCheckoutPress}
          activeOpacity={0.9}
        >
          <Text style={styles.cartLabel}>{itemCount} món · Giỏ hàng</Text>
          <Text style={styles.cartTotal}>{formatPrice(subtotal)}</Text>
        </TouchableOpacity>
      )}

      <Modal visible={!!selected} transparent animationType="slide">
        <Pressable style={styles.modalBg} onPress={() => setSelected(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {selected && (
              <>
                <Image source={{ uri: selected.image }} style={styles.sheetImage} />
                <Text style={styles.sheetName}>{selected.name}</Text>
                <Text style={styles.sheetDesc}>{selected.description}</Text>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetPrice}>
                    {formatPrice(selected.price * sheetQty)}
                  </Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setSheetQty((q) => Math.max(1, q - 1))}
                    >
                      <MaterialIcons name="remove" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.stepVal}>{sheetQty}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setSheetQty((q) => q + 1)}
                    >
                      <MaterialIcons name="add" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.sheetBtn}
                  onPress={() => {
                    handleAdd(selected, sheetQty);
                    setSelected(null);
                  }}
                >
                  <Text style={styles.sheetBtnText}>Thêm vào giỏ</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heroWrap: { height: 200 },
  hero: { flex: 1 },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  heroContent: { position: 'absolute', left: 16, bottom: 16, right: 16 },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  popularText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  heroTitle: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  statsCard: {
    marginTop: -16,
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 14,
    flexDirection: 'row',
    paddingVertical: 12,
    zIndex: 2,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  statValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  statLabel: { fontSize: 11, color: Colors.secondary },
  searchWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.white,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.onSurface },
  categoryNav: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.white,
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: Colors.primary },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  categoryChipTextActive: { color: Colors.white },
  menuLoading: { padding: 40, alignItems: 'center' },
  menuError: { color: Colors.primary },
  menuList: { padding: 16, paddingBottom: 120, gap: 10 },
  listItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 10,
    gap: 10,
    alignItems: 'center',
  },
  listImage: { width: 72, height: 72, borderRadius: 10 },
  listInfo: { flex: 1, gap: 3 },
  listName: { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  listDesc: { fontSize: 12, color: Colors.secondary },
  listPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  qtyCol: { alignItems: 'center' },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: { minWidth: 16, textAlign: 'center', fontWeight: '700' },
  cartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartLabel: { color: Colors.white, fontWeight: '600' },
  cartTotal: { color: Colors.white, fontWeight: '700' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sheetImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  sheetName: { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
  sheetDesc: { fontSize: 13, color: Colors.secondary, marginTop: 6 },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  sheetPrice: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  sheetBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
