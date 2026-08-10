import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Restaurant } from '../data/restaurants';
import { formatPrice } from '../api/format';
import { homeApi } from '../api';
import { mapCategory, mapRestaurant } from '../api/mappers';
import type { ApiBanner } from '../api/types';
import { TopAppBar } from '../components/TopAppBar';
import { RestaurantCard } from '../components/RestaurantCard';
import { useCart } from '../context/CartContext';
import { useDeliveryLocation } from '../context/DeliveryLocationContext';

const CATEGORY_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  rice: 'rice',
  cup: 'cup',
  noodles: 'noodles',
  food: 'food',
  bread: 'bread-slice',
  pizza: 'pizza',
  fish: 'fish',
  drumstick: 'food-drumstick',
  coffee: 'coffee',
};

type SortKey = 'popular' | 'near' | 'rating';

interface Props {
  onRestaurantPress: (restaurant: Restaurant) => void;
  onCheckoutPress: () => void;
  onAddressPress?: () => void;
  onNeedLogin?: () => void;
}

export function HomeScreen({
  onRestaurantPress,
  onCheckoutPress,
  onAddressPress,
}: Props) {
  const { itemCount, subtotal } = useCart();
  const { location } = useDeliveryLocation();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banners, setBanners] = useState<ApiBanner[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [categories, setCategories] = useState<
    { id: string; name: string; icon: string; slug: string }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('popular');
  const [freeShipOnly, setFreeShipOnly] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const addressLabel =
    location?.fullAddress || location?.label || 'Chọn địa chỉ giao hàng';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await homeApi.get();
        if (cancelled) return;
        setBanners(data.banners);
        setCategories(data.categories.map(mapCategory));
        setRestaurants(data.restaurants.map((r) => mapRestaurant(r)));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không tải được trang chủ');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...restaurants];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q),
      );
    }
    if (selectedCategory) {
      const cat = categories.find((c) => c.id === selectedCategory);
      if (cat) {
        list = list.filter((r) =>
          r.tags.some(
            (t) =>
              t.toLowerCase().includes(cat.name.toLowerCase()) ||
              t.toLowerCase().includes(cat.slug.toLowerCase()),
          ),
        );
      }
    }
    if (freeShipOnly) list = list.filter((r) => r.freeship);
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sort === 'near') {
      list.sort(
        (a, b) =>
          parseFloat(a.distance) - parseFloat(b.distance) || 0,
      );
    }
    if (sort === 'popular') {
      list.sort((a, b) => Number(!!b.popular) - Number(!!a.popular));
    }
    return list;
  }, [restaurants, search, selectedCategory, categories, freeShipOnly, sort]);

  const onBannerPress = (banner: ApiBanner) => {
    if (banner.linkType === 'restaurant' && banner.linkId) {
      const r = restaurants.find((x) => x.id === banner.linkId);
      if (r) onRestaurantPress(r);
    }
  };

  return (
    <View style={styles.container}>
      <TopAppBar
        variant="orange"
        addressLabel={addressLabel}
        onAddressPress={onAddressPress}
        onBellPress={() => {}}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bodyContent}
        >
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color={Colors.secondary} />
              <TextInput
                placeholder="Thèm món gì, Mealnow có món đó..."
                placeholderTextColor={Colors.textLight}
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {banners.length > 0 && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.bannerScroll}
              onMomentumScrollEnd={(e) => {
                const w = Dimensions.get('window').width - 32;
                setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / w));
              }}
            >
              {banners.map((banner) => (
                <TouchableOpacity
                  key={banner._id}
                  activeOpacity={0.95}
                  onPress={() => onBannerPress(banner)}
                  style={styles.bannerSlide}
                >
                  <ImageBackground
                    source={{ uri: banner.image }}
                    style={styles.banner}
                    imageStyle={styles.bannerImage}
                  >
                    <View style={styles.bannerOverlay}>
                      {banner.tag ? (
                        <View style={styles.bannerTag}>
                          <Text style={styles.bannerTagText}>{banner.tag}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.bannerTitle}>
                        {banner.title}
                        {banner.subtitle ? `\n${banner.subtitle}` : ''}
                      </Text>
                      <View style={styles.bannerBtn}>
                        <Text style={styles.bannerBtnText}>Đặt Ngay</Text>
                      </View>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {banners.length > 1 && (
            <View style={styles.dots}>
              {banners.map((b, i) => (
                <View
                  key={b._id}
                  style={[styles.dot, i === bannerIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          <View style={styles.categoriesSection}>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryItem}
                    onPress={() =>
                      setSelectedCategory((prev) =>
                        prev === cat.id ? null : cat.id,
                      )
                    }
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        active && styles.categoryIconActive,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={CATEGORY_ICONS[cat.icon] || 'food'}
                        size={28}
                        color={active ? Colors.white : Colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryLabel,
                        active && styles.categoryLabelActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {(
              [
                { key: 'popular', label: 'Phổ biến' },
                { key: 'near', label: 'Gần nhất' },
                { key: 'rating', label: 'Đánh giá' },
              ] as const
            ).map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.chip, sort === opt.key && styles.chipActive]}
                onPress={() => setSort(opt.key)}
              >
                <Text
                  style={[
                    styles.chipText,
                    sort === opt.key && styles.chipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.chip, freeShipOnly && styles.chipActive]}
              onPress={() => setFreeShipOnly((v) => !v)}
            >
              <Text
                style={[styles.chipText, freeShipOnly && styles.chipTextActive]}
              >
                Ship 0đ
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
            </View>
            <View style={styles.restaurantList}>
              {filtered.length === 0 ? (
                <Text style={styles.emptyText}>Không tìm thấy quán phù hợp</Text>
              ) : (
                filtered.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onPress={onRestaurantPress}
                  />
                ))
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={onCheckoutPress}
          activeOpacity={0.9}
        >
          <View style={styles.cartLeft}>
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{itemCount}</Text>
            </View>
            <Text style={styles.cartLabel}>Xem giỏ hàng</Text>
          </View>
          <Text style={styles.cartTotal}>{formatPrice(subtotal)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: { color: Colors.primary, textAlign: 'center' },
  body: { flex: 1 },
  bodyContent: { paddingBottom: 100 },
  searchSection: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.onSurface },
  bannerScroll: { marginBottom: 8 },
  bannerSlide: { width: Dimensions.get('window').width - 32, marginHorizontal: 16 },
  banner: { height: 160, borderRadius: 16, overflow: 'hidden' },
  bannerImage: { borderRadius: 16 },
  bannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  bannerTag: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  bannerTagText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  bannerTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
  },
  bannerBtn: {
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  bannerBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.outlineVariant,
  },
  dotActive: { backgroundColor: Colors.primary, width: 16 },
  categoriesSection: { paddingHorizontal: 16, marginBottom: 12 },
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: { alignItems: 'center', gap: 4 },
  categoryIcon: {
    width: 56,
    height: 56,
    backgroundColor: Colors.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconActive: { backgroundColor: Colors.primary },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  categoryLabelActive: { color: Colors.primary },
  chipsRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  chipActive: {
    backgroundColor: Colors.primaryFixed,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 13, color: Colors.onSurfaceVariant, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  section: { paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
  restaurantList: { gap: 14 },
  emptyText: { color: Colors.secondary, textAlign: 'center', padding: 24 },
  cartBar: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: { color: Colors.white, fontWeight: '700' },
  cartLabel: { color: Colors.white, fontWeight: '600' },
  cartTotal: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
