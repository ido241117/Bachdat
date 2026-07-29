import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Product, formatPrice } from '../data/products';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  product: Product;
  onBack: () => void;
}

export function ProductDetailScreen({ product, onBack }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const images = product.images.length > 0 ? product.images : [product.image];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          <Image
            source={{ uri: images[activeImage] }}
            style={styles.mainImage}
          />
          <SafeAreaView edges={['top']} style={styles.imageOverlay}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Ionicons name="share-outline" size={24} color={Colors.white} />
            </TouchableOpacity>
          </SafeAreaView>
          {product.discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{product.discount}%</Text>
            </View>
          )}
          {images.length > 1 && (
            <View style={styles.thumbnails}>
              {images.map((img, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setActiveImage(i)}
                  style={[styles.thumb, i === activeImage && styles.thumbActive]}
                >
                  <Image source={{ uri: img }} style={styles.thumbImage} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={Colors.yellow} />
            <Text style={styles.rating}>{product.rating}</Text>
            <Text style={styles.sold}>Đã bán {product.sold}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.originalPrice)}
              </Text>
            )}
          </View>

          <View style={styles.shopCard}>
            <View style={styles.shopAvatar}>
              <Ionicons name="storefront" size={24} color={Colors.primary} />
            </View>
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{product.shop}</Text>
              <Text style={styles.shopMeta}>⭐ 4.8 · Giao 15-25 phút</Text>
            </View>
            <TouchableOpacity style={styles.chatBtn}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Số lượng</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons name="add" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity style={styles.cartBtn}>
          <Ionicons name="cart-outline" size={24} color={Colors.primary} />
          <Text style={styles.cartBtnText}>Giỏ hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.orderBtn}>
          <Text style={styles.orderBtnText}>
            Đặt ngay · {formatPrice(product.price * quantity)}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  imageSection: {
    position: 'relative',
    backgroundColor: Colors.background,
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: Colors.red,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  thumbnails: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: Colors.primary,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 28,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  rating: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sold: {
    fontSize: 13,
    color: Colors.textLight,
    marginLeft: 8,
  },
  categoryBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: 16,
    color: Colors.textLight,
    textDecorationLine: 'line-through',
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  shopAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  shopMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
    backgroundColor: Colors.white,
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  cartBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  orderBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  orderBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
