import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
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
import { styles } from '../styles/screens/ProfileScreen.styles';

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
          <Text style={styles.guestHint}>
          
          </Text>
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

