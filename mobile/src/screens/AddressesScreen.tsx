import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { userApi } from '../api';
import type { ApiAddress } from '../api/types';
import { MapAddressPicker } from '../components/MapAddressPicker';
import type { PickedAddress } from '../components/AddressSearchModal';
import { useDeliveryLocation } from '../context/DeliveryLocationContext';
import { useAuth } from '../context/AuthContext';

interface Props {
  onBack: () => void;
  onLogin?: () => void;
  onOpenMap?: () => void;
}

export function AddressesScreen({ onBack, onLogin, onOpenMap }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { location, setLocation } = useDeliveryLocation();
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [editing, setEditing] = useState<ApiAddress | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await userApi.addresses();
      setAddresses(list);
    } catch {
      // keep
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return addresses;
    return addresses.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.fullAddress.toLowerCase().includes(q),
    );
  }, [addresses, query]);

  const current =
    addresses.find((a) => a._id === location?.addressId) ||
    addresses.find((a) => a.isDefault) ||
    addresses[0] ||
    null;

  const selectAddress = async (a: ApiAddress) => {
    await setLocation({
      label: a.label,
      fullAddress: a.fullAddress,
      lat: a.lat,
      lng: a.lng,
      addressId: a._id,
    });
    try {
      if (!a.isDefault) await userApi.updateAddress(a._id, { isDefault: true });
    } catch {
      // still selected locally
    }
    onBack();
  };

  const handleDelete = (address: ApiAddress) => {
    Alert.alert('Xoá địa chỉ', `Xoá "${address.label}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await userApi.deleteAddress(address._id);
            load();
          } catch (err) {
            Alert.alert(
              'Xoá thất bại',
              err instanceof Error ? err.message : 'Thử lại sau',
            );
          }
        },
      },
    ]);
  };

  const openAddMap = () => {
    setEditing(null);
    if (onOpenMap) {
      onOpenMap();
      return;
    }
    setMapOpen(true);
  };

  const openEditMap = (address: ApiAddress) => {
    setEditing(address);
    setMapOpen(true);
  };

  const applyPicked = async (picked: PickedAddress) => {
    if (!user) {
      await setLocation({
        label: picked.label,
        fullAddress: picked.fullAddress,
        lat: picked.lat,
        lng: picked.lng,
      });
      onBack();
      return;
    }

    try {
      if (editing) {
        const updated = await userApi.updateAddress(editing._id, {
          label: picked.label,
          fullAddress: picked.fullAddress,
          lat: picked.lat,
          lng: picked.lng,
        });
        await setLocation({
          label: updated.label,
          fullAddress: updated.fullAddress,
          lat: updated.lat,
          lng: updated.lng,
          addressId: updated._id,
        });
      } else {
        const saved = await userApi.addAddress({
          label: picked.label,
          fullAddress: picked.fullAddress,
          lat: picked.lat,
          lng: picked.lng,
          isDefault: true,
        });
        await setLocation({
          label: saved.label,
          fullAddress: saved.fullAddress,
          lat: saved.lat,
          lng: saved.lng,
          addressId: saved._id,
        });
      }
      await load();
    } catch (err) {
      Alert.alert(
        'Lưu thất bại',
        err instanceof Error ? err.message : 'Thử lại sau',
      );
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Địa chỉ giao hàng</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.guestBox}>
          <MaterialIcons name="location-on" size={40} color={Colors.primary} />
          <Text style={styles.guestTitle}>Đăng nhập để lưu địa chỉ</Text>
          <Text style={styles.guestSub}>
            Hoặc chọn vị trí trên bản đồ để giao hàng ngay.
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddMap}>
            <Text style={styles.addBtnText}>Chọn trên bản đồ</Text>
          </TouchableOpacity>
          {onLogin ? (
            <TouchableOpacity style={styles.loginBtn} onPress={onLogin}>
              <Text style={styles.loginBtnText}>Đăng nhập</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <MapAddressPicker
          visible={mapOpen}
          onClose={() => setMapOpen(false)}
          onConfirm={applyPicked}
          autoLocate
          initial={
            location
              ? { lat: location.lat, lng: location.lng }
              : undefined
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Địa chỉ giao hàng</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={openAddMap}>
          <MaterialIcons name="map" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color={Colors.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm vị trí"
            placeholderTextColor={Colors.textLight}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listBody}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            {current ? (
              <TouchableOpacity
                style={styles.currentCard}
                onPress={() => selectAddress(current)}
                activeOpacity={0.85}
              >
                <MaterialIcons name="place" size={22} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel} numberOfLines={1}>
                    {current.label}
                  </Text>
                  <Text style={styles.cardAddress} numberOfLines={2}>
                    {current.fullAddress}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => openEditMap(current)}>
                  <Text style={styles.editLink}>Sửa</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.sectionTitle}>Địa chỉ đã lưu</Text>

            {filtered.length === 0 ? (
              <Text style={styles.empty}>Chưa có địa chỉ nào</Text>
            ) : (
              filtered.map((a) => (
                <TouchableOpacity
                  key={a._id}
                  style={styles.row}
                  onPress={() => selectAddress(a)}
                  activeOpacity={0.85}
                >
                  <MaterialIcons
                    name={
                      a.label.toLowerCase().includes('nhà')
                        ? 'home'
                        : a.label.toLowerCase().includes('công ty')
                          ? 'work'
                          : 'bookmark-border'
                    }
                    size={22}
                    color={Colors.onSurfaceVariant}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardLabel} numberOfLines={1}>
                      {a.label}
                      {a.isDefault ? ' · Mặc định' : ''}
                    </Text>
                    <Text style={styles.cardAddress} numberOfLines={2}>
                      {a.fullAddress}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => openEditMap(a)}>
                    <Text style={styles.editLink}>Sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(a)}
                    style={{ paddingLeft: 8 }}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={20}
                      color={Colors.error}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <TouchableOpacity style={styles.addBtn} onPress={openAddMap}>
          <Text style={styles.addBtnText}>Thêm địa chỉ mới</Text>
        </TouchableOpacity>
      </View>

      <MapAddressPicker
        visible={mapOpen}
        onClose={() => {
          setMapOpen(false);
          setEditing(null);
        }}
        onConfirm={applyPicked}
        autoLocate={!editing}
        initial={
          editing
            ? { lat: editing.lat, lng: editing.lng }
            : location
              ? { lat: location.lat, lng: location.lng }
              : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
  },
  searchBox: {
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.onSurface },
  listBody: { padding: 16, gap: 10, paddingBottom: 120 },
  currentCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  cardLabel: { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  cardAddress: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
  editLink: {
    color: '#1A73E8',
    fontSize: 13,
    fontWeight: '600',
    paddingTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 24,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.outlineVariant,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  guestBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  guestTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
    textAlign: 'center',
  },
  guestSub: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 12,
  },
  loginBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  loginBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
