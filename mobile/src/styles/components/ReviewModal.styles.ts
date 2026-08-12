import { StyleSheet } from 'react-native';
import { Colors } from '../colors';

export const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.onSurface },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  input: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.onSurface,
    minHeight: 90,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
