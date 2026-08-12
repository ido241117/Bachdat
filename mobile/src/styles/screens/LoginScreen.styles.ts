import { StyleSheet } from 'react-native';
import { Colors } from '../colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  body: {
    padding: 24,
    gap: 12,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  subheading: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
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
  otpInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
  },
  devHint: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  devHintText: {
    color: Colors.onSecondaryContainer,
    fontSize: 12,
    flexShrink: 1,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  resendLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  resendAction: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  resendDisabled: {
    color: Colors.textLight,
  },
});
