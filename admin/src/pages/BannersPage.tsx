import { useEffect, useState, type FormEvent } from "react";
import { api, type BannerRow } from "../api";
import { Modal } from "../components/Modal";

const empty = {
  title: "",
  subtitle: "",
  tag: "",
  image: "",
  linkType: "none",
  screen: "home",
  sortOrder: "0",
  isActive: true,
};

export function BannersPage() {
  const [list, setList] = useState<BannerRow[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api
      .banners()
      .then(setList)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi tải banner"),
      );

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (b: BannerRow) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || "",
      tag: b.tag || "",
      image: b.image || "",
      linkType: b.linkType || "none",
      screen: b.screen || "home",
      sortOrder: String(b.sortOrder ?? 0),
      isActive: b.isActive !== false,
    });
    setOpen(true);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    const body = {
      ...form,
      sortOrder: Number(form.sortOrder || 0),
    };
    try {
      if (editing) await api.updateBanner(editing._id, body);
      else await api.createBanner(body);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    }
  };

  const remove = async (b: BannerRow) => {
    if (!confirm(`Xoá banner "${b.title}"?`)) return;
    await api.deleteBanner(b._id);
    await load();
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Banner</h1>
        <button type="button" className="btn primary" onClick={openCreate}>
          + Thêm banner
        </button>
      </header>
      {error && <p className="error">{error}</p>}
      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Tag</th>
              <th>Màn</th>
              <th>Sort</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b._id}>
                <td>
                  <strong>{b.title}</strong>
                  <div className="muted small">{b.subtitle}</div>
                </td>
                <td>{b.tag || "—"}</td>
                <td>{b.screen}</td>
                <td>{b.sortOrder ?? 0}</td>
                <td>{b.isActive === false ? "Ẩn" : "Hiện"}</td>
                <td className="actions">
                  <button
                    type="button"
                    className="btn ghost dark"
                    onClick={() => openEdit(b)}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => remove(b)}
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
        title={editing ? "Sửa banner" : "Thêm banner"}
        onClose={() => setOpen(false)}
        wide
      >
        <form className="form-grid" onSubmit={onSave}>
          <label>
            Tiêu đề *
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label>
            Tag
            <input
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
            />
          </label>
          <label className="span-2">
            Subtitle
            <input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />
          </label>
          <label className="span-2">
            Image URL
            <input
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
          </label>
          <label>
            Link type
            <select
              value={form.linkType}
              onChange={(e) => setForm({ ...form, linkType: e.target.value })}
            >
              <option value="none">none</option>
              <option value="restaurant">restaurant</option>
              <option value="voucher">voucher</option>
              <option value="deeplink">deeplink</option>
            </select>
          </label>
          <label>
            Screen
            <select
              value={form.screen}
              onChange={(e) => setForm({ ...form, screen: e.target.value })}
            >
              <option value="home">home</option>
              <option value="rewards">rewards</option>
            </select>
          </label>
          <label>
            Sort
            <input
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
          <button className="btn primary" type="submit">
            Lưu
          </button>
        </form>
      </Modal>
    </div>
  );
}
