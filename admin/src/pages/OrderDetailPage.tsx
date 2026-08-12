import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, formatVnd, type OrderRow } from "../lib/api";

const STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "delivering",
  "completed",
  "cancelled",
];

export function OrderDetailPage() {
  const { id = "" } = useParams();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api
      .order(id)
      .then(setOrder)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Không tải được đơn"),
      );

  useEffect(() => {
    load();
  }, [id]);

  const update = async (status: string) => {
    await api.updateOrder(id, status);
    await load();
  };

  if (error) return <p className="error">{error}</p>;
  if (!order) return <p className="muted">Đang tải...</p>;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <Link to="/orders" className="muted">
            ← Đơn hàng
          </Link>
          <h1>Đơn #{order._id.slice(-6)}</h1>
        </div>
        <select
          value={order.status}
          onChange={(e) => update(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </header>

      <div className="grid-2">
        <section className="panel">
          <h2>Thông tin</h2>
          <ul className="kv">
            <li>
              <span>Quán</span>
              <strong>{order.restaurantName}</strong>
            </li>
            <li>
              <span>Khách</span>
              <strong>
                {order.user?.name || "—"} {order.user?.phone || ""}
              </strong>
            </li>
            <li>
              <span>Thanh toán</span>
              <strong>{order.paymentMethod}</strong>
            </li>
            <li>
              <span>Voucher</span>
              <strong>{order.voucherCode || "—"}</strong>
            </li>
            <li>
              <span>Ghi chú</span>
              <strong>{order.note || "—"}</strong>
            </li>
            <li>
              <span>Tạo lúc</span>
              <strong>{new Date(order.createdAt).toLocaleString("vi-VN")}</strong>
            </li>
          </ul>
        </section>
        <section className="panel">
          <h2>Giao hàng</h2>
          <p>
            <strong>{order.deliveryAddress?.label}</strong>
          </p>
          <p className="muted">{order.deliveryAddress?.fullAddress}</p>
          {order.deliveryAddress?.note ? (
            <p className="muted small">Note: {order.deliveryAddress.note}</p>
          ) : null}
          <h2 style={{ marginTop: 16 }}>Tracking</h2>
          <ul className="kv">
            {(order.trackingSteps || []).map((s) => (
              <li key={s.key}>
                <span>
                  {s.done ? "✓" : "○"} {s.label}
                </span>
                <strong>
                  {s.at ? new Date(s.at).toLocaleString("vi-VN") : ""}
                </strong>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h2>Món</h2>
        <table>
          <thead>
            <tr>
              <th>Tên</th>
              <th>SL</th>
              <th>Giá</th>
              <th>Tạm tính</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item, i) => (
              <tr key={`${item.name}-${i}`}>
                <td>
                  {item.name}
                  {item.options?.length ? (
                    <div className="muted small">{item.options.join(", ")}</div>
                  ) : null}
                </td>
                <td>{item.quantity}</td>
                <td>{formatVnd(item.price)}</td>
                <td>{formatVnd(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="kv" style={{ marginTop: 12 }}>
          <li>
            <span>Tạm tính</span>
            <strong>{formatVnd(order.subtotal)}</strong>
          </li>
          <li>
            <span>Ship</span>
            <strong>{formatVnd(order.deliveryFee)}</strong>
          </li>
          <li>
            <span>Giảm</span>
            <strong>-{formatVnd(order.discount)}</strong>
          </li>
          <li>
            <span>Tổng</span>
            <strong>{formatVnd(order.total)}</strong>
          </li>
        </ul>
      </section>
    </div>
  );
}
