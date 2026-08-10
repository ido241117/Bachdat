import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, type RestaurantRow } from "../api";
import { Modal } from "../components/Modal";

const empty = {
  name: "",
  address: "",
  district: "Ninh Kiều",
  city: "Cần Thơ",
  coverImage: "",
  lat: "10.045",
  lng: "105.788",
  priceLevel: "$",
  openingHours: "08:00 - 22:00",
  tags: "",
  deliveryTimeMin: "20",
  deliveryTimeMax: "30",
  hasFreeShip: false,
  isPopular: false,
  isOpen: true,
};

export function RestaurantsPage() {
  const [list, setList] = useState<RestaurantRow[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(empty);
  const [openCreate, setOpenCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = (query = q) =>
    api
      .restaurants(query)
      .then(setList)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi tải quán"),
      );

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createRestaurant({
        ...form,
        lat: Number(form.lat),
        lng: Number(form.lng),
        deliveryTimeMin: Number(form.deliveryTimeMin),
        deliveryTimeMax: Number(form.deliveryTimeMax),
        tags: form.tags,
      });
      setForm(empty);
      setOpenCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo quán thất bại");
    } finally {
      setSaving(false);
    }
  };

  const toggleOpen = async (r: RestaurantRow) => {
    await api.updateRestaurant(r._id, { isOpen: !r.isOpen });
    await load();
  };

  const remove = async (r: RestaurantRow) => {
    if (!confirm(`Xoá quán "${r.name}" và toàn bộ menu?`)) return;
    await api.deleteRestaurant(r._id);
    await load();
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Cửa hàng</h1>
        <div className="row">
          <input
            placeholder="Tìm quán..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <button type="button" className="btn ghost dark" onClick={() => load()}>
            Tìm
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => setOpenCreate(true)}
          >
            + Thêm quán
          </button>
        </div>
      </header>
      {error && <p className="error">{error}</p>}

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Địa chỉ</th>
              <th>Món</th>
              <th>Mở</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r._id}>
                <td>
                  <strong>{r.name}</strong>
                  <div className="muted small">
                    {(r.tags || []).join(" · ")}
                  </div>
                </td>
                <td className="muted">
                  {[r.address, r.district, r.city].filter(Boolean).join(", ")}
                </td>
                <td>{r.menuCount ?? 0}</td>
                <td>
                  <button
                    type="button"
                    className="btn ghost dark"
                    onClick={() => toggleOpen(r)}
                  >
                    {r.isOpen ? "Đang mở" : "Đóng"}
                  </button>
                </td>
                <td className="actions">
                  <Link to={`/restaurants/${r._id}`}>Sửa</Link>
                  <Link to={`/restaurants/${r._id}/menu`}>Menu</Link>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => remove(r)}
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal
        open={openCreate}
        title="Thêm quán mới"
        onClose={() => setOpenCreate(false)}
        wide
      >
        <form className="form-grid" onSubmit={onCreate}>
          <label>
            Tên quán *
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Tags (phẩy)
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </label>
          <label>
            Địa chỉ
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
          <label>
            Quận/Huyện
            <input
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </label>
          <label>
            Thành phố
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
          <label>
            Ảnh cover
            <input
              value={form.coverImage}
              onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
            />
          </label>
          <label>
            Lat
            <input
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
          </label>
          <label>
            Lng
            <input
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
            />
          </label>
          <div className="checks span-2">
            <label className="check">
              <input
                type="checkbox"
                checked={form.hasFreeShip}
                onChange={(e) =>
                  setForm({ ...form, hasFreeShip: e.target.checked })
                }
              />
              Freeship
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.isPopular}
                onChange={(e) =>
                  setForm({ ...form, isPopular: e.target.checked })
                }
              />
              Phổ biến
            </label>
          </div>
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "..." : "Tạo quán"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
