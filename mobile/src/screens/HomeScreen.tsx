import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ImageBackground, Image, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Restaurant } from '../data/restaurants';
import { formatPrice } from '../api/format';
import { homeApi, restaurantApi } from '../api';
import { mapCategory, mapRestaurant } from '../api/mappers';
import type { ApiBanner } from '../api/types';
import { TopAppBar } from '../components/TopAppBar';
import { RestaurantCard } from '../components/RestaurantCard';
import { useCart } from '../context/CartContext';
import { useDeliveryLocation } from '../context/DeliveryLocationContext';
import { styles } from '../styles/screens/HomeScreen.styles';

const CATEGORY_EMOJIS: Record<string, string> = {
  rice: '🍚',
  cup: '🧋',
  noodles: '🍜',
  food: '🍽️',
  bread: '🥖',
  pizza: '🍕',
  fish: '🍣',
  drumstick: '🍗',
  coffee: '☕',
  hotpot: '🍲',
};

const VISIBLE_CATEGORY_COUNT = 4;

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
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [sort, setSort] = useState<SortKey>('near');
  const [freeShipOnly, setFreeShipOnly] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchResults, setSearchResults] = useState<{
    restaurants: Restaurant[];
    dishes: { id: string; name: string; price: number; image: string; restaurant: Restaurant }[];
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

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

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await restaurantApi.search(q, location?.lat, location?.lng);
        if (cancelled) return;
        setSearchResults({
          restaurants: res.restaurants.map((r) => mapRestaurant(r)),
          dishes: res.dishes.map((d) => ({
            id: d._id,
            name: d.name,
            price: d.price,
            image: d.image,
            restaurant: mapRestaurant(d.restaurant),
          })),
        });
      } catch {
        if (!cancelled) setSearchResults({ restaurants: [], dishes: [] });
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, location?.lat, location?.lng]);

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

          {!searchResults && banners.length > 0 && (
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
          {!searchResults && banners.length > 1 && (
            <View style={styles.dots}>
              {banners.map((b, i) => (
                <View
                  key={b._id}
                  style={[styles.dot, i === bannerIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {!searchResults && (
          <>
          <View style={styles.categoriesSection}>
            <View style={styles.categoriesHeader}>
              <Text style={styles.categoriesTitle}>Danh mục</Text>
              {categories.length > VISIBLE_CATEGORY_COUNT && (
                <TouchableOpacity
                  style={styles.seeAllButton}
                  onPress={() => setShowAllCategories((v) => !v)}
                >
                  <Text style={styles.seeAllText}>
                    {showAllCategories ? 'Thu gọn' : 'Xem tất cả'}
                  </Text>
                  <MaterialIcons
                    name={showAllCategories ? 'chevron-left' : 'chevron-right'}
                    size={16}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.categoryGrid}>
              {(showAllCategories
                ? categories
                : categories.slice(0, VISIBLE_CATEGORY_COUNT)
              ).map((cat) => {
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
                      <Text style={styles.categoryEmoji}>
                        {CATEGORY_EMOJIS[cat.icon] || '🍽️'}
                      </Text>
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
                { key: 'popular', label: 'Bán chạy' },
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
          </>
          )}

          {searchResults ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Kết quả cho "{search.trim()}"
                </Text>
              </View>
              {searchLoading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : searchResults.restaurants.length === 0 &&
                searchResults.dishes.length === 0 ? (
                <Text style={styles.emptyText}>
                  Không tìm thấy quán hoặc món phù hợp
                </Text>
              ) : (
                <>
                  {searchResults.restaurants.length > 0 && (
                    <View style={styles.restaurantList}>
                      {searchResults.restaurants.map((restaurant) => (
                        <RestaurantCard
                          key={restaurant.id}
                          restaurant={restaurant}
                          onPress={onRestaurantPress}
                        />
                      ))}
                    </View>
                  )}
                  {searchResults.dishes.length > 0 && (
                    <View style={styles.dishResults}>
                      <Text style={styles.dishResultsTitle}>Món ăn phù hợp</Text>
                      {searchResults.dishes.map((dish) => (
                        <TouchableOpacity
                          key={dish.id}
                          style={styles.dishResultRow}
                          activeOpacity={0.85}
                          onPress={() => onRestaurantPress(dish.restaurant)}
                        >
                          <Image
                            source={{ uri: dish.image }}
                            style={styles.dishResultImage}
                          />
                          <View style={styles.dishResultInfo}>
                            <Text style={styles.dishResultName} numberOfLines={1}>
                              {dish.name}
                            </Text>
                            <Text
                              style={styles.dishResultRestaurant}
                              numberOfLines={1}
                            >
                              {dish.restaurant.name}
                            </Text>
                          </View>
                          <Text style={styles.dishResultPrice}>
                            {formatPrice(dish.price)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          ) : (
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
          )}
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

