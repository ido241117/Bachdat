import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useCart } from '../context/CartContext';

export type TabKey = 'home' | 'cart' | 'orders' | 'profile';

interface TabItem {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const TABS: TabItem[] = [
  { key: 'home', label: 'Trang chủ', icon: 'home' },
  { key: 'cart', label: 'Giỏ hàng', icon: 'shopping-cart' },
  { key: 'orders', label: 'Đơn hàng', icon: 'inventory-2' },
  { key: 'profile', label: 'Cá nhân', icon: 'person' },
];

interface Props {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export function BottomTabBar({ activeTab, onTabPress }: Props) {
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const badge = tab.key === 'cart' ? itemCount : 0;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            {isActive && <View style={styles.indicator} />}
            <View style={styles.iconWrap}>
              <MaterialIcons
                name={tab.icon}
                size={22}
                color={isActive ? Colors.primary : Colors.secondary}
              />
              {badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 2,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#ef4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
