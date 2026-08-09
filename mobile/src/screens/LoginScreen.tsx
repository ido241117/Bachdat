import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { TopAppBar } from '../components/TopAppBar';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';

const PHONE_REGEX = /^\d{9,11}$/;
const RESEND_COOLDOWN = 30;

export function LoginScreen() {
  const { login } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown > 0]);

  const isPhoneValid = PHONE_REGEX.test(phone);

  const sendOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.requestOtp(phone);
      setDevOtp(res.otp ?? null);
      setStep('otp');
      setOtp('');
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được mã OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(phone, otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  const backToPhone = () => {
    setStep('phone');
    setOtp('');
    setError(null);
    setDevOtp(null);
  };

  return (
    <View style={styles.container}>
      <TopAppBar
        variant="title"
        title={step === 'phone' ? 'Đăng nhập' : 'Nhập mã OTP'}
        subtitle={step === 'otp' ? `Mã đã gửi đến ${phone}` : undefined}
        onBack={step === 'otp' ? backToPhone : undefined}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.body}>
          {step === 'phone' ? (
            <>
              <Text style={styles.heading}>Chào mừng đến với Mealnow</Text>
              <Text style={styles.subheading}>
                Nhập số điện thoại để tiếp tục
              </Text>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số điện thoại"
                placeholderTextColor={Colors.textLight}
                keyboardType="phone-pad"
                maxLength={11}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (!isPhoneValid || loading) && styles.btnDisabled,
                ]}
                disabled={!isPhoneValid || loading}
                onPress={sendOtp}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Gửi mã OTP</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Mã OTP (6 số)</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="••••••"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
              />
              {devOtp && (
                <View style={styles.devHint}>
                  <MaterialIcons
                    name="info-outline"
                    size={16}
                    color={Colors.onSecondaryContainer}
                  />
                  <Text style={styles.devHintText}>
                    Chế độ thử nghiệm — mã OTP: {devOtp}
                  </Text>
                </View>
              )}
              {error && <Text style={styles.errorText}>{error}</Text>}
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (otp.length < 4 || loading) && styles.btnDisabled,
                ]}
                disabled={otp.length < 4 || loading}
                onPress={verifyOtp}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Xác nhận</Text>
                )}
              </TouchableOpacity>
              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>Không nhận được mã?</Text>
                <TouchableOpacity
                  disabled={cooldown > 0 || loading}
                  onPress={sendOtp}
                >
                  <Text
                    style={[
                      styles.resendAction,
                      cooldown > 0 && styles.resendDisabled,
                    ]}
                  >
                    {cooldown > 0 ? `Gửi lại (${cooldown}s)` : 'Gửi lại'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
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
