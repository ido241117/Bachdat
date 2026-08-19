import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  TextInput,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Restaurant, MenuItem } from '../data/restaurants';
import { formatPrice, formatOrderDate } from '../api/format';
import { restaurantApi, reviewsApi } from '../api';
import { mapMenuItem } from '../api/mappers';
import type { ApiReview } from '../api/types';
import { useCart } from '../context/CartContext';
import { styles } from '../styles/screens/RestaurantDetailScreen.styles';

const KNOWN_SECTION_LABELS: Record<string, string> = {
  featured: 'Nổi bật',
  mains: 'Món chính',
  drinks: 'Đồ uống',
  desserts: 'Tráng miệng',
};

const KNOWN_SECTION_ORDER: Record<string, number> = {
  featured: -4,
  mains: -3,
  drinks: -2,
  desserts: -1,
};

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
  const [activeCategory, setActiveCategory] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>(restaurant.menu || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [sheetQty, setSheetQty] = useState(1);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPages, setReviewsPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});
  const lockSpy = useRef(false);
  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineW = useRef(new Animated.Value(0)).current;
  const [catPickerOpen, setCatPickerOpen] = useState(false);

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

  const loadReviews = async (page = 1) => {
    setReviewsLoading(true);
    try {
      const res = await reviewsApi.list(restaurant.id, page);
      setReviews((prev) => (page === 1 ? res.reviews : [...prev, ...res.reviews]));
      setReviewsTotal(res.total);
      setReviewsPage(res.page);
      setReviewsPages(res.pages);
    } catch {
      // ignore — không chặn trang chi tiết quán vì lỗi tải review
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(1);
  }, [restaurant.id]);

  const visibleCats = useMemo(() => {
    const minOrder = new Map<string, number>();
    menu.forEach((m) => {
      const so = m.sortOrder ?? 0;
      const cur = minOrder.get(m.category);
      if (cur === undefined || so < cur) minOrder.set(m.category, so);
    });
    return Array.from(minOrder.keys())
      .sort(
        (a, b) =>
          (KNOWN_SECTION_ORDER[a] ?? minOrder.get(a)!) -
          (KNOWN_SECTION_ORDER[b] ?? minOrder.get(b)!),
      )
      .map((id) => ({ id, label: KNOWN_SECTION_LABELS[id] || id }));
  }, [menu]);

  useEffect(() => {
    if (visibleCats.length === 0) return;
    if (!visibleCats.some((c) => c.id === activeCategory)) {
      setActiveCategory(visibleCats[0].id);
    }
  }, [visibleCats, activeCategory]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return menu.filter((m) => m.name.toLowerCase().includes(q));
  }, [menu, search]);

  const moveUnderline = (id: string, animated = true) => {
    const layout = tabLayouts.current[id];
    if (!layout) return;
    if (animated) {
      Animated.parallel([
        Animated.timing(underlineX, {
          toValue: layout.x,
          duration: 180,
          useNativeDriver: false,
        }),
        Animated.timing(underlineW, {
          toValue: layout.width,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      underlineX.setValue(layout.x);
      underlineW.setValue(layout.width);
    }
  };

  const scrollTabIntoView = (id: string) => {
    const layout = tabLayouts.current[id];
    if (layout) {
      tabScrollRef.current?.scrollTo({
        x: Math.max(0, layout.x - 24),
        animated: true,
      });
    }
    moveUnderline(id);
  };

  const jumpToCategory = (id: string) => {
    setSearch('');
    setActiveCategory(id);
    setCatPickerOpen(false);
    lockSpy.current = true;
    scrollTabIntoView(id);
    const y = sectionOffsets.current[id];
    if (y != null) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
    }
    setTimeout(() => {
      lockSpy.current = false;
    }, 420);
  };

  useEffect(() => {
    if (activeCategory) moveUnderline(activeCategory);
  }, [activeCategory]);

  const handleMenuScroll = (e: {
    nativeEvent: { contentOffset: { y: number } };
  }) => {
    if (search.trim() || lockSpy.current) return;
    const y = e.nativeEvent.contentOffset.y;
    let current: string | null = null;
    let bestOffset = -Infinity;
    for (const cat of visibleCats) {
      const off = sectionOffsets.current[cat.id];
      if (off != null && off - 80 <= y && off > bestOffset) {
        bestOffset = off;
        current = cat.id;
      }
    }
    if (current && current !== activeCategory) {
      setActiveCategory(current);
      scrollTabIntoView(current);
    }
  };

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

  const renderMenuItem = (item: MenuItem) => {
    const qty = qtyInCart(item.id);
    const hasDiscount = !!item.originalPrice && item.originalPrice > item.price;
    const discountPct = hasDiscount
      ? Math.round(
          ((item.originalPrice! - item.price) / item.originalPrice!) * 100,
        )
      : 0;
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.listItem}
        onPress={() => openSheet(item)}
        activeOpacity={0.85}
      >
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{item.name}</Text>
          <Text style={styles.listDesc} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.listPrice}>{formatPrice(item.price)}</Text>
            {hasDiscount && (
              <Text style={styles.listOriginalPrice}>
                {formatPrice(item.originalPrice!)}
              </Text>
            )}
          </View>
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
        <View style={styles.listImageWrap}>
          <Image source={{ uri: item.image }} style={styles.listImage} />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{discountPct}%</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
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

      {!search.trim() && visibleCats.length > 0 ? (
        <View style={styles.categoryBar}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryNav}
          >
            {visibleCats.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryChip}
                  onPress={() => jumpToCategory(cat.id)}
                  onLayout={(e) => {
                    tabLayouts.current[cat.id] = {
                      x: e.nativeEvent.layout.x,
                      width: e.nativeEvent.layout.width,
                    };
                    if (cat.id === activeCategory) {
                      moveUnderline(cat.id, false);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      active && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.categoryUnderline,
                { left: underlineX, width: underlineW },
              ]}
            />
          </ScrollView>
          <TouchableOpacity
            style={styles.categoryMore}
            onPress={() => setCatPickerOpen(true)}
          >
            <MaterialIcons
              name="keyboard-arrow-down"
              size={22}
              color={Colors.onSurface}
            />
          </TouchableOpacity>
        </View>
      ) : null}

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
          ref={scrollRef}
          contentContainerStyle={styles.menuList}
          showsVerticalScrollIndicator={false}
          onScroll={handleMenuScroll}
          scrollEventThrottle={16}
        >
          {search.trim() ? (
            <View style={styles.sectionBlock}>
              {searchResults.map((item) => renderMenuItem(item))}
            </View>
          ) : (
            visibleCats.map((cat) => {
              const catItems = menu.filter((m) => m.category === cat.id);
              return (
                <View
                  key={cat.id}
                  style={styles.sectionBlock}
                  onLayout={(e) => {
                    sectionOffsets.current[cat.id] = e.nativeEvent.layout.y;
                  }}
                >
                  <Text style={styles.sectionLabel}>
                    {cat.label} ({catItems.length})
                  </Text>
                  {catItems.map((item) => renderMenuItem(item))}
                </View>
              );
            })
          )}

          <View style={styles.reviewsSection}>
            <Text style={styles.reviewsTitle}>
              Đánh giá {reviewsTotal > 0 ? `(${reviewsTotal})` : ''}
            </Text>
            {reviews.length === 0 && !reviewsLoading ? (
              <Text style={styles.reviewsEmpty}>Chưa có đánh giá nào</Text>
            ) : (
              reviews.map((r) => (
                <View key={r._id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{
                        uri:
                          r.userAvatar ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
                      }}
                      style={styles.reviewAvatar}
                    />
                    <View style={styles.reviewHeaderInfo}>
                      <Text style={styles.reviewName}>{r.userName}</Text>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <MaterialIcons
                            key={n}
                            name={n <= r.rating ? 'star' : 'star-border'}
                            size={12}
                            color={Colors.yellow}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>
                      {formatOrderDate(r.createdAt)}
                    </Text>
                  </View>
                  {r.comment ? (
                    <Text style={styles.reviewComment}>{r.comment}</Text>
                  ) : null}
                </View>
              ))
            )}
            {reviewsPage < reviewsPages && (
              <TouchableOpacity
                style={styles.reviewsMoreBtn}
                onPress={() => loadReviews(reviewsPage + 1)}
                disabled={reviewsLoading}
              >
                {reviewsLoading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.reviewsMoreText}>Xem thêm đánh giá</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
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

      <Modal visible={catPickerOpen} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setCatPickerOpen(false)}>
          <Pressable style={styles.catSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.catSheetTitle}>Danh mục</Text>
            {visibleCats.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.catSheetRow}
                onPress={() => jumpToCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.catSheetLabel,
                    cat.id === activeCategory && styles.catSheetLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
                {cat.id === activeCategory ? (
                  <MaterialIcons name="check" size={20} color={Colors.primary} />
                ) : null}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

