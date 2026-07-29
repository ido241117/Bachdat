import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, formatPrice } from '../data/products';
import { Colors } from '../constants/colors';

interface Props {
  product: Product;
  onPress: (product: Product) => void;
  variant?: 'grid' | 'flash';
}

export function ProductCard({ product, onPress, variant = 'grid' }: Props) {
  const isFlash = variant === 'flash';

  return (
    <TouchableOpacity
      style={[styles.card, isFlash && styles.flashCard]}
      onPress={() => onPress(product)}
      activeOpacity={0.8}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.image }} style={styles.image} />
        {product.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{product.discount}%</Text>
          </View>
        )}
      </View>
      {!isFlash && (
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.originalPrice)}
              </Text>
            )}
          </View>
          <View style={styles.meta}>
            <Ionicons name="star" size={12} color={Colors.yellow} />
            <Text style={styles.rating}>{product.rating}</Text>
            <Text style={styles.sold}>Đã bán {product.sold}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1,
    margin: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  flashCard: {
    width: 110,
    marginRight: 10,
    flex: undefined,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.background,
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: Colors.red,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  info: {
    padding: 8,
  },
  name: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: 11,
    color: Colors.textLight,
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  sold: {
    fontSize: 11,
    color: Colors.textLight,
    marginLeft: 4,
  },
});
