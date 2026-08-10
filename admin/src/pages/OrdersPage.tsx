import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api
      .orders({ status, q })
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
        <div className="row">
          <input
            placeholder="Tìm quán / địa chỉ / voucher..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="button" className="btn ghost dark" onClick={load}>
            Lọc
          </button>
        </div>
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
              <th></th>
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
                <td>{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                <td>
                  <Link to={`/orders/${o._id}`}>Chi tiết</Link>
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
