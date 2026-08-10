import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

type Variant = 'brand' | 'title' | 'location' | 'orange';

interface Props {
  variant?: Variant;
  title?: string;
  subtitle?: string;
  addressLabel?: string;
  onBack?: () => void;
  onCartPress?: () => void;
  onBellPress?: () => void;
  onAddressPress?: () => void;
  showCart?: boolean;
}

export function TopAppBar({
  variant = 'brand',
  title,
  subtitle,
  addressLabel = 'Chọn địa chỉ giao hàng',
  onBack,
  onCartPress,
  onBellPress,
  onAddressPress,
  showCart = false,
}: Props) {
  if (variant === 'location' || variant === 'orange' || variant === 'brand') {
    return (
      <SafeAreaView edges={['top']} style={styles.orangeHeader}>
        <View style={styles.orangeRow}>
          <View style={styles.brandBlock}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.locationBlock}
              onPress={onAddressPress}
              disabled={!onAddressPress}
              activeOpacity={0.85}
            >
              <Text style={styles.deliverLabel}>Giao đến</Text>
              <View style={styles.addressRow}>
                <MaterialIcons name="location-on" size={14} color={Colors.white} />
                <Text style={styles.addressText} numberOfLines={1}>
                  {addressLabel}
                </Text>
                {onAddressPress ? (
                  <MaterialIcons name="chevron-right" size={16} color={Colors.white} />
                ) : null}
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.orangeActions}>
            {onBellPress && (
              <TouchableOpacity style={styles.orangeIcon} onPress={onBellPress}>
                <MaterialIcons name="notifications-none" size={22} color={Colors.white} />
              </TouchableOpacity>
            )}
            {showCart && (
              <TouchableOpacity style={styles.orangeIcon} onPress={onCartPress}>
                <MaterialIcons name="shopping-cart" size={22} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.orangeHeader}>
      <View style={styles.titleRow}>
        {onBack && (
          <TouchableOpacity style={styles.orangeIcon} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  orangeHeader: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  orangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  locationBlock: {
    flex: 1,
  },
  deliverLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addressText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  orangeActions: {
    flexDirection: 'row',
    gap: 4,
  },
  orangeIcon: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
  },
  titleText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
});
