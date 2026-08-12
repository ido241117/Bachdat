import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./lib/auth";

const links = [
  { to: "/", label: "Tổng quan", end: true },
  { to: "/restaurants", label: "Cửa hàng" },
  { to: "/orders", label: "Đơn hàng" },
  { to: "/categories", label: "Danh mục" },
  { to: "/vouchers", label: "Voucher" },
  { to: "/banners", label: "Banner" },
  { to: "/users", label: "Người dùng" },
];

export function Shell() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>Mealnow</strong>
          <span>Admin</span>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? "nav active" : "nav")}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="who">
            <strong>{user?.name}</strong>
            <span>{user?.phone}</span>
          </div>
          <button type="button" className="btn ghost" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
