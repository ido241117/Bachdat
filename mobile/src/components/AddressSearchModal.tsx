import { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import {
  goongApi,
  type GoongLatLng,
  type GoongPrediction,
} from '../api/goong';
import { styles } from '../styles/components/AddressSearchModal.styles';

export type PickedAddress = {
  label: string;
  fullAddress: string;
  lat: number;
  lng: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (address: PickedAddress) => void;
  bias?: GoongLatLng;
};

export function AddressSearchModal({ visible, onClose, onPick, bias }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<GoongPrediction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setPredictions([]);
      setError(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const q = query.trim();
    if (q.length < 2) {
      setPredictions([]);
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await goongApi.autocomplete(q, bias);
        if (!cancelled) setPredictions(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Lỗi tìm địa chỉ');
          setPredictions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, visible, bias]);

  const select = async (item: GoongPrediction) => {
    setLoading(true);
    try {
      const detail = await goongApi.placeDetail(item.place_id);
      onPick({
        label:
          detail.name ||
          item.structured_formatting?.main_text ||
          'Địa chỉ mới',
        fullAddress: detail.formatted_address || item.description,
        lat: detail.geometry.location.lat,
        lng: detail.geometry.location.lng,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lấy được tọa độ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Tìm địa chỉ (Goong)</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={22} color={Colors.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={Colors.secondary} />
            <TextInput
              style={styles.input}
              placeholder="Nhập địa chỉ giao hàng..."
              placeholderTextColor={Colors.textLight}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {loading && <ActivityIndicator size="small" color={Colors.primary} />}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => select(item)}
              >
                <MaterialIcons
                  name="place"
                  size={20}
                  color={Colors.primary}
                />
                <View style={styles.rowText}>
                  <Text style={styles.main}>
                    {item.structured_formatting?.main_text || item.description}
                  </Text>
                  <Text style={styles.sub} numberOfLines={2}>
                    {item.structured_formatting?.secondary_text ||
                      item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !loading && query.trim().length >= 2 ? (
                <Text style={styles.empty}>Không có gợi ý</Text>
              ) : null
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

