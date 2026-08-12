import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Colors } from '../constants/colors';
import { Order, OrderStatus, STATUS_LABELS } from '../data/orders';
import { formatPrice } from '../api/format';
import { ordersApi } from '../api';
import { mapOrder } from '../api/mappers';
import { TopAppBar } from '../components/TopAppBar';
import { ReviewModal } from '../components/ReviewModal';
import { useAuth } from '../context/AuthContext';
import { useCart, type CartLine } from '../context/CartContext';
import { styles } from '../styles/screens/OrdersScreen.styles';

type TabType = 'active' | 'history';

const STATUS_STYLES: Record<
  OrderStatus,
  { bg: string; text: string; totalColor?: string }
> = {
  delivering: {
    bg: 'rgba(255,107,43,0.12)',
    text: Colors.primary,
  },
  completed: {
    bg: Colors.secondaryContainer,
    text: Colors.onSecondaryContainer,
    totalColor: Colors.onSurface,
  },
  cancelled: {
    bg: Colors.errorContainer,
    text: Colors.onErrorContainer,
    totalColor: Colors.onSurface,
  },
};

interface Props {
  onTrack: (orderId: string) => void;
  onGoCart: () => void;
}

export function OrdersScreen({ onTrack, onGoCart }: Props) {
  const { ready } = useAuth();
  const { replaceCart } = useCart();
  const [tab, setTab] = useState<TabType>('active');
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [active, history] = await Promise.all([
        ordersApi.list('active'),
        ordersApi.list('history'),
      ]);
      setActiveOrders(active.map(mapOrder));
      setHistoryOrders(history.map(mapOrder));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const handleReorder = async (order: Order) => {
    try {
      const res = await ordersApi.reorder(order.id);
      const lines: CartLine[] = (res.cart.items || []).map((i) => ({
        menuItemId: String(i.menuItemId),
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        options: i.options || [],
        note: i.note || '',
        image: i.image || order.image,
      }));
      replaceCart(
        String(res.cart.restaurantId),
        res.cart.restaurantName || order.restaurantName,
        lines,
      );
      onGoCart();
    } catch (err) {
      Alert.alert(
        'Không đặt lại được',
        err instanceof Error ? err.message : 'Thử lại sau',
      );
    }
  };

  const handleCancel = (order: Order) => {
    Alert.alert('Hủy đơn?', 'Bạn chắc muốn hủy đơn này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy đơn',
        style: 'destructive',
        onPress: async () => {
          try {
            await ordersApi.cancel(order.id);
            await load(true);
          } catch (err) {
            Alert.alert(
              'Không hủy được',
              err instanceof Error ? err.message : 'Thử lại sau',
            );
          }
        },
      },
    ]);
  };

  const list = tab === 'active' ? activeOrders : historyOrders;

  return (
    <View style={styles.container}>
      <TopAppBar variant="title" title="Đơn hàng" />

      <View style={styles.tabs}>
        <TouchableOpacity style={styles.tab} onPress={() => setTab('active')}>
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>
            Đang đến
          </Text>
          {tab === 'active' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => setTab('history')}>
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            Lịch sử
          </Text>
          {tab === 'history' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
          }
        >
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Text style={styles.sectionTitle}>
            {tab === 'active' ? 'Đơn hàng hiện tại' : 'Gần đây'}
          </Text>
          {list.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có đơn hàng</Text>
          ) : (
            list.map((order) => {
              const statusStyle = STATUS_STYLES[order.status];
              const canCancel = !['completed', 'cancelled', 'delivering'].includes(
                order.apiStatus,
              );
              return (
                <View
                  key={order.id}
                  style={[
                    styles.card,
                    order.status === 'cancelled' && styles.cardCancelled,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Image
                        source={{ uri: order.image }}
                        style={styles.orderImage}
                      />
                      <View>
                        <Text style={styles.restaurantName}>
                          {order.restaurantName}
                        </Text>
                        <Text style={styles.orderDate}>{order.date}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {STATUS_LABELS[order.status]}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemsBox}>
                    <Text style={styles.itemsText}>{order.items}</Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                      <Text style={[styles.totalValue, { color: Colors.primary }]}>
                        {formatPrice(order.total)}
                      </Text>
                    </View>
                    <View style={styles.actions}>
                      {order.status === 'delivering' ? (
                        <TouchableOpacity
                          style={styles.primaryBtn}
                          onPress={() => onTrack(order.id)}
                        >
                          <Text style={styles.primaryBtnText}>Theo dõi</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.outlineBtn}
                          onPress={() => handleReorder(order)}
                        >
                          <Text style={styles.outlineBtnText}>Đặt lại</Text>
                        </TouchableOpacity>
                      )}
                      {order.status === 'completed' && order.restaurantId && (
                        order.reviewed ? (
                          <Text style={styles.reviewedText}>Đã đánh giá</Text>
                        ) : (
                          <TouchableOpacity
                            style={styles.reviewBtn}
                            onPress={() => setReviewOrder(order)}
                          >
                            <Text style={styles.reviewBtnText}>Đánh giá</Text>
                          </TouchableOpacity>
                        )
                      )}
                      {canCancel && (
                        <TouchableOpacity
                          style={styles.cancelLink}
                          onPress={() => handleCancel(order)}
                        >
                          <Text style={styles.cancelText}>Hủy</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {reviewOrder && reviewOrder.restaurantId && (
        <ReviewModal
          visible
          restaurantId={reviewOrder.restaurantId}
          restaurantName={reviewOrder.restaurantName}
          orderId={reviewOrder.id}
          onClose={() => setReviewOrder(null)}
          onSubmitted={() => {
            setHistoryOrders((prev) =>
              prev.map((o) =>
                o.id === reviewOrder.id ? { ...o, reviewed: true } : o,
              ),
            );
            setReviewOrder(null);
          }}
        />
      )}
    </View>
  );
}

