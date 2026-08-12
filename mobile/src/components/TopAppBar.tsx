import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { styles } from '../styles/components/TopAppBar.styles';

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

