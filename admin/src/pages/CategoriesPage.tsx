import { useEffect, useState, type FormEvent } from "react";
import { api, type CategoryRow } from "../lib/api";
import { Modal } from "../components/Modal";

const empty = {
  name: "",
  icon: "restaurant",
  sortOrder: "0",
  isActive: true,
};

export function CategoriesPage() {
  const [list, setList] = useState<CategoryRow[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api
      .categories()
      .then(setList)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi tải danh mục"),
      );

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (c: CategoryRow) => {
    setEditing(c);
    setForm({
      name: c.name,
      icon: c.icon || "restaurant",
      sortOrder: String(c.sortOrder ?? 0),
      isActive: c.isActive !== false,
    });
    setOpen(true);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    const body = {
      name: form.name,
      icon: form.icon,
      sortOrder: Number(form.sortOrder || 0),
      isActive: form.isActive,
    };
    try {
      if (editing) await api.updateCategory(editing._id, body);
      else await api.createCategory(body);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    }
  };

  const remove = async (c: CategoryRow) => {
    if (!confirm(`Xoá danh mục "${c.name}"?`)) return;
    await api.deleteCategory(c._id);
    await load();
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Danh mục</h1>
        <button type="button" className="btn primary" onClick={openCreate}>
          + Thêm
        </button>
      </header>
      {error && <p className="error">{error}</p>}
      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Slug</th>
              <th>Icon</th>
              <th>Sort</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td className="muted">{c.slug}</td>
                <td>{c.icon}</td>
                <td>{c.sortOrder ?? 0}</td>
                <td>{c.isActive === false ? "Ẩn" : "Hiện"}</td>
                <td className="actions">
                  <button
                    type="button"
                    className="btn ghost dark"
                    onClick={() => openEdit(c)}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => remove(c)}
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
        title={editing ? "Sửa danh mục" : "Thêm danh mục"}
        onClose={() => setOpen(false)}
      >
        <form className="form-grid" onSubmit={onSave}>
          <label className="span-2">
            Tên *
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Icon
            <input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
          </label>
          <label>
            Sort
            <input
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </label>
          <label className="check span-2">
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
