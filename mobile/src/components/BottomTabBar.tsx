import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

export type TabKey = 'home' | 'orders' | 'rewards' | 'profile';

interface TabItem {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  activeIcon: keyof typeof MaterialIcons.glyphMap;
}

const TABS: TabItem[] = [
  { key: 'home', label: 'Home', icon: 'home', activeIcon: 'home' },
  { key: 'orders', label: 'Orders', icon: 'receipt-long', activeIcon: 'receipt-long' },
  { key: 'rewards', label: 'Rewards', icon: 'card-giftcard', activeIcon: 'card-giftcard' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

interface Props {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export function BottomTabBar({ activeTab, onTabPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isActive ? tab.activeIcon : tab.icon}
              size={24}
              color={isActive ? Colors.primary : Colors.secondary}
            />
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
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    paddingTop: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '600',
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
