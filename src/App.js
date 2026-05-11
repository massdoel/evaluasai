import { useState, useEffect, useCallback } from "react";

// ── Utilities ──────────────────────────────────────────────────────────────────
const toDateStr = (d = new Date()) => d.toISOString().slice(0, 10);
const toTimeStr = (d = new Date()) => d.toTimeString().slice(0, 5);

function durMins(a, b) {
  if (!a || !b) return 0;
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  const diff = bh * 60 + bm - (ah * 60 + am);
  return diff > 0 ? diff : 0;
}

function durLabel(mins) {
  if (!mins) return "–";
  return mins >= 60 ? `${Math.floor(mins / 60)}j ${mins % 60}m` : `${mins}m`;
}

const STORAGE_KEY = "evaluasi_harian_react";
const KATEGORI = ["Produktivitas", "Kesehatan", "Belajar", "Ibadah", "Sosial", "Hiburan", "Lainnya"];
const STATUS_LIST = ["Selesai", "Sedang berjalan", "Ditunda", "Dibatalkan"];
const MOOD_LIST = ["Semangat", "Fokus", "Lelah", "Santai", "Stres", "Puas"];
const STAR_LABELS = ["", "Sangat buruk", "Kurang", "Cukup", "Baik", "Sangat baik"];

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveData(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    "Selesai": "badge-green",
    "Sedang berjalan": "badge-blue",
    "Ditunda": "badge-amber",
    "Dibatalkan": "badge-red",
  };
  return <span className={`badge ${map[status] || "badge-gray"}`}>{status}</span>;
}

function StarRow({ value, onChange }) {
  return (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map((v) => (
        <span
          key={v}
          className={`star ${v <= value ? "on" : ""}`}
          onClick={() => onChange(v === value ? 0 : v)}
        >★</span>
      ))}
      <span className="star-label">{value ? STAR_LABELS[value] : "Belum dinilai"}</span>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-val">{value}</div>
    </div>
  );
}

function Toast({ msg }) {
  return msg ? <div className="toast show">{msg}</div> : null;
}

