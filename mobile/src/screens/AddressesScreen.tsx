import { useEffect, useState } from 'react';
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
import { Colors } from '../constants/colors';
import { TopAppBar } from '../components/TopAppBar';
import { userApi } from '../api';
import type { ApiAddress } from '../api/types';

interface Props {
  onBack: () => void;
}

const emptyForm = { label: '', fullAddress: '', note: '', isDefault: false };

export function AddressesScreen({ onBack }: Props) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ApiAddress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const list = await userApi.addresses();
      setAddresses(list);
    } catch {
      // keep previous list
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setMode('form');
  };

  const openEdit = (address: ApiAddress) => {
    setEditing(address);
    setForm({
      label: address.label,
      fullAddress: address.fullAddress,
      note: address.note || '',
      isDefault: Boolean(address.isDefault),
    });
    setError(null);
    setMode('form');
  };

  const backToList = () => {
    setMode('list');
    setError(null);
  };

  const handleDelete = (address: ApiAddress) => {
    Alert.alert(
      'Xoá địa chỉ',
      `Xoá "${address.label}"?`,
      [
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
      ],
    );
  };

  const handleSetDefault = async (address: ApiAddress) => {
    try {
      await userApi.updateAddress(address._id, { isDefault: true });
      load();
    } catch (err) {
      Alert.alert(
        'Không đặt được mặc định',
        err instanceof Error ? err.message : 'Thử lại sau',
      );
    }
  };

  const isFormValid = form.label.trim().length > 0 && form.fullAddress.trim().length > 0;

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const body = {
        label: form.label.trim(),
        fullAddress: form.fullAddress.trim(),
        note: form.note.trim(),
        isDefault: form.isDefault,
      };
      if (editing) {
        await userApi.updateAddress(editing._id, body);
      } else {
        await userApi.addAddress(body);
      }
      await load();
      setMode('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu địa chỉ thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'form') {
    return (
      <View style={styles.container}>
        <TopAppBar
          variant="title"
          title={editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
          onBack={backToList}
        />
        <ScrollView contentContainerStyle={styles.formBody}>
          <Text style={styles.label}>Tên gợi nhớ</Text>
          <TextInput
            style={styles.input}
            placeholder="Vd: Nhà riêng, Công ty"
            placeholderTextColor={Colors.textLight}
            value={form.label}
            onChangeText={(t) => setForm((f) => ({ ...f, label: t }))}
          />
          <Text style={styles.label}>Địa chỉ đầy đủ</Text>
          <TextInput
            style={styles.input}
            placeholder="Số nhà, đường, phường, quận..."
            placeholderTextColor={Colors.textLight}
            value={form.fullAddress}
            onChangeText={(t) => setForm((f) => ({ ...f, fullAddress: t }))}
            multiline
          />
          <Text style={styles.label}>Ghi chú</Text>
          <TextInput
            style={styles.input}
            placeholder="Vd: Giao tận cửa, gọi trước khi đến"
            placeholderTextColor={Colors.textLight}
            value={form.note}
            onChangeText={(t) => setForm((f) => ({ ...f, note: t }))}
          />
          <TouchableOpacity
            style={styles.defaultRow}
            onPress={() => setForm((f) => ({ ...f, isDefault: !f.isDefault }))}
          >
            <MaterialIcons
              name={form.isDefault ? 'check-box' : 'check-box-outline-blank'}
              size={22}
              color={Colors.primary}
            />
            <Text style={styles.defaultLabel}>Đặt làm địa chỉ mặc định</Text>
          </TouchableOpacity>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <TouchableOpacity
            style={[styles.saveBtn, (!isFormValid || saving) && styles.btnDisabled]}
            disabled={!isFormValid || saving}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Lưu địa chỉ</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopAppBar variant="title" title="Địa chỉ đã lưu" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.listBody}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loading} />
        ) : addresses.length === 0 ? (
          <Text style={styles.empty}>Chưa có địa chỉ nào</Text>
        ) : (
          addresses.map((a) => (
            <View key={a._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>{a.label}</Text>
                {a.isDefault && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Mặc định</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardAddress}>{a.fullAddress}</Text>
              {a.note ? <Text style={styles.cardNote}>{a.note}</Text> : null}
              <View style={styles.cardActions}>
                {!a.isDefault && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleSetDefault(a)}
                  >
                    <MaterialIcons name="star-outline" size={18} color={Colors.primary} />
                    <Text style={styles.actionText}>Đặt mặc định</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(a)}>
                  <MaterialIcons name="edit" size={18} color={Colors.onSurfaceVariant} />
                  <Text style={styles.actionTextMuted}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(a)}>
                  <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
                  <Text style={styles.actionTextError}>Xoá</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <MaterialIcons name="add" size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>Thêm địa chỉ mới</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listBody: { padding: 16, gap: 12, paddingBottom: 100 },
  loading: { marginTop: 40 },
  empty: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 40,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  badge: {
    backgroundColor: Colors.primaryFixed,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  cardAddress: { fontSize: 13, color: Colors.onSurfaceVariant },
  cardNote: { fontSize: 12, color: Colors.textLight },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    paddingTop: 10,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  actionTextMuted: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant },
  actionTextError: { fontSize: 12, fontWeight: '600', color: Colors.error },
  footer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  formBody: { padding: 20, gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.outline,
    color: Colors.text,
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  defaultLabel: { fontSize: 14, color: Colors.text },
  errorText: { color: Colors.error, fontSize: 13, marginTop: 8 },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  btnDisabled: { opacity: 0.5 },
  saveBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
