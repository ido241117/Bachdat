import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
  Keyboard,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Colors } from '../constants/colors';
import {
  goongApi,
  type GoongLatLng,
  type GoongPrediction,
} from '../api/goong';
import type { PickedAddress } from './AddressSearchModal';

type Suggestion = PickedAddress & { id: string };

type Props = {
  visible?: boolean;
  asModal?: boolean;
  onClose: () => void;
  onConfirm: (address: PickedAddress) => void;
  initial?: GoongLatLng;
  title?: string;
  /** Mặc định true: mở lên tự lấy GPS làm ghim + gợi ý */
  autoLocate?: boolean;
};

const PIN_SIZE = 48;
/** Cần Thơ / An Bình — fallback khi chưa có GPS */
const DEFAULT = { lat: 10.0312, lng: 105.783 };

function buildPickerHtml(
  mapsKey: string,
  center: GoongLatLng,
  zoom: number,
  userLoc: GoongLatLng | null,
) {
  const userJs = userLoc
    ? `var USER_LNG = ${userLoc.lng}; var USER_LAT = ${userLoc.lat};`
    : 'var USER_LNG = null; var USER_LAT = null;';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <script src="https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css" rel="stylesheet" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    goongjs.accessToken = ${JSON.stringify(mapsKey)};
    var INIT_LNG = ${center.lng};
    var INIT_LAT = ${center.lat};
    var INIT_ZOOM = ${zoom};
    ${userJs}
    var mapReady = false;
    var programmatic = false;
    var userMarker = null;

    var map = new goongjs.Map({
      container: 'map',
      style: 'https://tiles.goong.io/assets/goong_map_web.json',
      center: [INIT_LNG, INIT_LAT],
      zoom: INIT_ZOOM,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: false
    });

    function post(type, payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
      }
    }

    function centerPayload() {
      var c = map.getCenter();
      return { lat: Number(c.lat), lng: Number(c.lng) };
    }

    function ensureUserDot(lng, lat) {
      if (lng == null || lat == null) return;
      if (userMarker) {
        userMarker.setLngLat([lng, lat]);
        return;
      }
      var el = document.createElement('div');
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.borderRadius = '50%';
      el.style.background = '#1A73E8';
      el.style.border = '3px solid #fff';
      el.style.boxShadow = '0 0 0 8px rgba(26,115,232,0.22)';
      userMarker = new goongjs.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
    }

    function settleInitial() {
      programmatic = true;
      map.resize();
      map.jumpTo({ center: [INIT_LNG, INIT_LAT], zoom: INIT_ZOOM });
      mapReady = true;
      programmatic = false;
      ensureUserDot(USER_LNG, USER_LAT);
      post('idle', centerPayload());
    }

    map.on('load', function () {
      setTimeout(settleInitial, 200);
    });

    map.on('movestart', function () {
      if (programmatic || !mapReady) return;
      post('movestart', {});
    });

    map.on('drag', function () {
      if (programmatic || !mapReady) return;
      post('move', centerPayload());
    });

    map.on('moveend', function () {
      if (programmatic || !mapReady) return;
      post('idle', centerPayload());
    });

    window.flyTo = function (lng, lat, z) {
      if (!mapReady) return;
      programmatic = true;
      map.jumpTo({ center: [Number(lng), Number(lat)], zoom: z || 17 });
      programmatic = false;
      post('idle', centerPayload());
    };

    window.setUserLocation = function (lng, lat) {
      USER_LNG = Number(lng);
      USER_LAT = Number(lat);
      ensureUserDot(USER_LNG, USER_LAT);
    };
  </script>
