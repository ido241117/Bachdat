import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useCart } from '../context/CartContext';
import { styles } from '../styles/components/BottomTabBar.styles';

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

