import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput, Modal, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { formatPrice } from '../api/format';
import { ordersApi, userApi, vouchersApi } from '../api';
import type { ApiAddress, ApiVoucher } from '../api/types';
import { TopAppBar } from '../components/TopAppBar';
import { useCart } from '../context/CartContext';
import type { PickedAddress } from '../components/AddressSearchModal';
import { MapAddressPicker } from '../components/MapAddressPicker';
import { GoongMapView } from '../components/GoongMapView';
import { useDeliveryLocation } from '../context/DeliveryLocationContext';
import { styles } from '../styles/screens/CheckoutScreen.styles';

interface Props {
  onBrowse?: () => void;
  onOrderPlaced?: (orderId: string) => void;
  onBack?: () => void;
  onOpenAddresses?: () => void;
  onOpenMapPicker?: () => void;
}

export function CheckoutScreen({
  onBrowse,
  onOrderPlaced,
  onBack,
  onOpenAddresses,
  onOpenMapPicker,
}: Props) {
  const insets = useSafeAreaInsets();
  const { location, setLocation } = useDeliveryLocation();
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
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherMsg, setVoucherMsg] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [vouchers, setVouchers] = useState<ApiVoucher[]>([]);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [note, setNote] = useState('');

  const deliveryFee = items.length > 0 ? 15000 : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  const checkoutVouchers = vouchers.filter((v) => v.type !== 'cashback');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [addrs, voucherList] = await Promise.all([
          userApi.addresses(),
          vouchersApi.list(undefined, restaurantId || undefined),
        ]);
        if (cancelled) return;
        setAddresses(addrs);
        const fromCtx =
          location?.addressId
            ? addrs.find((a) => a._id === location.addressId)
            : null;
        const def =
          fromCtx ||
          addrs.find((a) => a.isDefault) ||
          addrs[0] ||
          (location
            ? {
                _id: location.addressId || 'local',
                label: location.label,
                fullAddress: location.fullAddress,
                lat: location.lat,
                lng: location.lng,
              }
            : null);
        setAddress(def);
        setVouchers(voucherList);
      } catch {
        if (location && !cancelled) {
          setAddress({
            _id: location.addressId || 'local',
            label: location.label,
            fullAddress: location.fullAddress,
            lat: location.lat,
            lng: location.lng,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location?.addressId, location?.fullAddress]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (items.length === 0 || !voucherCode.trim()) {
        setDiscount(0);
        setVoucherError(null);
        setVoucherMsg(null);
        return;
      }
      setValidating(true);
      try {
        const result = await vouchersApi.validate(
          voucherCode.trim(),
          subtotal,
          deliveryFee,
          restaurantId || undefined,
        );
        if (cancelled) return;
        if (result.valid) {
          setDiscount(result.discount || 0);
          setVoucherError(null);
          setVoucherMsg(result.message || `Giảm ${formatPrice(result.discount)}`);
        } else {
          setDiscount(0);
          setVoucherError(result.error || 'Không áp dụng được mã này');
          setVoucherMsg(null);
        }
      } catch (err) {
        if (!cancelled) {
          setDiscount(0);
          setVoucherError(
            err instanceof Error ? err.message : 'Không kiểm tra được mã',
          );
          setVoucherMsg(null);
        }
      } finally {
        if (!cancelled) setValidating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items.length, subtotal, deliveryFee, voucherCode, restaurantId]);

  const applyCode = (code: string) => {
    const next = code.trim().toUpperCase();
    setVoucherInput(next);
    setVoucherCode(next);
    setVoucherOpen(false);
  };

  const clearVoucher = () => {
    setVoucherCode('');
    setVoucherInput('');
    setDiscount(0);
    setVoucherError(null);
    setVoucherMsg(null);
    setVoucherOpen(false);
  };
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

  const applyPickedAddress = async (picked: PickedAddress) => {
    const norm = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const existing = addresses.find((a) => {
      if (norm(a.fullAddress) === norm(picked.fullAddress)) return true;
      if (a.lat == null || a.lng == null) return false;
      const dLat = (a.lat - picked.lat) * 111_320;
      const dLng =
        (a.lng - picked.lng) *
        111_320 *
        Math.cos((picked.lat * Math.PI) / 180);
      return Math.hypot(dLat, dLng) < 40;
    });

    // Đã có sẵn → chỉ chọn lại, không tạo mới
    if (existing) {
      setAddress({
        ...existing,
        label: picked.label || existing.label,
        fullAddress: picked.fullAddress || existing.fullAddress,
        lat: picked.lat,
        lng: picked.lng,
      });
      void setLocation({
        label: picked.label || existing.label,
        fullAddress: picked.fullAddress || existing.fullAddress,
        lat: picked.lat,
        lng: picked.lng,
        addressId: existing._id,
      });
      setMapPickerOpen(false);
      return;
    }

    const optimistic: ApiAddress = {
      _id: `tmp-${Date.now()}`,
      label: picked.label,
      fullAddress: picked.fullAddress,
      lat: picked.lat,
      lng: picked.lng,
      isDefault: addresses.length === 0,
    };
    setAddress(optimistic);
    void setLocation({
      label: picked.label,
      fullAddress: picked.fullAddress,
      lat: picked.lat,
      lng: picked.lng,
    });
    setMapPickerOpen(false);
    try {
      const saved = await userApi.addAddress({
        label: picked.label,
        fullAddress: picked.fullAddress,
        lat: picked.lat,
        lng: picked.lng,
        isDefault: addresses.length === 0,
      });
      setAddress((prev) =>
        prev && prev.lat === picked.lat && prev.lng === picked.lng
          ? { ...saved, lat: picked.lat, lng: picked.lng }
          : saved,
      );
      void setLocation({
        label: saved.label,
        fullAddress: saved.fullAddress,
        lat: picked.lat,
        lng: picked.lng,
        addressId: saved._id,
      });
      setAddresses((prev) => {
        const withoutDup = prev.filter(
          (a) =>
            a._id !== saved._id &&
            norm(a.fullAddress) !== norm(saved.fullAddress),
        );
        return [saved, ...withoutDup];
      });
    } catch {
      // giữ optimistic
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
            <View style={styles.addressActions}>
              <TouchableOpacity
                onPress={() =>
                  onOpenMapPicker ? onOpenMapPicker() : setMapPickerOpen(true)
                }
              >
                <Text style={styles.changeBtn}>Chọn trên map</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  onOpenAddresses ? onOpenAddresses() : setAddressOpen(true)
                }
              >
                <Text style={styles.changeBtn}>Đã lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addressCard}
            activeOpacity={0.85}
            onPress={() =>
              onOpenAddresses ? onOpenAddresses() : setMapPickerOpen(true)
            }
          >
            <View style={styles.addressIcon}>
              <MaterialIcons name="location-on" size={22} color={Colors.primary} />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressTitle}>
                {address?.label || 'Chưa chọn điểm giao'}
              </Text>
              <Text style={styles.addressText}>
                {address?.fullAddress ||
                  'Chạm để mở bản đồ và kéo ghim (kiểu ShopeeFood)'}
              </Text>
            </View>
            <MaterialIcons name="map" size={22} color={Colors.primary} />
          </TouchableOpacity>
          {address?.lat != null && address?.lng != null ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setMapPickerOpen(true)}
            >
              <GoongMapView
                style={styles.miniMap}
                markers={[
                  {
                    id: 'dest',
                    lat: address.lat,
                    lng: address.lng,
                    label: 'Giao đến',
                    color: '#22c55e',
                  },
                ]}
                center={{ lat: address.lat, lng: address.lng }}
                zoom={15}
              />
            </TouchableOpacity>
          ) : null}
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
          {validating ? (
            <Text style={styles.voucherHint}>Đang kiểm tra mã...</Text>
          ) : null}
          {voucherMsg ? (
            <Text style={styles.voucherOk}>{voucherMsg}</Text>
          ) : null}
          {voucherError ? (
            <Text style={styles.voucherFail}>{voucherError}</Text>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.promoBtn}
          onPress={() => {
            setVoucherInput(voucherCode);
            setVoucherOpen(true);
          }}
        >
          <MaterialIcons name="confirmation-number" size={20} color={Colors.primary} />
          <Text style={styles.promoText}>
            {voucherCode && discount > 0
              ? `Mã: ${voucherCode} · -${formatPrice(discount)}`
              : voucherCode
                ? `Mã: ${voucherCode}`
                : 'Chọn / nhập mã giảm giá'}
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
            <Text style={styles.sheetTitle}>Chọn địa chỉ đã lưu</Text>
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setAddressOpen(false);
                setMapPickerOpen(true);
              }}
            >
              <Text style={[styles.sheetItemTitle, { color: Colors.primary }]}>
                + Chọn trên bản đồ
              </Text>
            </TouchableOpacity>
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

      <MapAddressPicker
        visible={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onConfirm={applyPickedAddress}
        autoLocate
        initial={
          address?.lat != null && address?.lng != null
            ? { lat: address.lat, lng: address.lng }
            : undefined
        }
      />

      <Modal visible={voucherOpen} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setVoucherOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Mã giảm giá</Text>

            <View style={styles.voucherInputRow}>
              <TextInput
                style={styles.voucherInput}
                placeholder="Nhập mã (vd: GIAM15K)"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="characters"
                value={voucherInput}
                onChangeText={setVoucherInput}
              />
              <TouchableOpacity
                style={styles.voucherApplyBtn}
                onPress={() => {
                  if (!voucherInput.trim()) {
                    Alert.alert('Thiếu mã', 'Nhập mã giảm giá trước.');
                    return;
                  }
                  applyCode(voucherInput);
                }}
              >
                <Text style={styles.voucherApplyText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.sheetItem} onPress={clearVoucher}>
              <Text style={styles.sheetItemTitle}>Không dùng mã</Text>
            </TouchableOpacity>

            {checkoutVouchers.map((v) => {
              const tooSmall = subtotal < (v.minOrderAmount || 0);
              return (
                <TouchableOpacity
                  key={v._id}
                  style={[styles.sheetItem, tooSmall && styles.sheetItemDisabled]}
                  onPress={() => applyCode(v.code)}
                >
                  <Text style={styles.sheetItemTitle}>{v.code}</Text>
                  <Text style={styles.sheetItemSub}>{v.title}</Text>
                  <Text style={styles.sheetItemSub}>
                    {v.description ||
                      (v.minOrderAmount
                        ? `Đơn tối thiểu ${formatPrice(v.minOrderAmount)}`
                        : 'Áp dụng mọi đơn')}
                  </Text>
                  {tooSmall ? (
                    <Text style={styles.voucherFail}>
                      Chưa đủ đơn tối thiểu {formatPrice(v.minOrderAmount || 0)}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
            {checkoutVouchers.length === 0 ? (
              <Text style={styles.sheetEmpty}>Chưa có mã giảm giá</Text>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

