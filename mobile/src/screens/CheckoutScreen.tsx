import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { formatPrice } from '../api/format';
import { ordersApi, userApi, vouchersApi } from '../api';
import type { ApiAddress } from '../api/types';
import { TopAppBar } from '../components/TopAppBar';
import { useCart } from '../context/CartContext';

interface Props {
  onBack: () => void;
}

export function CheckoutScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const {
    restaurantId,
    items,
    itemCount,
    subtotal,
    updateQty,
    removeItem,
    clear,
  } = useCart();

  const [payment, setPayment] = useState<'cash' | 'momo'>('cash');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [address, setAddress] = useState<ApiAddress | null>(null);
  const [discount, setDiscount] = useState(0);
  const [voucherCode, setVoucherCode] = useState('MEALNOW20');

  const deliveryFee = items.length > 0 ? 15000 : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const addresses = await userApi.addresses();
        if (cancelled) return;
        setAddress(addresses.find((a) => a.isDefault) || addresses[0] || null);
      } catch {
        // keep null address
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (items.length === 0) {
        setDiscount(0);
        return;
      }
      try {
        const result = await vouchersApi.validate(
          voucherCode,
          subtotal,
          deliveryFee,
        );
        if (!cancelled) {
          setDiscount(result.valid ? result.discount : 0);
        }
      } catch {
        if (!cancelled) setDiscount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items.length, subtotal, deliveryFee, voucherCode]);

  const handlePlaceOrder = async () => {
    if (items.length === 0 || !restaurantId || !address) {
      Alert.alert('Thiếu thông tin', 'Cần địa chỉ giao hàng và món trong giỏ.');
      return;
    }

    setPlacing(true);
    try {
      await ordersApi.create({
        restaurantId,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          options: i.options,
          note: i.note,
        })),
        deliveryAddress: {
          label: address.label,
          fullAddress: address.fullAddress,
          note: address.note || '',
          lat: address.lat,
          lng: address.lng,
        },
        paymentMethod: payment,
        voucherCode: discount > 0 ? voucherCode : undefined,
        note: '',
        deliveryFee,
      });
      clear();
      setPlaced(true);
      setTimeout(() => setPlaced(false), 2000);
    } catch (err) {
      Alert.alert(
        'Đặt đơn thất bại',
        err instanceof Error ? err.message : 'Thử lại sau',
      );
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={styles.container}>
      <TopAppBar variant="title" title="Giỏ hàng" onBack={onBack} showLocation />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>ĐỊA CHỈ GIAO HÀNG</Text>
            <TouchableOpacity>
              <Text style={styles.changeBtn}>Thay đổi</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressCard}>
            <View style={styles.addressIcon}>
              <MaterialIcons name="location-on" size={22} color={Colors.primary} />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressTitle}>
                {address?.label || 'Chưa có địa chỉ'}
              </Text>
              <Text style={styles.addressText}>
                {address?.fullAddress || 'Đăng nhập để lấy địa chỉ mặc định'}
              </Text>
              {address?.note ? (
                <Text style={styles.addressNote}>Ghi chú: {address.note}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MÓN ĐÃ CHỌN</Text>
          {items.length === 0 ? (
            <View style={styles.emptyCart}>
              <MaterialIcons name="remove-shopping-cart" size={40} color={Colors.textLight} />
              <Text style={styles.emptyCartText}>Giỏ hàng trống</Text>
              <Text style={styles.emptyCartHint}>Thêm món để tiếp tục đặt hàng</Text>
            </View>
          ) : (
            <View style={styles.itemsCard}>
              {items.map((item, index) => (
                <View
                  key={item.menuItemId}
                  style={[styles.cartItem, index < items.length - 1 && styles.cartItemBorder]}
                >
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemNote}>
                      {item.options.length ? item.options.join(', ') : 'Không topping'}
                    </Text>
                    <View style={styles.itemBottom}>
                      <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => updateQty(item.menuItemId, -1)}
                        >
                          <MaterialIcons name="remove" size={18} color={Colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.stepValue}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => updateQty(item.menuItemId, 1)}
                        >
                          <MaterialIcons name="add" size={18} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removeItem(item.menuItemId)}
                    accessibilityLabel={`Xóa ${item.name}`}
                  >
                    <MaterialIcons name="delete-outline" size={22} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.addMoreBtn} onPress={onBack}>
            <MaterialIcons name="add-circle" size={20} color={Colors.primary} />
            <Text style={styles.addMoreText}>Thêm món khác</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PHƯƠNG THỨC THANH TOÁN</Text>
          <View style={styles.paymentGrid}>
            <TouchableOpacity
              style={[styles.paymentCard, payment === 'cash' && styles.paymentActive]}
              onPress={() => setPayment('cash')}
            >
              {payment === 'cash' && (
                <MaterialIcons
                  name="check-circle"
                  size={18}
                  color={Colors.primary}
                  style={styles.paymentCheck}
                />
              )}
              <MaterialIcons name="payments" size={32} color={Colors.primary} />
              <Text style={styles.paymentLabel}>Tiền mặt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentCard, payment === 'momo' && styles.paymentActive]}
              onPress={() => setPayment('momo')}
            >
              {payment === 'momo' && (
                <MaterialIcons
                  name="check-circle"
                  size={18}
                  color={Colors.primary}
                  style={styles.paymentCheck}
                />
              )}
              <MaterialIcons name="account-balance-wallet" size={32} color={Colors.primary} />
              <Text style={styles.paymentLabel}>MoMo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>TÓM TẮT ĐƠN HÀNG</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Tạm tính ({itemCount} món)</Text>
            <Text style={styles.summaryText}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Phí giao hàng</Text>
            <Text style={styles.summaryText}>{formatPrice(deliveryFee)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.discountRow}>
              <MaterialIcons name="sell" size={16} color={Colors.primary} />
              <Text style={styles.discountText}>Giảm giá ({voucherCode})</Text>
            </View>
            <Text style={styles.discountValue}>-{formatPrice(discount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.footerTop}>
          <View>
            <Text style={styles.footerSub}>Tổng cộng (Đã gồm VAT)</Text>
            <Text style={styles.footerTotal}>{formatPrice(total)}</Text>
          </View>
          <TouchableOpacity
            style={styles.promoBtn}
            onPress={() => setVoucherCode('MEALNOW20')}
          >
            <MaterialIcons name="confirmation-number" size={20} color={Colors.primary} />
            <Text style={styles.promoText}>Sửa mã giảm giá</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.orderBtn,
            placed && styles.orderBtnSuccess,
            items.length === 0 && styles.orderBtnDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={placing || placed || items.length === 0}
          activeOpacity={0.9}
        >
          {placing ? (
            <View style={styles.orderBtnContent}>
              <ActivityIndicator color={Colors.white} />
              <Text style={styles.orderBtnText}>Đang xử lý...</Text>
            </View>
          ) : placed ? (
            <View style={styles.orderBtnContent}>
              <MaterialIcons name="check-circle" size={22} color={Colors.white} />
              <Text style={styles.orderBtnText}>Đã đặt thành công!</Text>
            </View>
          ) : (
            <View style={styles.orderBtnContent}>
              <Text style={styles.orderBtnText}>Đặt đơn</Text>
              <MaterialIcons name="arrow-forward" size={22} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 180,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  changeBtn: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    gap: 12,
  },
  addressIcon: {
    backgroundColor: Colors.primaryFixed,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInfo: {
    flex: 1,
    gap: 2,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  addressText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  addressNote: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 2,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  emptyCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  emptyCartHint: {
    fontSize: 13,
    color: Colors.textLight,
  },
  itemsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    overflow: 'hidden',
  },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  cartItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  itemNote: {
    fontSize: 12,
    color: Colors.secondary,
  },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 16,
    textAlign: 'center',
  },
  deleteBtn: {
    padding: 4,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  addMoreText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  paymentGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  paymentActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  paymentCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountText: {
    fontSize: 14,
    color: Colors.primary,
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerSub: {
    fontSize: 12,
    color: Colors.secondary,
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  promoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  promoText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  orderBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  orderBtnSuccess: {
    backgroundColor: '#2E7D32',
  },
  orderBtnDisabled: {
    opacity: 0.5,
  },
  orderBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
