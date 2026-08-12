import { useEffect, useState } from "react";
import { api, type UserRow } from "../lib/api";

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = (query = q) =>
    api
      .users(query)
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
        <div className="row">
          <input
            placeholder="Tìm tên / SĐT..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <button type="button" className="btn ghost dark" onClick={() => load()}>
            Tìm
          </button>
        </div>
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
