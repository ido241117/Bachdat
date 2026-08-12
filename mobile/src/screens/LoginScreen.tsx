import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { TopAppBar } from '../components/TopAppBar';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles/screens/LoginScreen.styles';

const PHONE_REGEX = /^\d{9,11}$/;
const RESEND_COOLDOWN = 30;

type LoginScreenProps = {
  onBack?: () => void;
  onLoggedIn?: () => void;
};

export function LoginScreen({ onBack, onLoggedIn }: LoginScreenProps = {}) {
  const { login } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
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
      const result = await login(phone, otp);
      if (result.needsName) setStep('name');
      else onLoggedIn?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  const submitName = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Tên phải có ít nhất 2 ký tự');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(phone, otp, trimmed);
      onLoggedIn?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const backToPhone = () => {
    setStep('phone');
    setOtp('');
    setName('');
    setError(null);
    setDevOtp(null);
  };

  return (
    <View style={styles.container}>
      <TopAppBar
        variant="title"
        title={
          step === 'phone'
            ? 'Đăng nhập'
            : step === 'otp'
              ? 'Nhập mã OTP'
              : 'Hoàn tất đăng ký'
        }
        subtitle={step === 'otp' ? `Mã đã gửi đến ${phone}` : undefined}
        onBack={step !== 'phone' ? backToPhone : onBack}
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
          ) : step === 'otp' ? (
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
          ) : (
            <>
              <Text style={styles.heading}>Chào bạn mới!</Text>
              <Text style={styles.subheading}>
                Nhập tên để hoàn tất tạo tài khoản
              </Text>
              <Text style={styles.label}>Tên của bạn</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Minh Anh"
                placeholderTextColor={Colors.textLight}
                autoFocus
                maxLength={40}
                value={name}
                onChangeText={setName}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (name.trim().length < 2 || loading) && styles.btnDisabled,
                ]}
                disabled={name.trim().length < 2 || loading}
                onPress={submitName}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Hoàn tất</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

