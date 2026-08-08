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
import { TopAppBar } from '../components/TopAppBar';
import { useAuth } from '../context/AuthContext';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';

const MENU_ITEMS = [
  {
    icon: 'location-on' as const,
    title: 'Địa chỉ đã lưu',
    subtitle: 'Quản lý các địa điểm nhận hàng',
  },
  {
    icon: 'payments' as const,
    title: 'Phương thức thanh toán',
    subtitle: 'Thẻ Visa, MoMo, Ví ZaloPay',
  },
  {
    icon: 'help' as const,
    title: 'Trung tâm hỗ trợ',
    subtitle: 'Giải đáp thắc mắc và khiếu nại',
  },
  {
    icon: 'notifications' as const,
    title: 'Cài đặt thông báo',
    subtitle: 'Tùy chỉnh thông báo đơn hàng & khuyến mãi',
  },
];

export function ProfileScreen() {
  const { user, ready, logout } = useAuth();

  if (!ready) {
    return (
      <View style={styles.container}>
        <TopAppBar />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  const name = user?.name || 'Khách';
  const phone = user?.phone || '';
  const avatar = user?.avatar || FALLBACK_AVATAR;
  const tier = user ? formatTierLabel(user.tier) : 'Thành viên';
  const points = user?.points ?? 0;

  return (
    <View style={styles.container}>
      <TopAppBar />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <TouchableOpacity style={styles.editBtn}>
              <MaterialIcons name="edit" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.phone}>{phone}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="loyalty" size={24} color={Colors.primary} />
            <Text style={styles.statText}>{tier}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="card-giftcard" size={24} color={Colors.primary} />
            <Text style={styles.statText}>
              {points.toLocaleString('vi-VN')} Điểm
            </Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuHeaderText}>TÀI KHOẢN & TIỆN ÍCH</Text>
          </View>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.menuItem, index < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  editBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  phone: {
    fontSize: 14,
    color: Colors.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
    textAlign: 'center',
  },
  menuCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceContainerLow,
  },
  menuHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 24,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.errorContainer,
    backgroundColor: Colors.errorContainer,
  },
  logoutText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 15,
  },
  version: {
    textAlign: 'center',
    marginTop: 16,
    color: Colors.textLight,
    fontSize: 12,
  },
});
