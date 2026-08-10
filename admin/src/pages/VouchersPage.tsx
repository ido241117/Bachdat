import { useEffect, useState, type FormEvent } from "react";
import { api, formatVnd, type VoucherRow } from "../api";
import { Modal } from "../components/Modal";

const empty = {
  code: "",
  title: "",
  type: "discount_percent",
  value: "",
  maxDiscount: "",
  minOrderAmount: "0",
  totalLimit: "",
  filterTag: "discount",
  description: "",
  expiresAt: "",
  isActive: true,
};

export function VouchersPage() {
  const [list, setList] = useState<VoucherRow[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<VoucherRow | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api
      .vouchers()
      .then(setList)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi tải voucher"),
      );

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (v: VoucherRow) => {
    setEditing(v);
    setForm({
      code: v.code,
      title: v.title,
      type: v.type,
      value: String(v.value),
      maxDiscount: v.maxDiscount != null ? String(v.maxDiscount) : "",
      minOrderAmount: String(v.minOrderAmount ?? 0),
      totalLimit: v.totalLimit != null ? String(v.totalLimit) : "",
      filterTag: v.filterTag || "discount",
      description: v.description || "",
      expiresAt: v.expiresAt ? v.expiresAt.slice(0, 10) : "",
      isActive: v.isActive !== false,
    });
    setOpen(true);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    const body = {
      code: form.code,
      title: form.title,
      type: form.type,
      value: Number(form.value),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      minOrderAmount: Number(form.minOrderAmount || 0),
      totalLimit: form.totalLimit ? Number(form.totalLimit) : undefined,
      filterTag: form.filterTag,
      description: form.description,
      expiresAt: form.expiresAt || undefined,
      isActive: form.isActive,
    };
    try {
      if (editing) await api.updateVoucher(editing._id, body);
      else await api.createVoucher(body);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    }
  };

  const remove = async (v: VoucherRow) => {
    if (!confirm(`Xoá voucher ${v.code}?`)) return;
    await api.deleteVoucher(v._id);
    await load();
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Voucher</h1>
        <button type="button" className="btn primary" onClick={openCreate}>
          + Thêm voucher
        </button>
      </header>
      {error && <p className="error">{error}</p>}
      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Tiêu đề</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Đã dùng</th>
              <th>Hết hạn</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v._id}>
                <td>
                  <strong>{v.code}</strong>
                  <div className="muted small">
                    {v.isActive === false ? "Tắt" : "Active"}
                  </div>
                </td>
                <td>{v.title}</td>
                <td>{v.type}</td>
                <td>
                  {v.type.includes("percent") || v.type === "cashback"
                    ? `${v.value}%`
                    : formatVnd(v.value)}
                </td>
                <td>
                  {v.usedCount ?? 0}
                  {v.totalLimit != null ? ` / ${v.totalLimit}` : ""}
                </td>
                <td className="muted">
                  {v.expiresAt
                    ? new Date(v.expiresAt).toLocaleDateString("vi-VN")
                    : "—"}
                </td>
                <td className="actions">
                  <button
                    type="button"
                    className="btn ghost dark"
                    onClick={() => openEdit(v)}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => remove(v)}
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
        title={editing ? "Sửa voucher" : "Thêm voucher"}
        onClose={() => setOpen(false)}
        wide
      >
        <form className="form-grid" onSubmit={onSave}>
          <label>
            Code *
            <input
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </label>
          <label>
            Tiêu đề *
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label>
            Loại
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="discount_percent">% giảm</option>
              <option value="discount_fixed">Giảm cố định</option>
              <option value="freeship">Freeship</option>
              <option value="cashback">Cashback %</option>
            </select>
          </label>
          <label>
            Giá trị *
            <input
              required
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </label>
          <label>
            Max giảm
            <input
              value={form.maxDiscount}
              onChange={(e) =>
                setForm({ ...form, maxDiscount: e.target.value })
              }
            />
          </label>
          <label>
            Đơn tối thiểu
            <input
              value={form.minOrderAmount}
              onChange={(e) =>
                setForm({ ...form, minOrderAmount: e.target.value })
              }
            />
          </label>
          <label>
            Giới hạn dùng
            <input
              value={form.totalLimit}
              onChange={(e) => setForm({ ...form, totalLimit: e.target.value })}
            />
          </label>
          <label>
            Hết hạn
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
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
