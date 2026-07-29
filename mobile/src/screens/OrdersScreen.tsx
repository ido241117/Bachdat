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
} from 'react-native';
import { Colors } from '../constants/colors';
import { Order, OrderStatus, STATUS_LABELS } from '../data/orders';
import { formatPrice } from '../api/format';
import { ordersApi } from '../api';
import { mapOrder } from '../api/mappers';
import { TopAppBar } from '../components/TopAppBar';
import { useAuth } from '../context/AuthContext';

type TabType = 'active' | 'history';

const STATUS_STYLES: Record<
  OrderStatus,
  { bg: string; text: string; totalColor?: string }
> = {
  delivering: {
    bg: 'rgba(216,57,0,0.1)',
    text: Colors.primaryContainer,
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

function OrderCard({ order }: { order: Order }) {
  const statusStyle = STATUS_STYLES[order.status];
  const isCancelled = order.status === 'cancelled';

  return (
    <View style={[styles.card, isCancelled && styles.cardCancelled]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Image
            source={{ uri: order.image }}
            style={[styles.orderImage, isCancelled && styles.orderImageGrey]}
          />
          <View>
            <Text style={styles.restaurantName}>{order.restaurantName}</Text>
            <Text style={styles.orderDate}>{order.date}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {STATUS_LABELS[order.status]}
          </Text>
        </View>
      </View>

      <View style={styles.itemsBox}>
        <Text
          style={[
            styles.itemsText,
            order.status === 'delivering' && styles.itemsTextItalic,
          ]}
        >
          {order.items}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>Tổng thanh toán</Text>
          <Text
            style={[
              styles.totalValue,
              {
                color:
                  order.status === 'delivering'
                    ? Colors.primary
                    : statusStyle.totalColor,
              },
            ]}
          >
            {formatPrice(order.total)}
          </Text>
        </View>
        <TouchableOpacity
          style={
            order.status === 'delivering' ? styles.primaryBtn : styles.outlineBtn
          }
        >
          <Text
            style={
              order.status === 'delivering'
                ? styles.primaryBtnText
                : styles.outlineBtnText
            }
          >
            {order.status === 'delivering' ? 'Theo dõi' : 'Đặt lại'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function OrdersScreen() {
  const { ready } = useAuth();
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

  const list = tab === 'active' ? activeOrders : historyOrders;

  return (
    <View style={styles.container}>
      <TopAppBar showMenu />

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
            list.map((order) => <OrderCard key={order.id} order={order} />)
          )}
        </ScrollView>
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
  },
  errorText: {
    color: Colors.primary,
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.secondary,
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCancelled: {
    opacity: 0.75,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  orderImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  orderImageGrey: {
    opacity: 0.6,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemsBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(231,189,178,0.3)',
    paddingVertical: 8,
    marginBottom: 16,
  },
  itemsText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  itemsTextItalic: {
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.onSurface,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  outlineBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
