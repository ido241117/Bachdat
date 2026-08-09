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
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { formatPrice } from '../api/format';
import { ordersApi, userApi, vouchersApi } from '../api';
import type { ApiAddress, ApiVoucher } from '../api/types';
import { TopAppBar } from '../components/TopAppBar';
import { useCart } from '../context/CartContext';

interface Props {
  onBrowse?: () => void;
  onOrderPlaced?: (orderId: string) => void;
  onBack?: () => void;
}

export function CheckoutScreen({ onBrowse, onOrderPlaced, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const {
    restaurantId,
    restaurantName,
    items,
    itemCount,
    subtotal,
    updateQty,
    removeItem,
    clear,
  } = useCart();

  const [payment, setPayment] = useState<'cash' | 'momo'>('cash');
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState<ApiAddress | null>(null);
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [addressOpen, setAddressOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [vouchers, setVouchers] = useState<ApiVoucher[]>([]);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [note, setNote] = useState('');

  const deliveryFee = items.length > 0 ? 15000 : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [addrs, voucherList] = await Promise.all([
          userApi.addresses(),
          vouchersApi.list(),
        ]);
        if (cancelled) return;
        setAddresses(addrs);
        setAddress(addrs.find((a) => a.isDefault) || addrs[0] || null);
        setVouchers(voucherList);
      } catch {
        // keep empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (items.length === 0 || !voucherCode) {
        setDiscount(0);
        return;
      }
      try {
        const result = await vouchersApi.validate(
          voucherCode,
          subtotal,
          deliveryFee,
        );
        if (!cancelled) setDiscount(result.valid ? result.discount : 0);
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
      const result = await ordersApi.create({
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
        note,
        deliveryFee,
      });
      const created = result.order as { _id?: string; id?: string };
      const orderId = String(created._id || created.id || '');
      clear();
      if (orderId && onOrderPlaced) onOrderPlaced(orderId);
      else Alert.alert('Thành công', 'Đã đặt đơn hàng');
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
      <TopAppBar
        variant="title"
        title="Giỏ hàng"
        subtitle={restaurantName || undefined}
        onBack={onBack}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>ĐỊA CHỈ GIAO HÀNG</Text>
            <TouchableOpacity onPress={() => setAddressOpen(true)}>
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
                {address?.fullAddress || 'Thêm địa chỉ trong tài khoản'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MÓN ĐÃ CHỌN</Text>
          {items.length === 0 ? (
            <View style={styles.emptyCart}>
              <MaterialIcons name="remove-shopping-cart" size={40} color={Colors.textLight} />
              <Text style={styles.emptyCartText}>Giỏ hàng trống</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={onBrowse}>
                <Text style={styles.browseBtnText}>Xem quán gần đây</Text>
              </TouchableOpacity>
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
                  <TouchableOpacity onPress={() => removeItem(item.menuItemId)}>
                    <MaterialIcons name="delete-outline" size={22} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GHI CHÚ</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Ghi chú cho tài xế / quán..."
            placeholderTextColor={Colors.textLight}
            value={note}
            onChangeText={setNote}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PHƯƠNG THỨC THANH TOÁN</Text>
          <View style={styles.paymentGrid}>
            {(['cash', 'momo'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.paymentCard, payment === method && styles.paymentActive]}
                onPress={() => setPayment(method)}
              >
                <MaterialIcons
                  name={method === 'cash' ? 'payments' : 'account-balance-wallet'}
                  size={28}
                  color={Colors.primary}
                />
                <Text style={styles.paymentLabel}>
                  {method === 'cash' ? 'Tiền mặt' : 'MoMo'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>TÓM TẮT</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Tạm tính ({itemCount} món)</Text>
            <Text style={styles.summaryText}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Phí giao hàng</Text>
            <Text style={styles.summaryText}>{formatPrice(deliveryFee)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.discountText}>
              Giảm giá {voucherCode ? `(${voucherCode})` : ''}
            </Text>
            <Text style={styles.discountValue}>-{formatPrice(discount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.promoBtn}
          onPress={() => setVoucherOpen(true)}
        >
          <MaterialIcons name="confirmation-number" size={20} color={Colors.primary} />
          <Text style={styles.promoText}>
            {voucherCode ? `Mã: ${voucherCode}` : 'Chọn mã giảm giá'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.orderBtn, items.length === 0 && styles.orderBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={placing || items.length === 0}
        >
          {placing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.orderBtnText}>Đặt hàng ngay · {formatPrice(total)}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={addressOpen} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setAddressOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Chọn địa chỉ</Text>
            {addresses.map((a) => (
              <TouchableOpacity
                key={a._id}
                style={styles.sheetItem}
                onPress={() => {
                  setAddress(a);
                  setAddressOpen(false);
                }}
              >
                <Text style={styles.sheetItemTitle}>{a.label}</Text>
                <Text style={styles.sheetItemSub}>{a.fullAddress}</Text>
              </TouchableOpacity>
            ))}
            {addresses.length === 0 && (
              <Text style={styles.sheetEmpty}>Chưa có địa chỉ đã lưu</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={voucherOpen} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setVoucherOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Mã giảm giá</Text>
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setVoucherCode('');
                setVoucherOpen(false);
              }}
            >
              <Text style={styles.sheetItemTitle}>Không dùng mã</Text>
            </TouchableOpacity>
            {vouchers.map((v) => (
              <TouchableOpacity
                key={v._id}
                style={styles.sheetItem}
                onPress={() => {
                  setVoucherCode(v.code);
                  setVoucherOpen(false);
                }}
              >
                <Text style={styles.sheetItemTitle}>{v.code}</Text>
                <Text style={styles.sheetItemSub}>{v.title}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 160, gap: 20 },
  section: { gap: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  changeBtn: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 14,
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
  addressInfo: { flex: 1, gap: 2 },
  addressTitle: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  addressText: { fontSize: 13, color: Colors.onSurfaceVariant },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
  },
  emptyCartText: { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  browseBtn: {
    marginTop: 8,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  browseBtnText: { color: Colors.primary, fontWeight: '700' },
  itemsCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  cartItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  itemImage: { width: 60, height: 60, borderRadius: 8 },
  itemInfo: { flex: 1, gap: 6 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.onSurface },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontSize: 14, fontWeight: '600', minWidth: 16, textAlign: 'center' },
  noteInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.onSurface,
  },
  paymentGrid: { flexDirection: 'row', gap: 10 },
  paymentCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  paymentActive: { borderColor: Colors.primary, borderWidth: 2 },
  paymentLabel: { fontSize: 13, fontWeight: '600' },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryText: { fontSize: 14, color: Colors.onSurfaceVariant },
  discountText: { fontSize: 14, color: Colors.primary },
  discountValue: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    paddingTop: 10,
  },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  promoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promoText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  orderBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  orderBtnDisabled: { opacity: 0.5 },
  orderBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  sheetItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  sheetItemTitle: { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  sheetItemSub: { fontSize: 12, color: Colors.secondary, marginTop: 2 },
  sheetEmpty: { color: Colors.secondary, paddingVertical: 20 },
});
