import { useMemo } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../constants/colors';

export type MapMarker = {
  id: string;
  lng: number;
  lat: number;
  label?: string;
  color?: string;
};

type Props = {
  markers?: MapMarker[];
  /** Route as [lng, lat][] */
  route?: [number, number][];
  center?: { lng: number; lat: number };
  zoom?: number;
  style?: object;
};

function buildHtml(opts: {
  mapsKey: string;
  markers: MapMarker[];
  route: [number, number][];
  center: { lng: number; lat: number };
  zoom: number;
}) {
  const { mapsKey, markers, route, center, zoom } = opts;
  const payload = JSON.stringify({ markers, route, center, zoom });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <script src="https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css" rel="stylesheet" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
    .marker-label {
      background: #fff; border-radius: 8px; padding: 4px 8px;
      font: 600 11px/1.2 system-ui, sans-serif; color: #222;
      box-shadow: 0 2px 8px rgba(0,0,0,.15); white-space: nowrap;
      transform: translateY(-28px);
    }
    .pin {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    goongjs.accessToken = ${JSON.stringify(mapsKey)};
    var data = ${payload};
    var map = new goongjs.Map({
      container: 'map',
      style: 'https://tiles.goong.io/assets/goong_map_web.json',
      center: [data.center.lng, data.center.lat],
      zoom: data.zoom
    });

    map.on('load', function () {
      if (data.route && data.route.length > 1) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: data.route }
          }
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#FF6B2B', 'line-width': 4 }
        });
        var bounds = new goongjs.LngLatBounds(data.route[0], data.route[0]);
        data.route.forEach(function (c) { bounds.extend(c); });
        map.fitBounds(bounds, { padding: 48, maxZoom: 15 });
      }

      (data.markers || []).forEach(function (m) {
        var el = document.createElement('div');
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
        if (m.label) {
          var lab = document.createElement('div');
          lab.className = 'marker-label';
          lab.textContent = m.label;
          el.appendChild(lab);
        }
        var pin = document.createElement('div');
        pin.className = 'pin';
        pin.style.background = m.color || '#FF6B2B';
        el.appendChild(pin);
        new goongjs.Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .addTo(map);
      });
    });
  </script>
</body>
</html>`;
}

export function GoongMapView({
  markers = [],
  route = [],
  center,
  zoom = 13,
  style,
}: Props) {
  const mapsKey = process.env.EXPO_PUBLIC_GOONG_MAPS_KEY || '';

  const resolvedCenter = center ||
    (route[0] && { lng: route[0][0], lat: route[0][1] }) ||
    (markers[0] && { lng: markers[0].lng, lat: markers[0].lat }) || {
      lng: 106.7009,
      lat: 10.7769,
    };

  const html = useMemo(
    () =>
      buildHtml({
        mapsKey,
        markers,
        route,
        center: resolvedCenter,
        zoom,
      }),
    // stringify deps for stable rebuild when arrays change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapsKey, JSON.stringify(markers), JSON.stringify(route), resolvedCenter.lng, resolvedCenter.lat, zoom],
  );

  if (!mapsKey) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>Thiếu GOONG maps key</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: Colors.surfaceContainerHigh },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  fallbackText: { color: Colors.secondary },
});
