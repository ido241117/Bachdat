import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Order, OrderStatus, STATUS_LABELS } from '../data/orders';
import { formatPrice } from '../api/format';
import { ordersApi } from '../api';
import { mapOrder } from '../api/mappers';
import { TopAppBar } from '../components/TopAppBar';
import { useAuth } from '../context/AuthContext';
import { useCart, type CartLine } from '../context/CartContext';

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.secondary },
  tabTextActive: { color: Colors.primary },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '40%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 12, paddingBottom: 32 },
  errorText: { color: Colors.error, marginBottom: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  emptyText: { color: Colors.secondary, textAlign: 'center', padding: 24 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  cardCancelled: { opacity: 0.75 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: { flexDirection: 'row', gap: 10, flex: 1 },
  orderImage: { width: 48, height: 48, borderRadius: 10 },
  restaurantName: { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  orderDate: { fontSize: 12, color: Colors.secondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  itemsBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 8,
    padding: 10,
  },
  itemsText: { fontSize: 13, color: Colors.onSurfaceVariant },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 11, color: Colors.secondary },
  totalValue: { fontSize: 16, fontWeight: '700' },
  actions: { alignItems: 'flex-end', gap: 6 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  outlineBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  cancelLink: { paddingHorizontal: 4 },
  cancelText: { color: Colors.error, fontSize: 12, fontWeight: '600' },
});
