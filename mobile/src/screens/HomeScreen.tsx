import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ImageBackground, ActivityIndicator, Dimensions } from 'react-native';
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
import { styles } from '../styles/screens/HomeScreen.styles';

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
  const { location, ready: locationReady } = useDeliveryLocation();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banners, setBanners] = useState<ApiBanner[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [categories, setCategories] = useState<
    { id: string; name: string; icon: string; slug: string }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('near');
  const [freeShipOnly, setFreeShipOnly] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const addressLabel =
    location?.fullAddress || location?.label || 'Chọn địa chỉ giao hàng';

  useEffect(() => {
    if (!locationReady) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await homeApi.get(location?.lat, location?.lng);
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
  }, [locationReady, location?.lat, location?.lng]);

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
      list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
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
                { key: 'near', label: 'Gần tôi' },
                { key: 'popular', label: 'Phổ biến' },
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

