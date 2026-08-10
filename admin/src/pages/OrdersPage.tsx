import { useEffect, useState } from "react";
import { api, formatVnd, type OrderRow } from "../api";

const STATUSES = [
  "all",
  "pending",
  "confirmed",
  "preparing",
  "delivering",
  "completed",
  "cancelled",
];

export function OrdersPage() {
  const [status, setStatus] = useState("all");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api
      .orders(status)
      .then(setOrders)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi tải đơn"),
      );

  useEffect(() => {
    load();
  }, [status]);

  const update = async (id: string, next: string) => {
    await api.updateOrder(id, next);
    await load();
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Đơn hàng</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </header>
      {error && <p className="error">{error}</p>}

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Quán</th>
              <th>Địa chỉ giao</th>
              <th>Tổng</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
              <th>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>
                  <strong>{o.restaurantName}</strong>
                  <div className="muted small">
                    {(o.items || [])
                      .map((i) => `${i.quantity}× ${i.name}`)
                      .join(", ")}
                  </div>
                </td>
                <td className="muted">
                  {o.deliveryAddress?.fullAddress || "—"}
                </td>
                <td>{formatVnd(o.total)}</td>
                <td>
                  <span className={`badge ${o.status}`}>{o.status}</span>
                </td>
                <td>{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) => update(o._id, e.target.value)}
                  >
                    {STATUSES.filter((s) => s !== "all").map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Chưa có đơn
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
