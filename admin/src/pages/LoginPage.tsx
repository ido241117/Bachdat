import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

export function LoginPage() {
  const { login } = useAuth();
  const [phone, setPhone] = useState("0909999999");
  const [otp, setOtp] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const sendOtp = async () => {
    setError(null);
    try {
      const res = await api.requestOtp(phone);
      setHint(res.otp ? `OTP dev: ${res.otp}` : "OTP đã gửi");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi OTP thất bại");
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(phone, otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>Mealnow Admin</h1>
        <p className="muted">Quản lý quán, món, đơn hàng và doanh thu</p>
        <label>
          Số điện thoại
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            maxLength={11}
          />
        </label>
        <label>
          OTP
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            maxLength={6}
          />
        </label>
        {hint && <p className="hint">{hint}</p>}
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button type="button" className="btn ghost" onClick={sendOtp}>
            Gửi OTP
          </button>
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? "..." : "Đăng nhập"}
          </button>
        </div>
        <p className="muted small">
          Seed mặc định: <code>0909999999</code> / OTP <code>123456</code>
        </p>
      </form>
    </div>
  );
}
