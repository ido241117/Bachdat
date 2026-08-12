import { StyleSheet } from 'react-native';
import { Colors } from '../colors';

export const styles = StyleSheet.create({
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