// ── Form Tab ───────────────────────────────────────────────────────────────────
function FormTab({ onSave }) {
  const now = new Date();
  const t = toTimeStr(now);
  const [form, setForm] = useState({
    nama: "", kategori: "Produktivitas", mulai: t, selesai: t,
    status: "Selesai", nilai: 0, mood: "", catatan: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function handleSave() {
    if (!form.nama.trim()) { alert("Nama kegiatan wajib diisi."); return; }
    onSave({ ...form, id: Date.now(), tanggal: toDateStr(now) });
    setForm({ nama: "", kategori: "Produktivitas", mulai: t, selesai: t, status: "Selesai", nilai: 0, mood: "", catatan: "" });
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Catat Kegiatan Baru</span>
      </div>
      <div className="form-body">
        <div className="grid-2">
          <div className="field">
            <label>Nama kegiatan</label>
            <input
              value={form.nama}
              onChange={(e) => set("nama", e.target.value)}
              placeholder="cth: Olahraga pagi"
            />
          </div>
          <div className="field">
            <label>Kategori</label>
            <select value={form.kategori} onChange={(e) => set("kategori", e.target.value)}>
              {KATEGORI.map((k) => <option key={k}>{k}</option>)}
            </select>
          </div>
        </div>

        <div className="grid-3">
          <div className="field">
            <label>Waktu mulai</label>
            <input type="time" value={form.mulai} onChange={(e) => set("mulai", e.target.value)} />
          </div>
          <div className="field">
            <label>Waktu selesai</label>
            <input type="time" value={form.selesai} onChange={(e) => set("selesai", e.target.value)} />
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_LIST.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Penilaian diri (1–5)</label>
          <StarRow value={form.nilai} onChange={(v) => set("nilai", v)} />
        </div>

        <div className="field">
          <label>Mood setelah kegiatan</label>
          <div className="mood-row">
            {MOOD_LIST.map((m) => (
              <button
                key={m}
                className={`mood-btn ${form.mood === m ? "selected" : ""}`}
                onClick={() => set("mood", form.mood === m ? "" : m)}
              >{m}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Catatan tambahan</label>
          <textarea
            value={form.catatan}
            onChange={(e) => set("catatan", e.target.value)}
            placeholder="Apa yang berjalan baik? Apa yang bisa diperbaiki?"
          />
        </div>

        <div className="action-row">
          <button className="btn-primary" onClick={handleSave}>✓ Simpan Kegiatan</button>
          <button className="btn-secondary" onClick={() =>
            setForm({ nama: "", kategori: "Produktivitas", mulai: t, selesai: t, status: "Selesai", nilai: 0, mood: "", catatan: "" })
          }>Reset</button>
        </div>
      </div>
    </div>
  );
}

// ── Laporan Tab ────────────────────────────────────────────────────────────────
function LaporanTab({ data, onDelete }) {
  const today = toDateStr();
  const todayData = data.filter((d) => d.tanggal === today);

  const total = todayData.length;
  const selesai = todayData.filter((d) => d.status === "Selesai").length;
  const berNilai = todayData.filter((d) => d.nilai > 0);
  const avgNilai = berNilai.length
    ? (berNilai.reduce((s, d) => s + d.nilai, 0) / berNilai.length).toFixed(1)
    : "–";
  const totalMins = todayData.reduce((s, d) => s + durMins(d.mulai, d.selesai), 0);
  const pct = total ? Math.round((selesai / total) * 100) : 0;

  return (
    <div>
      <div className="metric-grid">
        <MetricCard label="Total kegiatan" value={total} />
        <MetricCard label="Selesai" value={selesai} />
        <MetricCard label="Rata-rata nilai" value={avgNilai} />
        <MetricCard label="Total waktu" value={durLabel(totalMins)} />
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Progres penyelesaian</div>
        <div className="prog-meta">
          <span>{selesai} dari {total} kegiatan selesai</span>
          <span style={{ fontWeight: 600 }}>{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Daftar kegiatan hari ini</span>
        </div>
        {!todayData.length ? (
          <p className="empty-msg">Belum ada kegiatan hari ini. Tambahkan di tab "Tambah Kegiatan".</p>
        ) : (
          [...todayData].reverse().map((d) => (
            <div key={d.id} className="entry-row">
              <span className="entry-time">{d.mulai || "–"}{d.selesai ? "–" + d.selesai : ""}</span>
              <span className="entry-name">{d.nama}</span>
              <StatusBadge status={d.status} />
              <span className="entry-kat">{d.kategori}</span>
              <span className="entry-stars">
                {d.nilai ? "★".repeat(d.nilai) + "☆".repeat(5 - d.nilai) : "–"}
              </span>
              <span className="entry-dur">{durLabel(durMins(d.mulai, d.selesai))}</span>
              <button className="btn-del" onClick={() => onDelete(d.id)} title="Hapus">🗑</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Semua Data Tab ─────────────────────────────────────────────────────────────
function RingkasanTab({ data, onDelete }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Semua Data Kegiatan</span>
        <span style={{ fontSize: 12, color: "#888" }}>{data.length} entri</span>
      </div>
      {!data.length ? (
        <p className="empty-msg">Belum ada data.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kegiatan</th>
                <th>Kategori</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th>Durasi</th>
                <th>Status</th>
                <th>Nilai</th>
                <th>Mood</th>
                <th>Catatan</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.id}>
                  <td>{d.tanggal}</td>
                  <td><strong>{d.nama}</strong></td>
                  <td>{d.kategori}</td>
                  <td>{d.mulai || "–"}</td>
                  <td>{d.selesai || "–"}</td>
                  <td>{durLabel(durMins(d.mulai, d.selesai))}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td style={{ color: "#EF9F27" }}>{d.nilai ? "★".repeat(d.nilai) : "–"}</td>
                  <td>{d.mood || "–"}</td>
                  <td style={{ fontSize: 12, color: "#888", maxWidth: 140 }}>{d.catatan || "–"}</td>
                  <td>
                    <button className="btn-del" onClick={() => onDelete(d.id)} title="Hapus">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Export CSV ─────────────────────────────────────────────────────────────────
function exportCSV(data) {
  if (!data.length) { alert("Belum ada data untuk diekspor."); return; }
  const headers = [
    "Tanggal", "Kegiatan", "Kategori", "Waktu Mulai", "Waktu Selesai",
    "Durasi (menit)", "Status", "Nilai (1-5)", "Mood", "Catatan"
  ];
  const rows = data.map((d) => [
    d.tanggal, d.nama, d.kategori,
    d.mulai || "", d.selesai || "",
    durMins(d.mulai, d.selesai),
    d.status, d.nilai || "", d.mood || "",
    `"${(d.catatan || "").replace(/"/g, '""')}"`,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `evaluasi_harian_${toDateStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f5f4f0;
    color: #1a1a18;
    min-height: 100vh;
  }
  .app { max-width: 900px; margin: 0 auto; padding: 2rem 1.25rem; }

  /* Header */
  .app-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; }
  .app-date { font-size: 12px; color: #888; margin-bottom: 4px; }
  .app-title { font-size: 24px; font-weight: 700; color: #1a1a18; }

  /* Tabs */
  .tabs { display: flex; gap: 2px; margin-bottom: 1.5rem; border-bottom: 1px solid #e0dfd8; }
  .tab { padding: 9px 18px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; background: none; color: #888; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 0.15s; font-family: inherit; }
  .tab.active { color: #1a1a18; border-bottom-color: #1a1a18; }
  .tab:hover:not(.active) { color: #444; }

  /* Buttons */
  .btn-export { background: #eaf3de; color: #3b6d11; border: 1px solid #c0dd97; padding: 9px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background 0.15s; font-family: inherit; }
  .btn-export:hover { background: #c0dd97; }
  .btn-primary { background: #1a1a18; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: background 0.15s; }
  .btn-primary:hover { background: #333; }
  .btn-secondary { background: none; border: 1px solid #e0dfd8; padding: 10px 22px; border-radius: 8px; font-size: 14px; cursor: pointer; color: #1a1a18; font-family: inherit; transition: background 0.15s; }
  .btn-secondary:hover { background: #f0efe8; }
  .btn-del { background: none; border: none; cursor: pointer; color: #ccc; font-size: 15px; padding: 0 2px; transition: color 0.15s; }
  .btn-del:hover { color: #E24B4A; }

  /* Card */
  .card { background: #fff; border: 1px solid #e8e7e0; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 12px; }
  .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .card-title { font-size: 15px; font-weight: 600; color: #1a1a18; }

  /* Form */
  .form-body { display: flex; flex-direction: column; gap: 16px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field label { font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .field input, .field select, .field textarea {
    font-size: 14px; padding: 9px 11px; border: 1px solid #e0dfd8;
    border-radius: 8px; background: #fafaf8; color: #1a1a18;
    outline: none; transition: border-color 0.15s; font-family: inherit;
  }
  .field input:focus, .field select:focus, .field textarea:focus { border-color: #888; }
  .field textarea { resize: vertical; min-height: 72px; }
  .action-row { display: flex; gap: 8px; padding-top: 4px; }

  /* Stars */
  .star-row { display: flex; align-items: center; gap: 3px; padding: 4px 0; }
  .star { font-size: 26px; cursor: pointer; color: #ddd; transition: color 0.1s; user-select: none; line-height: 1; }
  .star.on { color: #EF9F27; }
  .star-label { font-size: 12px; color: #888; margin-left: 10px; }

  /* Mood */
  .mood-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .mood-btn { padding: 5px 14px; border: 1px solid #e0dfd8; border-radius: 20px; font-size: 13px; cursor: pointer; background: none; color: #666; transition: all 0.15s; font-family: inherit; }
  .mood-btn.selected { border-color: #185FA5; background: #e6f1fb; color: #185FA5; font-weight: 500; }
  .mood-btn:hover:not(.selected) { background: #f5f4f0; }

  /* Metrics */
  .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
  .metric-card { background: #fafaf8; border: 1px solid #e8e7e0; border-radius: 10px; padding: 0.85rem 1rem; }
  .metric-label { font-size: 11px; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px; }
  .metric-val { font-size: 26px; font-weight: 700; color: #1a1a18; }

  /* Progress */
  .prog-meta { display: flex; justify-content: space-between; font-size: 13px; color: #666; margin-bottom: 6px; }
  .progress-bar { height: 8px; background: #f0efe8; border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; background: #1d9e75; border-radius: 4px; transition: width 0.5s ease; }

  /* Entry list */
  .entry-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f5f4f0; font-size: 13px; }
  .entry-row:last-child { border-bottom: none; }
  .entry-time { color: #888; min-width: 100px; font-size: 12px; font-variant-numeric: tabular-nums; }
  .entry-name { flex: 1; font-weight: 500; }
  .entry-kat { min-width: 90px; color: #666; font-size: 12px; }
  .entry-stars { min-width: 60px; font-size: 12px; color: #EF9F27; }
  .entry-dur { min-width: 50px; text-align: right; color: #888; font-size: 12px; }

  /* Badges */
  .badge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 6px; white-space: nowrap; }
  .badge-green { background: #eaf3de; color: #3b6d11; }
  .badge-blue { background: #e6f1fb; color: #185fa5; }
  .badge-amber { background: #faeeda; color: #854f0b; }
  .badge-red { background: #fcebeb; color: #a32d2d; }
  .badge-gray { background: #f0efe8; color: #555; }

  /* Table */
  .summary-table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 750px; }
  .summary-table th { text-align: left; font-weight: 600; color: #888; padding: 8px 10px; border-bottom: 1px solid #e8e7e0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
  .summary-table td { padding: 9px 10px; border-bottom: 1px solid #f5f4f0; vertical-align: middle; }
  .summary-table tr:last-child td { border-bottom: none; }
  .summary-table tr:hover td { background: #fafaf8; }

  /* Misc */
  .empty-msg { color: #aaa; font-size: 13px; text-align: center; padding: 2rem 0; }
  .toast { position: fixed; bottom: 24px; right: 24px; background: #1a1a18; color: #fff; padding: 10px 18px; border-radius: 8px; font-size: 13px; opacity: 0; pointer-events: none; transition: opacity 0.3s; z-index: 9999; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
  .toast.show { opacity: 1; }

  /* Responsive */
  @media (max-width: 640px) {
    .grid-2, .grid-3 { grid-template-columns: 1fr; }
    .metric-grid { grid-template-columns: repeat(2, 1fr); }
    .app-header { flex-direction: column; align-items: flex-start; gap: 12px; }
    .tabs { overflow-x: auto; }
    .tab { white-space: nowrap; }
  }
`;

// ── Main App ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: "input",     label: "➕ Tambah Kegiatan" },
  { id: "laporan",   label: "📊 Laporan Hari Ini" },
  { id: "ringkasan", label: "📋 Semua Data" },
];

export default function App() {
  const [data, setData] = useState(loadData);
  const [activeTab, setActiveTab] = useState("input");
  const [toast, setToast] = useState("");

  useEffect(() => { saveData(data); }, [data]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleSave = useCallback((entry) => {
    setData((prev) => [...prev, entry]);
    showToast("✓ Kegiatan berhasil disimpan!");
  }, []);

  const handleDelete = useCallback((id) => {
    if (window.confirm("Hapus kegiatan ini?")) {
      setData((prev) => prev.filter((d) => d.id !== id));
    }
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="app-header">
          <div>
            <div className="app-date">{dateStr}</div>
            <div className="app-title">Evaluasi Kegiatan Harian</div>
          </div>
          <button className="btn-export" onClick={() => { exportCSV(data); showToast("✓ File CSV berhasil diunduh!"); }}>
            ⬇ Ekspor Spreadsheet
          </button>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >{t.label}</button>
          ))}
        </div>

        {activeTab === "input"     && <FormTab onSave={handleSave} />}
        {activeTab === "laporan"   && <LaporanTab data={data} onDelete={handleDelete} />}
        {activeTab === "ringkasan" && <RingkasanTab data={data} onDelete={handleDelete} />}
      </div>

      <Toast msg={toast} />
    </>
  );
}
