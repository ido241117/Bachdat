import { useEffect, useState } from "react";
import { api, type UserRow } from "../api";

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api
      .users()
      .then(setUsers)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi tải users"),
      );

  useEffect(() => {
    load();
  }, []);

  const setRole = async (u: UserRow, role: string) => {
    try {
      await api.setRole(u._id, role);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không đổi được role");
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Người dùng</h1>
        <span className="muted">{users.length} tài khoản</span>
      </header>
      {error && <p className="error">{error}</p>}
      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Tên</th>
              <th>SĐT</th>
              <th>Hạng</th>
              <th>Điểm</th>
              <th>Role</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.phone}</td>
                <td>{u.tier}</td>
                <td>{u.points}</td>
                <td>
                  <select
                    value={u.role || "user"}
                    onChange={(e) => setRole(u, e.target.value)}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
