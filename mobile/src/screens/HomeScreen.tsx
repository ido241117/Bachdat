import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
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

const CATEGORY_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  rice: 'rice',
  cup: 'cup',
  noodles: 'noodles',
  food: 'food',
};

interface Props {
  onRestaurantPress: (restaurant: Restaurant) => void;
  onCheckoutPress: () => void;
}

export function HomeScreen({ onRestaurantPress, onCheckoutPress }: Props) {
  const { itemCount, subtotal } = useCart();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<ApiBanner | null>(null);
  const [categories, setCategories] = useState<
    { id: string; name: string; icon: string }[]
  >([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await homeApi.get();
        if (cancelled) return;
        setBanner(data.banners[0] ?? null);
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

  const filtered = restaurants.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <TopAppBar variant="location" onCartPress={onCheckoutPress} />

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
                placeholder="Thèm món gì, QuickBite có món đó..."
                placeholderTextColor={Colors.textLight}
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {banner && (
            <View style={styles.bannerSection}>
              <TouchableOpacity activeOpacity={0.95}>
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
                    <TouchableOpacity style={styles.bannerBtn}>
                      <Text style={styles.bannerBtnText}>Đặt Ngay</Text>
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.categoriesSection}>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.id} style={styles.categoryItem}>
                  <View style={styles.categoryIcon}>
                    <MaterialCommunityIcons
                      name={CATEGORY_ICONS[cat.icon] || 'food'}
                      size={28}
                      color={Colors.primary}
                    />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
              <TouchableOpacity>
                <Text style={styles.sectionLink}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.restaurantList}>
              {filtered.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onPress={onRestaurantPress}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {itemCount > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={onCheckoutPress} activeOpacity={0.9}>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: Colors.primary,
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 100,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
  },
  bannerSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  banner: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerImage: {
    borderRadius: 12,
  },
  bannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  bannerTag: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  bannerTagText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  bannerTitle: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 8,
  },
  bannerBtn: {
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  bannerBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  categoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
    gap: 4,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  restaurantList: {
    gap: 16,
  },
  cartBar: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  cartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  cartLabel: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  cartTotal: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
