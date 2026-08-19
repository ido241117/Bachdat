import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, formatVnd, type MenuRow } from "../lib/api";
import { Modal } from "../components/Modal";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  image: "",
  menuSection: "",
  sortOrder: "0",
  isFeatured: false,
  isAvailable: true,
  optionsText: "",
};

function optionsFromText(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, price] = line.split("|").map((x) => x.trim());
      return { name, price: Number(price || 0) };
    })
    .filter((o) => o.name);
}

function optionsToText(opts?: Array<{ name: string; price: number }>) {
  return (opts || []).map((o) => `${o.name}|${o.price}`).join("\n");
}

export function MenuPage() {
  const { id = "" } = useParams();
  const [items, setItems] = useState<MenuRow[]>([]);
  const [restaurantName, setRestaurantName] = useState("Quán");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<MenuRow | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (item: MenuRow) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      originalPrice: item.originalPrice ? String(item.originalPrice) : "",
      image: item.image || "",
      menuSection: item.menuSection || "mains",
      sortOrder: String(item.sortOrder ?? 0),
      isFeatured: Boolean(item.isFeatured),
      isAvailable: item.isAvailable !== false,
      optionsText: optionsToText(item.options),
    });
    setOpen(true);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const body = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      image: form.image,
      menuSection: form.menuSection,
      sortOrder: Number(form.sortOrder || 0),
      isFeatured: form.isFeatured,
      isAvailable: form.isAvailable,
      options: optionsFromText(form.optionsText),
    };
    try {
      if (editing) await api.updateMenu(editing._id, body);
      else await api.createMenu(id, body);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu món thất bại");
    }
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
        <button type="button" className="btn primary" onClick={openCreate}>
          + Thêm món
        </button>
      </header>
      {error && <p className="error">{error}</p>}

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Món</th>
              <th>Nhóm</th>
              <th>Giá</th>
              <th>Nổi bật</th>
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
                <td>
                  {formatVnd(item.price)}
                  {item.originalPrice && item.originalPrice > item.price ? (
                    <div className="muted small" style={{ textDecoration: "line-through" }}>
                      {formatVnd(item.originalPrice)}
                    </div>
                  ) : null}
                </td>
                <td>{item.isFeatured ? "Có" : "—"}</td>
                <td>{item.isAvailable === false ? "Ẩn" : "Đang bán"}</td>
                <td className="actions">
                  <button
                    type="button"
                    className="btn ghost dark"
                    onClick={() => openEdit(item)}
                  >
                    Sửa
                  </button>
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

      <Modal
        open={open}
        title={editing ? "Sửa món" : "Thêm món"}
        onClose={() => setOpen(false)}
        wide
      >
        <form className="form-grid" onSubmit={onSave}>
          <label>
            Tên *
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
            Giá gốc (khi giảm giá)
            <input
              type="number"
              min={0}
              placeholder="Để trống nếu không giảm giá"
              value={form.originalPrice}
              onChange={(e) =>
                setForm({ ...form, originalPrice: e.target.value })
              }
            />
          </label>
          <label>
            Nhóm / Tab hiển thị
            <input
              list="menu-section-options"
              value={form.menuSection}
              onChange={(e) =>
                setForm({ ...form, menuSection: e.target.value })
              }
              placeholder="VD: Bán chạy, Gà, Burger, Combo & Phụ"
            />
            <datalist id="menu-section-options">
              {Array.from(new Set(items.map((i) => i.menuSection))).map(
                (s) => (
                  <option key={s} value={s} />
                ),
              )}
            </datalist>
          </label>
          <label>
            Sort
            <input
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
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
          <label className="span-2">
            Ảnh URL
            <input
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
          </label>
          <label className="span-2">
            Options (mỗi dòng: Tên|Giá)
            <textarea
              rows={3}
              value={form.optionsText}
              onChange={(e) =>
                setForm({ ...form, optionsText: e.target.value })
              }
              placeholder={"Thêm trứng|10000\nÍt đường|0"}
            />
          </label>
          <div className="checks span-2">
            <label className="check">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm({ ...form, isFeatured: e.target.checked })
                }
              />
              Nổi bật
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) =>
                  setForm({ ...form, isAvailable: e.target.checked })
                }
              />
              Đang bán
            </label>
          </div>
          <button className="btn primary" type="submit">
            Lưu
          </button>
        </form>
      </Modal>
    </div>
  );
}
