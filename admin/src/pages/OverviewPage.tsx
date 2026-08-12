import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatVnd, type Stats } from "../lib/api";

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
    { label: "Voucher", value: String(stats.counts.vouchers ?? 0) },
    { label: "Banner", value: String(stats.counts.banners ?? 0) },
  ];

  const maxRev = Math.max(
    1,
    ...(stats.last7Days || []).map((d) => d.revenue),
  );

  return (
    <div className="page">
      <header className="page-head">
        <h1>Tổng quan</h1>
      </header>
      <div className="stat-grid four">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <span className="muted">{c.label}</span>
            <strong>{c.value}</strong>
          </div>
        ))}
      </div>

      <section className="panel">
        <h2>Doanh thu 7 ngày gần nhất</h2>
        <div className="bars">
          {(stats.last7Days || []).map((d) => (
            <div key={d.date} className="bar-col">
              <div
                className="bar"
                style={{ height: `${Math.max(4, (d.revenue / maxRev) * 120)}px` }}
                title={formatVnd(d.revenue)}
              />
              <span className="bar-label">{d.date.slice(5)}</span>
              <span className="muted small">{d.orders} đơn</span>
            </div>
          ))}
        </div>
      </section>

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
              <li key={String(r._id)}>
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
              <th></th>
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
                <td>
                  <Link to={`/orders/${o._id}`}>Chi tiết</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
