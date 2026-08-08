import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import {
  Restaurant,
  MenuItem,
  MENU_CATEGORIES,
} from '../data/restaurants';
import { formatPrice } from '../api/format';
import { restaurantApi } from '../api';
import { mapMenuItem } from '../api/mappers';
import { useCart } from '../context/CartContext';

interface Props {
  restaurant: Restaurant;
  onBack: () => void;
  onCheckoutPress: () => void;
}

export function RestaurantDetailScreen({ restaurant, onBack, onCheckoutPress }: Props) {
  const { addItem, itemCount, subtotal } = useCart();
  const [activeCategory, setActiveCategory] = useState('featured');
  const [menu, setMenu] = useState<MenuItem[]>(restaurant.menu || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await restaurantApi.getMenu(restaurant.id);
        if (cancelled) return;
        setMenu(data.items.map(mapMenuItem));
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

  const addToCart = (item: MenuItem) => {
    addItem(restaurant.id, restaurant.name, item);
  };

  const featured = menu.filter((m) => m.category === 'featured');
  const mains = menu.filter((m) => m.category === 'mains');
  const drinks = menu.filter((m) => m.category === 'drinks');
  const desserts = menu.filter((m) => m.category === 'desserts');

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.brand}>Mealnow</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="favorite-border" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="share" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroWrap}>
          <ImageBackground source={{ uri: restaurant.heroImage }} style={styles.hero}>
            <View style={styles.heroGradient} />
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
              <MaterialIcons name="star" size={18} color={Colors.yellow} />
              <Text style={styles.statNumber}>{restaurant.rating}</Text>
            </View>
            <Text style={styles.statLabel}>{restaurant.reviewCount} Đánh giá</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <View style={styles.statValue}>
              <MaterialIcons name="schedule" size={18} color={Colors.primary} />
              <Text style={styles.statNumber}>{restaurant.deliveryTime}</Text>
            </View>
            <Text style={styles.statLabel}>Phút giao hàng</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statValue}>
              <MaterialIcons name="location-on" size={18} color={Colors.primary} />
              <Text style={styles.statNumber}>{restaurant.distance}</Text>
            </View>
            <Text style={styles.statLabel}>Khoảng cách</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryNav}
          contentContainerStyle={styles.categoryNavContent}
        >
          {MENU_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                activeCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  activeCategory === cat.id && styles.categoryChipTextActive,
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
        <View style={styles.menuSections}>
          {featured.length > 0 && (
            <View style={styles.menuSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Món nổi bật</Text>
                <Text style={styles.sectionBadge}>Bán chạy nhất</Text>
              </View>
              {featured.map((item) => (
                <View key={item.id} style={styles.featuredCard}>
                  <Image source={{ uri: item.image }} style={styles.featuredImage} />
                  <View style={styles.featuredInfo}>
                    <View style={styles.featuredTitleRow}>
                      <Text style={styles.featuredName}>{item.name}</Text>
                      <Text style={styles.featuredPrice}>{formatPrice(item.price)}</Text>
                    </View>
                    <Text style={styles.featuredDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <TouchableOpacity
                      style={styles.addBtnFull}
                      onPress={() => addToCart(item)}
                    >
                      <MaterialIcons name="add" size={20} color={Colors.white} />
                      <Text style={styles.addBtnText}>Thêm vào giỏ</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {mains.length > 0 && (
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Món chính</Text>
              {mains.map((item) => (
                <View key={item.id} style={styles.listItem}>
                  <Image source={{ uri: item.image }} style={styles.listImage} />
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>{item.name}</Text>
                    <Text style={styles.listDesc} numberOfLines={1}>
                      {item.description}
                    </Text>
                    <Text style={styles.listPrice}>{formatPrice(item.price)}</Text>
                  </View>
                  <TouchableOpacity style={styles.addBtnRound} onPress={() => addToCart(item)}>
                    <MaterialIcons name="add" size={22} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {drinks.length > 0 && (
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Đồ uống</Text>
              <View style={styles.drinksGrid}>
                {drinks.map((item) => (
                  <View key={item.id} style={styles.drinkCard}>
                    <Image source={{ uri: item.image }} style={styles.drinkImage} />
                    <Text style={styles.drinkName}>{item.name}</Text>
                    <Text style={styles.drinkPrice}>{formatPrice(item.price)}</Text>
                    <TouchableOpacity style={styles.drinkAddBtn} onPress={() => addToCart(item)}>
                      <Text style={styles.drinkAddText}>Thêm</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {desserts.length > 0 && (
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Tráng miệng</Text>
              <View style={styles.drinksGrid}>
                {desserts.map((item) => (
                  <View key={item.id} style={styles.drinkCard}>
                    <Image source={{ uri: item.image }} style={styles.drinkImage} />
                    <Text style={styles.drinkName}>{item.name}</Text>
                    <Text style={styles.drinkPrice}>{formatPrice(item.price)}</Text>
                    <TouchableOpacity style={styles.drinkAddBtn} onPress={() => addToCart(item)}>
                      <Text style={styles.drinkAddText}>Thêm</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
        )}
      </ScrollView>

      {itemCount > 0 && (
        <View style={styles.cartBarWrap}>
          <TouchableOpacity style={styles.cartBar} onPress={onCheckoutPress} activeOpacity={0.95}>
            <View style={styles.cartLeft}>
              <View style={styles.cartIconWrap}>
                <MaterialIcons name="shopping-cart" size={24} color={Colors.white} />
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.cartItems}>{itemCount} món đã chọn</Text>
                <Text style={styles.cartRestaurant}>{restaurant.name.split(' - ')[0]}</Text>
              </View>
            </View>
            <View style={styles.cartRight}>
              <Text style={styles.cartTotal}>{formatPrice(subtotal)}</Text>
              <MaterialIcons name="chevron-right" size={24} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 999,
  },
  brand: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  menuLoading: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuError: {
    color: Colors.primary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  heroWrap: {
    height: 240,
  },
  hero: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroContent: {
    padding: 16,
    zIndex: 1,
  },
  popularBadge: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 4,
  },
  popularText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: -32,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.surfaceVariant,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.secondary,
  },
  categoryNav: {
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  categoryNavContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  menuSections: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 32,
  },
  menuSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  featuredCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    marginBottom: 12,
  },
  featuredImage: {
    width: '100%',
    height: 160,
  },
  featuredInfo: {
    padding: 16,
  },
  featuredTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  featuredName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  featuredPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  featuredDesc: {
    fontSize: 12,
    color: Colors.secondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  addBtnFull: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    marginBottom: 8,
    gap: 12,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 2,
  },
  listDesc: {
    fontSize: 12,
    color: Colors.secondary,
    marginBottom: 4,
  },
  listPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  addBtnRound: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drinksGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  drinkCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    alignItems: 'center',
  },
  drinkImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 8,
  },
  drinkName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: 4,
  },
  drinkPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  drinkAddBtn: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerHighest,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  drinkAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  cartBarWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'transparent',
  },
  cartBar: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  cartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartIconWrap: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.white,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  cartItems: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  cartRestaurant: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  cartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cartTotal: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 18,
  },
});
