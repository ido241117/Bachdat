import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, formatVnd, type MenuRow } from "../api";

const empty = {
  name: "",
  description: "",
  price: "",
  image: "",
  menuSection: "mains",
  isFeatured: false,
  isAvailable: true,
};

export function MenuPage() {
  const { id = "" } = useParams();
  const [items, setItems] = useState<MenuRow[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("Quán");

  const load = async () => {
    const [menu, restaurants] = await Promise.all([
      api.menu(id),
      api.restaurants(),
    ]);
    setItems(menu);
    const r = restaurants.find((x) => x._id === id);
    if (r) setRestaurantName(r.name);
  };

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Lỗi tải menu"),
    );
  }, [id]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createMenu(id, {
        ...form,
        price: Number(form.price),
      });
      setForm(empty);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thêm món thất bại");
    }
  };

  const toggleAvailable = async (item: MenuRow) => {
    await api.updateMenu(item._id, { isAvailable: !item.isAvailable });
    await load();
  };

  const remove = async (item: MenuRow) => {
    if (!confirm(`Xoá món "${item.name}"?`)) return;
    await api.deleteMenu(item._id);
    await load();
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <Link to="/restaurants" className="muted">
            ← Cửa hàng
          </Link>
          <h1>Menu · {restaurantName}</h1>
        </div>
      </header>
      {error && <p className="error">{error}</p>}

      <section className="panel">
        <h2>Thêm món</h2>
        <form className="form-grid" onSubmit={onCreate}>
          <label>
            Tên món *
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Giá *
            <input
              required
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>
          <label>
            Nhóm
            <select
              value={form.menuSection}
              onChange={(e) =>
                setForm({ ...form, menuSection: e.target.value })
              }
            >
              <option value="featured">Nổi bật</option>
              <option value="mains">Món chính</option>
              <option value="drinks">Đồ uống</option>
              <option value="desserts">Tráng miệng</option>
            </select>
          </label>
          <label>
            Ảnh (URL)
            <input
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
          </label>
          <label className="span-2">
            Mô tả
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
          <button className="btn primary" type="submit">
            Thêm món
          </button>
        </form>
      </section>

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Món</th>
              <th>Nhóm</th>
              <th>Giá</th>
              <th>Có bán</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>
                  <strong>{item.name}</strong>
                  {item.description ? (
                    <div className="muted small">{item.description}</div>
                  ) : null}
                </td>
                <td>{item.menuSection}</td>
                <td>{formatVnd(item.price)}</td>
                <td>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => toggleAvailable(item)}
                  >
                    {item.isAvailable ? "Đang bán" : "Ẩn"}
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => remove(item)}
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
