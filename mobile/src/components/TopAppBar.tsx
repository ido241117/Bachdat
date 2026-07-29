import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

type Variant = 'brand' | 'title' | 'location';

interface Props {
  variant?: Variant;
  title?: string;
  onBack?: () => void;
  onCartPress?: () => void;
  showMenu?: boolean;
  showCart?: boolean;
  showLocation?: boolean;
}

export function TopAppBar({
  variant = 'brand',
  title,
  onBack,
  onCartPress,
  showMenu = false,
  showCart = true,
  showLocation = false,
}: Props) {
  if (variant === 'location') {
    return (
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={22} color={Colors.primary} />
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>Giao đến</Text>
            <Text style={styles.locationValue}>Quận 1, TP. Hồ Chí Minh</Text>
          </View>
        </View>
        {showCart && (
          <TouchableOpacity style={styles.iconBtn} onPress={onCartPress}>
            <MaterialIcons name="shopping-cart" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  if (variant === 'title') {
    return (
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.titleLeft}>
          {onBack && (
            <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
              <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
          )}
          <Text style={styles.titleText}>{title}</Text>
        </View>
        {showLocation && (
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="location-on" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.header}>
      <View style={styles.brandLeft}>
        {showMenu && (
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="menu" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
        {onBack && (
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <Text style={styles.brandText}>QuickBite</Text>
      </View>
      {showCart && (
        <TouchableOpacity style={styles.iconBtn} onPress={onCartPress}>
          <MaterialIcons name="shopping-bag" size={24} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 999,
  },
});