</body>
</html>`;
}

export function MapAddressPicker({
  visible = true,
  asModal = true,
  onClose,
  onConfirm,
  initial,
  title = 'Chọn địa chỉ',
  autoLocate = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const reverseSeq = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapsKey = process.env.EXPO_PUBLIC_GOONG_MAPS_KEY || '';
  const initialKey = initial
    ? `${initial.lat.toFixed(5)},${initial.lng.toFixed(5)}`
    : 'none';

  const [resolvedStart, setResolvedStart] = useState<GoongLatLng | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [layoutReady, setLayoutReady] = useState(false);
  const [center, setCenter] = useState(initial ?? DEFAULT);
  const [moving, setMoving] = useState(false);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [address, setAddress] = useState<PickedAddress | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<GoongPrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [userLoc, setUserLoc] = useState<GoongLatLng | null>(null);
  const [locating, setLocating] = useState(false);

  const active = asModal ? visible : true;
  const start = resolvedStart ?? initial ?? DEFAULT;
  const startKey = `${start.lat.toFixed(5)},${start.lng.toFixed(5)}`;

  const applySuggestions = useCallback(async (lat: number, lng: number, seq: number) => {
    setLoadingAddr(true);
    try {
      const list = await goongApi.reverseGeocodeAll(lat, lng);
      if (seq !== reverseSeq.current) return;
      const mapped: Suggestion[] = list.map((x, i) => ({
        id: x.placeId || `${x.lat}-${x.lng}-${i}`,
        label: x.label,
        fullAddress: x.fullAddress,
        lat: x.lat,
        lng: x.lng,
      }));
      setSuggestions(mapped);
      if (mapped[0]) {
        setAddress({
          label: mapped[0].label,
          fullAddress: mapped[0].fullAddress,
          lat,
          lng,
        });
      }
    } catch {
      if (seq !== reverseSeq.current) return;
      setAddress({
        label: 'Vị trí của bạn',
        fullAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng,
      });
    } finally {
      if (seq === reverseSeq.current) setLoadingAddr(false);
    }
  }, []);

  useEffect(() => {
    if (!active) {
      setLayoutReady(false);
      setResolvedStart(null);
      setBootstrapping(true);
      return;
    }

    let cancelled = false;
    reverseSeq.current += 1;
    setAddress(null);
    setSuggestions([]);
    setQuery('');
    setPredictions([]);
    setMoving(false);
    setBootstrapping(true);
    setResolvedStart(null);

    (async () => {
      let next = initial ?? DEFAULT;
      try {
        if (autoLocate) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            next = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            if (!cancelled) setUserLoc(next);
          }
        }
      } catch {
        // giữ initial / DEFAULT
      }

      if (cancelled) return;
      setCenter(next);
      setResolvedStart(next);
      setBootstrapping(false);

      const seq = ++reverseSeq.current;
      await applySuggestions(next.lat, next.lng, seq);
    })();

    return () => {
      cancelled = true;
    };
  }, [active, autoLocate, initialKey, applySuggestions]); // eslint-disable-line react-hooks/exhaustive-deps

  const html = useMemo(
    () => buildPickerHtml(mapsKey, start, 16, userLoc),
    // remount map theo vị trí GPS đã resolve (không theo userLoc muộn)
    [mapsKey, startKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!userLoc || !layoutReady) return;
    webRef.current?.injectJavaScript(
      `window.setUserLocation && window.setUserLocation(${userLoc.lng}, ${userLoc.lat}); true;`,
    );
  }, [userLoc, layoutReady]);

  const loadSuggestions = useCallback((lat: number, lng: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const seq = ++reverseSeq.current;
      setLoadingAddr(true);
      try {
        const list = await goongApi.reverseGeocodeAll(lat, lng);
        if (seq !== reverseSeq.current) return;
        const mapped: Suggestion[] = list.map((x, i) => ({
          id: x.placeId || `${x.lat}-${x.lng}-${i}`,
          label: x.label,
          fullAddress: x.fullAddress,
          lat: x.lat,
          lng: x.lng,
        }));
        setSuggestions(mapped);
        if (mapped[0]) {
          setAddress({
            label: mapped[0].label,
            fullAddress: mapped[0].fullAddress,
            lat,
            lng,
          });
        }
      } catch {
        if (seq !== reverseSeq.current) return;
        setAddress({
          label: 'Vị trí đã chọn',
          fullAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          lat,
          lng,
        });
      } finally {
        if (seq === reverseSeq.current) setLoadingAddr(false);
      }
    }, 280);
  }, []);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as {
        type: string;
        payload?: { lat?: number; lng?: number };
      };

      if (msg.type === 'movestart') {
        setMoving(true);
        return;
      }

      if (msg.type === 'move') {
        setMoving(true);
        if (msg.payload?.lat != null && msg.payload?.lng != null) {
          setCenter({ lat: msg.payload.lat, lng: msg.payload.lng });
        }
        return;
      }

      if (
        msg.type === 'idle' &&
        msg.payload?.lat != null &&
        msg.payload?.lng != null
      ) {
        const next = { lat: msg.payload.lat, lng: msg.payload.lng };
        setCenter(next);
        setMoving(false);
        const dLat = Math.abs(next.lat - start.lat) * 111_320;
        const dLng =
          Math.abs(next.lng - start.lng) *
          111_320 *
          Math.cos((next.lat * Math.PI) / 180);
        const moved = Math.hypot(dLat, dLng) > 3;
        if (moved || !address) loadSuggestions(next.lat, next.lng);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!active) return;
    const q = query.trim();
    if (q.length < 2) {
      setPredictions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const list = await goongApi.autocomplete(q, center);
        if (!cancelled) setPredictions(list);
      } catch {
        if (!cancelled) setPredictions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, active, center.lat, center.lng]);

  const flyTo = (lat: number, lng: number) => {
    setCenter({ lat, lng });
    setMoving(false);
    loadSuggestions(lat, lng);
    webRef.current?.injectJavaScript(
      `window.flyTo(${Number(lng)}, ${Number(lat)}, 17); true;`,
    );
  };

  const flyToPrediction = async (item: GoongPrediction) => {
    try {
      const detail = await goongApi.placeDetail(item.place_id);
      const { lat, lng } = detail.geometry.location;
      setQuery('');
      setPredictions([]);
      Keyboard.dismiss();
      flyTo(lat, lng);
    } catch {
      // ignore
    }
  };

  const pickSuggestion = (item: Suggestion) => {
    onConfirm({
      label: item.label,
      fullAddress: item.fullAddress,
      lat: item.lat,
      lng: item.lng,
    });
    onClose();
  };

  const recenter = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLoc(next);
      webRef.current?.injectJavaScript(
        `window.setUserLocation && window.setUserLocation(${next.lng}, ${next.lat}); true;`,
      );
      flyTo(next.lat, next.lng);
    } catch {
      // ignore
    } finally {
      setLocating(false);
    }
  };

  const confirm = () => {
    if (!address) return;
    onConfirm({
      ...address,
      lat: center.lat,
      lng: center.lng,
    });
    onClose();
  };

  const body = (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.backBtn} />
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
          {searching ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : null}
        </View>
      </View>

      {predictions.length > 0 && (
        <View style={styles.suggestBox}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={predictions}
            keyExtractor={(i) => i.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestRow}
                onPress={() => flyToPrediction(item)}
              >
                <MaterialIcons name="place" size={18} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestMain}>
                    {item.structured_formatting?.main_text || item.description}
                  </Text>
                  <Text style={styles.suggestSub} numberOfLines={1}>
                    {item.structured_formatting?.secondary_text ||
                      item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <View
        style={styles.mapWrap}
        onLayout={() => {
          if (!layoutReady) setLayoutReady(true);
        }}
      >
        {mapsKey && layoutReady && resolvedStart && !bootstrapping ? (
          <WebView
            key={`picker-${startKey}`}
            ref={webRef}
            originWhitelist={['*']}
            source={{ html }}
            style={styles.map}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
          />
        ) : (
          <View style={styles.mapFallback}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.bootText}>
              {bootstrapping ? 'Đang lấy vị trí của bạn...' : 'Đang tải bản đồ...'}
            </Text>
          </View>
        )}

        <View pointerEvents="none" style={styles.pinLayer}>
          <View style={[styles.pinAnchor, moving && styles.pinLift]}>
            <View style={styles.personPin}>
              <MaterialIcons name="person" size={22} color={Colors.white} />
            </View>
            <View style={styles.pinTip} />
            <View style={styles.pinDot} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.recenterBtn}
          onPress={recenter}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator size="small" color={Colors.onSurface} />
          ) : (
            <MaterialIcons name="my-location" size={22} color={Colors.onSurface} />
          )}
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.bottomSheet,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Địa chỉ gợi ý</Text>
        {loadingAddr && suggestions.length === 0 ? (
          <View style={styles.addrLoading}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.addrLoadingText}>Đang lấy địa chỉ...</Text>
          </View>
        ) : (
          <FlatList
            data={suggestions}
            keyExtractor={(i) => i.id}
            style={styles.suggestList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listRow}
                onPress={() => pickSuggestion(item)}
              >
                <MaterialIcons
                  name="place"
                  size={20}
                  color={Colors.onSurfaceVariant}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.listMain} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={styles.listSub} numberOfLines={2}>
                    {item.fullAddress}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyHint}>
                {moving
                  ? 'Đang di chuyển bản đồ...'
                  : 'Kéo map hoặc tìm vị trí để xem gợi ý'}
              </Text>
            }
          />
        )}
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!address || moving) && styles.confirmDisabled,
          ]}
          disabled={!address || moving}
          onPress={confirm}
        >
          <Text style={styles.confirmText}>Giao đến đây</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!asModal) return body;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {body}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  searchRow: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: Colors.white,
    zIndex: 20,
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
  suggestBox: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 108,
    maxHeight: 220,
    backgroundColor: Colors.white,
    borderRadius: 12,
    zIndex: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  suggestRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outlineVariant,
  },
  suggestMain: { fontSize: 13, fontWeight: '600', color: Colors.onSurface },
  suggestSub: { fontSize: 11, color: Colors.secondary, marginTop: 2 },
  mapWrap: { flex: 1.1, position: 'relative', minHeight: 220 },
  map: { flex: 1 },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  bootText: {
    fontSize: 13,
    color: Colors.secondary,
    textAlign: 'center',
  },
  pinLayer: { ...StyleSheet.absoluteFillObject },
  pinAnchor: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: PIN_SIZE,
    height: PIN_SIZE + 10,
    marginLeft: -PIN_SIZE / 2,
    marginTop: -(PIN_SIZE + 4),
    alignItems: 'center',
  },
  pinLift: { marginTop: -(PIN_SIZE + 16) },
  personPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primary,
    marginTop: -2,
  },
  pinDot: {
    marginTop: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  recenterBtn: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  bottomSheet: {
    flex: 0.95,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 8,
    minHeight: 260,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  suggestList: { flex: 1 },
  listRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outlineVariant,
  },
  listMain: { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  listSub: { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2, lineHeight: 16 },
  emptyHint: {
    textAlign: 'center',
    color: Colors.textSecondary,
    paddingVertical: 20,
    fontSize: 13,
  },
  addrLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  addrLoadingText: { color: Colors.secondary, fontSize: 13 },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmDisabled: { opacity: 0.5 },
  confirmText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
