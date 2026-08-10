import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { formatTierLabel } from '../api/format';
import { ordersApi, userApi } from '../api';
import type { ApiAddress } from '../api/types';
import { TopAppBar } from '../components/TopAppBar';
import { useAuth } from '../context/AuthContext';
import { mapOrder } from '../api/mappers';
import type { Order } from '../data/orders';
import { formatPrice } from '../api/format';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';

interface Props {
  onOpenRewards: () => void;
  onOpenOrders: () => void;
  onOpenAddresses: () => void;
  onLogin?: () => void;
}

export function ProfileScreen({
  onOpenRewards,
  onOpenOrders,
  onOpenAddresses,
  onLogin,
}: Props) {
  const { user, ready, logout } = useAuth();
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [recentOrder, setRecentOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const [addrs, history] = await Promise.all([
          userApi.addresses().catch(() => []),
          ordersApi.list('history').catch(() => []),
        ]);
        if (cancelled) return;
        setAddresses(addrs);
        if (history[0]) setRecentOrder(mapOrder(history[0]));
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user?.id]);

  if (!ready) {
    return (
      <View style={styles.container}>
        <TopAppBar variant="title" title="Cá nhân" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.hero}>
          <TopAppBar variant="title" title="Cá nhân" />
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, styles.guestAvatar]}>
              <MaterialIcons name="person" size={40} color={Colors.white} />
            </View>
            <Text style={styles.name}>Khách</Text>
            <Text style={styles.phone}>Đăng nhập để lưu địa chỉ & đơn hàng</Text>
          </View>
        </View>
        <View style={styles.guestActions}>
          <TouchableOpacity style={styles.loginPrimary} onPress={onLogin}>
            <Text style={styles.loginPrimaryText}>Đăng nhập / Đăng ký</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuCard} onPress={onOpenAddresses}>
            <View style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <MaterialIcons name="location-on" size={22} color={Colors.primary} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>Chọn địa chỉ giao hàng</Text>
                <Text style={styles.menuSubtitle}>Dùng map như ShopeeFood</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={Colors.secondary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const name = user.name || 'Khách';
  const phone = user.phone || '';
  const avatar = user.avatar || FALLBACK_AVATAR;
  const tier = formatTierLabel(user.tier);
  const points = user.points ?? 0;

  const menus = [
    {
      icon: 'location-on' as const,
      title: 'Địa chỉ giao hàng',
      subtitle: `${addresses.length} địa chỉ đã lưu`,
      onPress: onOpenAddresses,
    },
    {
      icon: 'receipt-long' as const,
      title: 'Đơn hàng',
      subtitle: 'Theo dõi & lịch sử',
      onPress: onOpenOrders,
    },
    {
      icon: 'card-giftcard' as const,
      title: 'Ưu đãi & điểm thưởng',
      subtitle: `${points.toLocaleString('vi-VN')} điểm`,
      onPress: onOpenRewards,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <TopAppBar variant="title" title="Cá nhân" />
        <View style={styles.profileHeader}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.phone}>{phone}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.bodyContent}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="loyalty" size={22} color={Colors.primary} />
            <Text style={styles.statText}>{tier}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="stars" size={22} color={Colors.primary} />
            <Text style={styles.statText}>
              {points.toLocaleString('vi-VN')} điểm
            </Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="local-shipping" size={22} color={Colors.primary} />
            <Text style={styles.statText}>{addresses.length} địa chỉ</Text>
          </View>
        </View>

        {recentOrder && (
          <View style={styles.recentCard}>
            <Text style={styles.recentTitle}>Đơn gần nhất</Text>
            <Text style={styles.recentName}>{recentOrder.restaurantName}</Text>
            <Text style={styles.recentMeta}>
              {recentOrder.date} · {formatPrice(recentOrder.total)}
            </Text>
            <TouchableOpacity style={styles.recentBtn} onPress={onOpenOrders}>
              <Text style={styles.recentBtnText}>Xem đơn hàng</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.menuCard}>
          {menus.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.menuItem,
                index < menus.length - 1 && styles.menuItemBorder,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>
                <MaterialIcons name={item.icon} size={22} color={Colors.primary} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={Colors.secondary} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <MaterialIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Mealnow v2.4.12</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 24,
  },
  profileHeader: { alignItems: 'center', gap: 4, marginTop: 4 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.white,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestAvatar: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  guestActions: {
    padding: 16,
    gap: 14,
  },
  loginPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginPrimaryText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  name: { fontSize: 20, fontWeight: '700', color: Colors.white, marginTop: 8 },
  phone: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  bodyContent: { padding: 16, paddingBottom: 40, gap: 14 },
  statsGrid: { flexDirection: 'row', gap: 8, marginTop: -8 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
    textAlign: 'center',
  },
  recentCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  recentTitle: { fontSize: 12, color: Colors.secondary, fontWeight: '600' },
  recentName: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  recentMeta: { fontSize: 12, color: Colors.secondary },
  recentBtn: { marginTop: 8, alignSelf: 'flex-start' },
  recentBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  menuSubtitle: { fontSize: 12, color: Colors.secondary, marginTop: 2 },
  logoutBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.errorContainer,
  },
  logoutText: { color: Colors.error, fontWeight: '700', fontSize: 15 },
  version: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 12,
  },
});
