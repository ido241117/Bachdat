import { useEffect, useState } from "react";
import { api, formatVnd, type Stats } from "../api";

export function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .stats()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi tải thống kê"),
      );
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p className="muted">Đang tải...</p>;

  const cards = [
    { label: "Doanh thu tổng", value: formatVnd(stats.revenue.all) },
    { label: "Doanh thu hôm nay", value: formatVnd(stats.revenue.today) },
    { label: "Doanh thu tháng", value: formatVnd(stats.revenue.month) },
    { label: "Đơn hoàn thành", value: String(stats.revenue.completedOrders) },
    { label: "Cửa hàng", value: String(stats.counts.restaurants) },
    { label: "Người dùng", value: String(stats.counts.users) },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <h1>Tổng quan</h1>
      </header>
      <div className="stat-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <span className="muted">{c.label}</span>
            <strong>{c.value}</strong>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <section className="panel">
          <h2>Đơn theo trạng thái</h2>
          <ul className="kv">
            {Object.entries(stats.counts.ordersByStatus).map(([k, v]) => (
              <li key={k}>
                <span>{k}</span>
                <strong>{v}</strong>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h2>Top quán (doanh thu)</h2>
          <ul className="kv">
            {stats.topRestaurants.map((r) => (
              <li key={r._id}>
                <span>{r.name || "—"}</span>
                <strong>{formatVnd(r.revenue)}</strong>
              </li>
            ))}
            {stats.topRestaurants.length === 0 && (
              <li className="muted">Chưa có đơn hoàn thành</li>
            )}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h2>Đơn gần đây</h2>
        <table>
          <thead>
            <tr>
              <th>Quán</th>
              <th>Trạng thái</th>
              <th>Tổng</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentOrders.map((o) => (
              <tr key={o._id}>
                <td>{o.restaurantName}</td>
                <td>
                  <span className={`badge ${o.status}`}>{o.status}</span>
                </td>
                <td>{formatVnd(o.total)}</td>
                <td>{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
