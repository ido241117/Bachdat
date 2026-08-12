import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { formatPrice } from '../api/format';
import { ordersApi, restaurantApi, type TrackingStep } from '../api';
import { goongApi, type GoongRoute } from '../api/goong';
import type { ApiOrder } from '../api/types';
import { TopAppBar } from '../components/TopAppBar';
import { GoongMapView, type MapMarker } from '../components/GoongMapView';
import { styles } from '../styles/screens/TrackingScreen.styles';

interface Props {
  orderId: string;
  onBack: () => void;
  onGoOrders: () => void;
}

const HCM = { lat: 10.7769, lng: 106.7009 };

export function TrackingScreen({ orderId, onBack, onGoOrders }: Props) {
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [steps, setSteps] = useState<TrackingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [route, setRoute] = useState<GoongRoute | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [mapCenter, setMapCenter] = useState(HCM);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const [detail, tracking] = await Promise.all([
          ordersApi.get(orderId),
          ordersApi.tracking(orderId),
        ]);
        setOrder(detail);
        setSteps(tracking.trackingSteps || []);

        let restaurantPoint = { ...HCM };
        if (detail.restaurantId) {
          try {
            const rest = await restaurantApi.getById(detail.restaurantId);
            const [lng, lat] = rest.location?.coordinates || [
              HCM.lng,
              HCM.lat,
            ];
            restaurantPoint = { lat, lng };
          } catch {
            // keep default HCM
          }
        }

        const destLat = detail.deliveryAddress?.lat;
        const destLng = detail.deliveryAddress?.lng;
        const hasDest =
          typeof destLat === 'number' &&
          typeof destLng === 'number' &&
          !Number.isNaN(destLat) &&
          !Number.isNaN(destLng);

        const deliveryPoint = hasDest
          ? { lat: destLat!, lng: destLng! }
          : restaurantPoint;

        const nextMarkers: MapMarker[] = [
          {
            id: 'restaurant',
            lat: restaurantPoint.lat,
            lng: restaurantPoint.lng,
            label: 'Quán',
            color: '#FF6B2B',
          },
        ];
        if (hasDest) {
          nextMarkers.push({
            id: 'delivery',
            lat: deliveryPoint.lat,
            lng: deliveryPoint.lng,
            label: 'Giao đến',
            color: '#22c55e',
          });
        }
        setMarkers(nextMarkers);
        setMapCenter(deliveryPoint);

        if (hasDest) {
          try {
            const dir = await goongApi.direction(
              restaurantPoint,
              deliveryPoint,
              'bike',
            );
            setRoute(dir);
          } catch {
            setRoute(null);
          }
        } else {
          setRoute(null);
        }
      } catch (err) {
        Alert.alert(
          'Lỗi',
          err instanceof Error ? err.message : 'Không tải được tracking',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const canCancel =
    order &&
    !['completed', 'cancelled', 'delivering'].includes(order.status);

  const handleCancel = () => {
    Alert.alert('Hủy đơn?', 'Bạn chắc muốn hủy đơn hàng này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy đơn',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await ordersApi.cancel(orderId);
            await load(true);
          } catch (err) {
            Alert.alert(
              'Không hủy được',
              err instanceof Error ? err.message : 'Thử lại sau',
            );
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const shortId = `#MN${orderId.slice(-6).toUpperCase()}`;

  return (
    <View style={styles.container}>
      <TopAppBar
        variant="title"
        title="Theo dõi đơn hàng"
        subtitle={shortId}
        onBack={onBack}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
          }
        >
          <View style={styles.mapCard}>
            <GoongMapView
              style={styles.map}
              markers={markers}
              route={route?.coordinates || []}
              center={mapCenter}
              zoom={13}
            />
            <View style={styles.etaBadge}>
              <Text style={styles.etaLabel}>
                {route ? 'Thời gian ước tính' : 'Trạng thái'}
              </Text>
              <Text style={styles.etaValue}>
                {route?.durationText || order?.status || '—'}
              </Text>
              {route?.distanceText ? (
                <Text style={styles.etaSub}>{route.distanceText}</Text>
              ) : null}
            </View>
          </View>

          {order?.deliveryAddress?.fullAddress ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Địa chỉ giao</Text>
              <Text style={styles.addressText}>
                {order.deliveryAddress.label} · {order.deliveryAddress.fullAddress}
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Trạng thái đơn hàng</Text>
            {steps.map((step, i) => {
              const nextDone = steps[i + 1]?.done;
              const active = step.done && (i === steps.length - 1 || !nextDone);
              return (
                <View key={step.key || i} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View
                      style={[
                        styles.dot,
                        step.done && styles.dotDone,
                        active && styles.dotActive,
                      ]}
                    >
                      {step.done && !active ? (
                        <MaterialIcons name="check" size={12} color={Colors.white} />
                      ) : active ? (
                        <View style={styles.dotPulse} />
                      ) : null}
                    </View>
                    {i < steps.length - 1 && (
                      <View
                        style={[styles.line, step.done ? styles.lineDone : null]}
                      />
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text
                      style={[
                        styles.stepLabel,
                        step.done && styles.stepLabelDone,
                        active && styles.stepLabelActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                    {step.at ? (
                      <Text style={styles.stepTime}>
                        {new Date(step.at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          {order && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tóm tắt đơn hàng</Text>
              <Text style={styles.restaurant}>{order.restaurantName}</Text>
              {order.items.map((item, idx) => (
                <View key={`${item.menuItemId}-${idx}`} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {item.quantity}x {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng</Text>
                <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.secondaryBtn} onPress={onGoOrders}>
            <Text style={styles.secondaryBtnText}>Xem danh sách đơn</Text>
          </TouchableOpacity>

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color={Colors.error} />
              ) : (
                <Text style={styles.cancelText}>Hủy đơn hàng</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

