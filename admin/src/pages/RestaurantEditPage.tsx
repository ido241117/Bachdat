import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type CategoryRow } from "../api";

export function RestaurantEditPage() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    Promise.all([api.restaurant(id), api.categories()])
      .then(([r, categories]) => {
        setName(r.name);
        setCats(categories);
        const [lng, lat] = r.location?.coordinates || [105.788, 10.045];
        setForm({
          name: r.name || "",
          address: r.address || "",
          district: r.district || "",
          city: r.city || "",
          coverImage: r.coverImage || "",
          openingHours: r.openingHours || "",
          priceLevel: r.priceLevel || "$",
          tags: (r.tags || []).join(", "),
          lat: String(lat),
          lng: String(lng),
          deliveryTimeMin: String(r.deliveryTimeMin ?? 20),
          deliveryTimeMax: String(r.deliveryTimeMax ?? 30),
          rating: String(r.rating ?? 0),
          hasFreeShip: Boolean(r.hasFreeShip),
          isPopular: Boolean(r.isPopular),
          isOpen: r.isOpen !== false,
          categoryIds: (r.categoryIds || []).map(String).join(","),
        });
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Không tải được quán"),
      );
  }, [id]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const categoryIds = String(form.categoryIds || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      await api.updateRestaurant(id, {
        name: form.name,
        address: form.address,
        district: form.district,
        city: form.city,
        coverImage: form.coverImage,
        openingHours: form.openingHours,
        priceLevel: form.priceLevel,
        tags: form.tags,
        lat: Number(form.lat),
        lng: Number(form.lng),
        deliveryTimeMin: Number(form.deliveryTimeMin),
        deliveryTimeMax: Number(form.deliveryTimeMax),
        rating: Number(form.rating),
        hasFreeShip: Boolean(form.hasFreeShip),
        isPopular: Boolean(form.isPopular),
        isOpen: Boolean(form.isOpen),
        categoryIds,
      });
      nav("/restaurants");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleCat = (catId: string) => {
    const setIds = new Set(
      String(form.categoryIds || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    );
    if (setIds.has(catId)) setIds.delete(catId);
    else setIds.add(catId);
    set("categoryIds", [...setIds].join(","));
  };

  if (!Object.keys(form).length && !error) {
    return <p className="muted">Đang tải...</p>;
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <Link to="/restaurants" className="muted">
            ← Cửa hàng
          </Link>
          <h1>Sửa · {name}</h1>
        </div>
        <Link className="btn primary" to={`/restaurants/${id}/menu`}>
          Quản lý menu
        </Link>
      </header>
      {error && <p className="error">{error}</p>}

      <section className="panel">
        <form className="form-grid" onSubmit={onSave}>
          <label>
            Tên *
            <input
              required
              value={String(form.name || "")}
              onChange={(e) => set("name", e.target.value)}
            />
          </label>
          <label>
            Tags
            <input
              value={String(form.tags || "")}
              onChange={(e) => set("tags", e.target.value)}
            />
          </label>
          <label className="span-2">
            Địa chỉ
            <input
              value={String(form.address || "")}
              onChange={(e) => set("address", e.target.value)}
            />
          </label>
          <label>
            Quận
            <input
              value={String(form.district || "")}
              onChange={(e) => set("district", e.target.value)}
            />
          </label>
          <label>
            Thành phố
            <input
              value={String(form.city || "")}
              onChange={(e) => set("city", e.target.value)}
            />
          </label>
          <label>
            Lat
            <input
              value={String(form.lat || "")}
              onChange={(e) => set("lat", e.target.value)}
            />
          </label>
          <label>
            Lng
            <input
              value={String(form.lng || "")}
              onChange={(e) => set("lng", e.target.value)}
            />
          </label>
          <label>
            Cover URL
            <input
              value={String(form.coverImage || "")}
              onChange={(e) => set("coverImage", e.target.value)}
            />
          </label>
          <label>
            Giờ mở cửa
            <input
              value={String(form.openingHours || "")}
              onChange={(e) => set("openingHours", e.target.value)}
            />
          </label>
          <label>
            Mức giá
            <select
              value={String(form.priceLevel || "$")}
              onChange={(e) => set("priceLevel", e.target.value)}
            >
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
            </select>
          </label>
          <label>
            Rating
            <input
              type="number"
              step="0.1"
              value={String(form.rating || "0")}
              onChange={(e) => set("rating", e.target.value)}
            />
          </label>
          <label>
            Giao min (phút)
            <input
              value={String(form.deliveryTimeMin || "")}
              onChange={(e) => set("deliveryTimeMin", e.target.value)}
            />
          </label>
          <label>
            Giao max (phút)
            <input
              value={String(form.deliveryTimeMax || "")}
              onChange={(e) => set("deliveryTimeMax", e.target.value)}
            />
          </label>

          <div className="span-2">
            <p className="muted small">Danh mục</p>
            <div className="checks">
              {cats.map((c) => {
                const active = String(form.categoryIds || "")
                  .split(",")
                  .includes(c._id);
                return (
                  <label key={c._id} className="check">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleCat(c._id)}
                    />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="checks span-2">
            <label className="check">
              <input
                type="checkbox"
                checked={Boolean(form.hasFreeShip)}
                onChange={(e) => set("hasFreeShip", e.target.checked)}
              />
              Freeship
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={Boolean(form.isPopular)}
                onChange={(e) => set("isPopular", e.target.checked)}
              />
              Phổ biến
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={Boolean(form.isOpen)}
                onChange={(e) => set("isOpen", e.target.checked)}
              />
              Đang mở cửa
            </label>
          </div>

          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "..." : "Lưu thay đổi"}
          </button>
        </form>
      </section>
    </div>
  );
}
