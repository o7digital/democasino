// @ts-nocheck
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Clock,
  Download,
  FileDown,
  Filter,
  Search,
  Settings,
  Upload,
  Users,
  X
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { compactMoney, money, pct, round } from "@/lib/numbers";

type Analytics = Awaited<ReturnType<typeof normalizeAnalytics>>;

const pages = [
  ["executive", "Resumen ejecutivo", BarChart3],
  ["machines", "Performance maquinas", BarChart3],
  ["providers", "Analisis fabricantes", Users],
  ["casinos", "Comparativo casinos", Filter],
  ["daily", "Operacion diaria", AlertTriangle],
  ["imports", "Importar archivos", Upload],
  ["settings", "Configuracion", Settings]
] as const;

export function Dashboard({ user }: { user: { name: string; role: string } }) {
  const [active, setActive] = useState("executive");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<Analytics | null>(null);
  const [toast, setToast] = useState("");
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [filters, setFilters] = useState({ period: "", casinoId: "", area: "", manufacturer: "", search: "" });

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    fetch(`/api/analytics?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => setData(normalizeAnalytics(json)));
  }, [filters]);

  const title = pages.find(([id]) => id === active)?.[1] ?? "Dashboard";
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };
  const canImportFiles = user.role === "ADMIN";
  const canExportReports = ["ADMIN", "EXECUTIVE", "OPERATIONS"].includes(user.role);

  if (!data) {
    return <div className="login-page"><div className="login-card">Cargando datos...</div></div>;
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <img className="keptos-logo" src="/keptos-logo.webp" alt="Keptos IT Services" />
          <div>
            <span>Casino Performance Center</span>
          </div>
        </div>
        <div className="nav-label">Analitica</div>
        <nav className="nav">
          {pages.slice(0, 5).map(([id, label, Icon]) => (
            <button key={id} className={active === id ? "active" : ""} onClick={() => { setActive(id); setSidebarOpen(false); }}>
              <span className="nav-ico"><Icon size={15} /></span>{label}
            </button>
          ))}
          <div className="nav-label">Administracion</div>
          {pages.slice(5).map(([id, label, Icon]) => (
            <button key={id} className={active === id ? "active" : ""} onClick={() => { setActive(id); setSidebarOpen(false); }}>
              <span className="nav-ico"><Icon size={15} /></span>{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <strong>Datos actualizados</strong>
          <p>{data.imports.length} importaciones registradas. Ultimo periodo: {data.overview.period}.</p>
          <button className="action" onClick={() => showToast("Centro de ayuda pendiente")}>Centro de ayuda</button>
        </div>
      </aside>
      <section className="shell">
        <header className="topbar">
          <div className="top-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="crumb">Casino Analytics / <strong>{title}</strong></div>
          </div>
          <div className="top-actions">
            <button className="pill">● Datos al dia</button>
            <button className="action" disabled={!canImportFiles} onClick={() => setActive("imports")} title={!canImportFiles ? "Requiere rol ADMIN" : undefined}><Upload size={16} /><span>Importar Excel</span></button>
            <a
              className={`action primary ${canExportReports ? "" : "disabled"}`}
              href={canExportReports ? pdfUrl(filters) : undefined}
              onClick={(event) => {
                if (!canExportReports) {
                  event.preventDefault();
                  showToast("Permiso insuficiente");
                }
              }}
            ><FileDown size={16} /><span>Exportar PDF</span></a>
            <UserButton
              fallbackRedirectUrl="/login"
              appearance={{ elements: { avatarBox: "clerk-avatar" } }}
            />
          </div>
        </header>
        <main>
          <Hero active={active} data={data} />
          {active !== "imports" && active !== "settings" ? <Filters data={data} filters={filters} setFilters={setFilters} /> : null}
          {active === "executive" ? <Executive data={data} /> : null}
          {active === "machines" ? <Machines data={data} filters={filters} onSelectModel={setSelectedModel} /> : null}
          {active === "providers" ? <Providers data={data} /> : null}
          {active === "casinos" ? <Casinos data={data} /> : null}
          {active === "daily" ? <Daily data={data} filters={filters} setFilters={setFilters} /> : null}
          {active === "imports" ? <Imports canImport={canImportFiles} showToast={showToast} refresh={() => setFilters((f) => ({ ...f }))} /> : null}
          {active === "settings" ? <SettingsPanel data={data} /> : null}
          <div className="page-foot"><span>Keptos · Casino Analytics</span><span>Usuario: {user.name} · {user.role}</span></div>
        </main>
      </section>
      {selectedModel ? <MachineDetailModal filters={filters} model={selectedModel} onClose={() => setSelectedModel(null)} /> : null}
      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </div>
  );
}

function Hero({ active, data }: { active: string; data: Analytics }) {
  const copy: Record<string, [string, string, string]> = {
    executive: ["Vision consolidada multi-sala", "Resumen Ejecutivo", "Rendimiento financiero y operativo consolidado desde Excel real."],
    machines: ["Analisis de rentabilidad", "Performance por Maquina", "Ranking, dispersion y distribucion de rendimiento por modelo y terminal."],
    providers: ["Portafolio tecnologico", "Analisis por Fabricante", "Valor generado, eficiencia por terminal y participacion en el parque instalado."],
    casinos: ["Benchmark entre salas", "Comparativo Multi-Casino", "KPIs side-by-side para identificar brechas de rendimiento."],
    daily: ["Control operativo", "Operacion Diaria por Terminal", "Detalle de terminales con alertas automaticas y exportacion."],
    imports: ["Pipeline de datos", "Importar Archivos", "Carga reportes mensuales y diarios, valida duplicados y recalcula KPIs."],
    settings: ["Administracion", "Configuracion de alertas y costos", "Reglas configurables y costos diarios por sala/modelo."]
  };
  const [eyebrow, title, body] = copy[active] ?? copy.executive;
  return (
    <div className="hero">
      <div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2><p>{body}</p></div>
      <div className="updated">Periodo · {data.overview.period} · {data.overview.activeMachines} maquinas</div>
    </div>
  );
}

function Filters({ data, filters, setFilters }: { data: Analytics; filters: Record<string, string>; setFilters: (v: any) => void }) {
  return (
    <div className="filters no-print">
      <Select label="Periodo" value={filters.period} onChange={(period) => setFilters((f: any) => ({ ...f, period }))} options={["", ...data.filters.periods]} empty="Ultimo periodo" />
      <Select label="Casino" value={filters.casinoId} onChange={(casinoId) => setFilters((f: any) => ({ ...f, casinoId }))} options={["", ...data.filters.casinos.map((c) => c.id)]} labels={Object.fromEntries(data.filters.casinos.map((c) => [c.id, c.name]))} empty="Todas las salas" />
      <Select label="Area" value={filters.area} onChange={(area) => setFilters((f: any) => ({ ...f, area }))} options={["", ...data.filters.areas]} empty="Todas" />
      <Select label="Fabricante" value={filters.manufacturer} onChange={(manufacturer) => setFilters((f: any) => ({ ...f, manufacturer }))} options={["", ...data.filters.manufacturers]} empty="Todos" />
    </div>
  );
}

function Select({ label, value, onChange, options, labels = {}, empty }: { label: string; value: string; onChange: (v: string) => void; options: string[]; labels?: Record<string, string>; empty: string }) {
  return <div className="filter"><label>{label}</label><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((opt) => <option key={opt} value={opt}>{opt ? labels[opt] ?? opt : empty}</option>)}</select></div>;
}

function Executive({ data }: { data: Analytics }) {
  const maxCoin = Math.max(...data.byCasino.map((d) => d.coinIn), 1);
  return (
    <>
      <div className="grid kpis">
        <Kpi label="NetWin total" value={compactMoney(data.overview.totalNetWin)} meta={`${data.overview.casinoCount} salas`} />
        <Kpi label="Coin In total" value={compactMoney(data.overview.totalCoinIn)} meta={`${data.overview.activeMachines} maquinas`} />
        <Kpi label="Retencion" value={pct(data.overview.retention)} meta="Ponderada por Coin In" />
        <Kpi label="Jugadas" value={`${round(data.overview.totalPlays / 1_000_000, 1)}M`} meta={`${data.overview.days} dias`} />
        <Kpi label="Ganancia / dia" value={compactMoney(data.overview.profitPerDay)} meta="Promedio diario" />
        <Kpi label="Maquinas activas" value={String(data.overview.activeMachines)} meta="Parque mensual" />
      </div>
      <div className="grid layout-main">
        <div className="card panel">
          <PanelHead title="Coin In vs NetWin por casino" subtitle="Volumen apostado y rendimiento neto" />
          <div className="chart-box"><ResponsiveContainer><BarChart data={data.byCasino}><CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" /><XAxis dataKey="name" /><YAxis tickFormatter={compactMoney} /><Tooltip formatter={(v: number) => money(v)} /><Bar dataKey="coinIn" fill="#c00021" name="Coin In" /><Bar dataKey="netWin" fill="#303030" name="NetWin" /></BarChart></ResponsiveContainer></div>
        </div>
        <div className="card panel">
          <PanelHead title="Distribucion del NetWin" subtitle="Participacion por sala" />
          <div className="chart-box"><ResponsiveContainer><PieChart><Pie data={data.byCasino} dataKey="netWin" nameKey="name" outerRadius={96} label>{data.byCasino.map((_, i) => <Cell key={i} fill={i % 2 ? "#303030" : "#c00021"} />)}</Pie><Tooltip formatter={(v: number) => money(v)} /></PieChart></ResponsiveContainer></div>
        </div>
      </div>
      <div className="grid layout-3">
        <AreaPanel data={data} />
        <AlertPanel data={data} />
        <div className="card panel">
          <PanelHead title="Top rendimiento por modelo" subtitle="Ordenado por NetWin mensual" />
          <RankList rows={data.topModels.slice(0, 5)} />
        </div>
      </div>
    </>
  );
}

function Machines({ data, filters, onSelectModel }: { data: Analytics; filters: Record<string, string>; onSelectModel: (row: any) => void }) {
  const scatter = data.topModels.concat(data.bottomModels).map((row) => ({ x: row.coinIn, y: row.netWin, z: Math.max(row.units * 24, 80), name: row.model }));
  return (
    <>
      <AiObservations data={data} />
      <div className="grid layout-equal">
        <div className="card panel"><PanelHead title="Top 10 por NetWin" subtitle="Modelos mensuales" /><RankList rows={data.topModels} onSelect={onSelectModel} /></div>
        <div className="card panel"><PanelHead title="Bottom 10 por NetWin" subtitle="Modelos a revisar" /><RankList rows={data.bottomModels} negative onSelect={onSelectModel} /></div>
      </div>
      <div className="grid layout-main">
        <div className="card panel"><PanelHead title="Dispersion Coin In vs NetWin" subtitle="Cada punto representa un modelo" /><div className="chart-box"><ResponsiveContainer><ScatterChart><CartesianGrid stroke="#e5e5e5" /><XAxis type="number" dataKey="x" name="Coin In" tickFormatter={compactMoney} /><YAxis type="number" dataKey="y" name="NetWin" tickFormatter={compactMoney} /><Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v: number) => money(v)} /><Scatter data={scatter} fill="#c00021" /></ScatterChart></ResponsiveContainer></div></div>
        <div className="card panel"><PanelHead title="Distribucion de retencion" subtitle="Por rangos" /><RetentionBuckets data={data} /></div>
      </div>
    </>
  );
}

function Providers({ data }: { data: Analytics }) {
  const max = Math.max(...data.byManufacturer.map((row) => row.netWin), 1);
  return (
    <>
      <div className="grid kpis" style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}>
        <Kpi label="Lider NetWin" value={data.byManufacturer[0]?.name ?? "-"} meta={compactMoney(data.byManufacturer[0]?.netWin ?? 0)} />
        <Kpi label="Mayor parque" value={[...data.byManufacturer].sort((a, b) => b.units - a.units)[0]?.name ?? "-"} meta="Unidades instaladas" />
        <Kpi label="Mayor retencion" value={pct([...data.byManufacturer].sort((a, b) => b.retention - a.retention)[0]?.retention ?? 0)} meta="Ponderada" />
        <Kpi label="Marcas activas" value={String(data.byManufacturer.length)} meta={`${data.overview.activeMachines} terminales`} />
      </div>
      <div className="grid layout-main">
        <div className="card panel"><PanelHead title="NetWin por fabricante" subtitle="Ambos casinos" /><Hbars rows={data.byManufacturer.map((row) => ({ label: row.name, value: compactMoney(row.netWin), width: (row.netWin / max) * 100 }))} /></div>
        <div className="card panel"><PanelHead title="Ranking de eficiencia" subtitle="NetWin por terminal" /><Hbars rows={data.byManufacturer.map((row) => ({ label: row.name, value: money(row.netWin / Math.max(row.units, 1)), width: Math.min((row.netWinPerMachineDay / 6000) * 100, 100) }))} /></div>
      </div>
      <ProviderTable data={data} />
    </>
  );
}

function Casinos({ data }: { data: Analytics }) {
  return (
    <>
      <div className="split-kpi">
        {data.byCasino.map((casino) => (
          <div className="casino-box" key={casino.name}>
            <div className="casino-head"><div><div className="casino-code">SALA</div><div className="casino-name">{casino.name}</div></div><span className="badge blue">{casino.units} maquinas</span></div>
            <div className="casino-metrics">
              <Metric label="Coin In" value={compactMoney(casino.coinIn)} />
              <Metric label="NetWin" value={compactMoney(casino.netWin)} />
              <Metric label="Coin In / maq / dia" value={money(casino.coinInPerMachineDay)} />
              <Metric label="NetWin / maq / dia" value={money(casino.netWinPerMachineDay)} />
              <Metric label="Retencion" value={pct(casino.retention)} />
              <Metric label="Ganancia / dia" value={compactMoney(casino.profitPerDay)} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 16 }} />
      <AreaPanel data={data} />
    </>
  );
}

function Daily({ data, filters, setFilters }: { data: Analytics; filters: Record<string, string>; setFilters: (v: any) => void }) {
  return (
    <>
      <div className="grid kpis" style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}>
        <Kpi label="Terminales activas" value={String(data.daily.length)} meta="Segun filtros" />
        <Kpi label="Terminales OK" value={String(data.alertSummary.OK ?? 0)} meta={pct((data.alertSummary.OK ?? 0) / Math.max(data.daily.length, 1))} />
        <Kpi label="Payout > 100%" value={String(data.alertSummary.PAYOUT_GT_100 ?? 0)} meta="Revision inmediata" />
        <Kpi label="NetWin negativo" value={String(data.alertSummary.NEGATIVE_NETWIN ?? 0)} meta="Terminales en perdida" />
      </div>
      <div className="filters no-print">
        <div className="filter" style={{ minWidth: 280 }}><label>Busqueda</label><div style={{ display: "flex", gap: 8, alignItems: "center" }}><Search size={14} /><input value={filters.search} onChange={(e) => setFilters((f: any) => ({ ...f, search: e.target.value }))} placeholder="ID, juego, modelo..." /></div></div>
        <a className="action" href={exportUrl(filters, "csv")}><Download size={16} />CSV</a>
        <a className="action" href={exportUrl(filters, "xlsx")}><Download size={16} />XLSX</a>
      </div>
      <DailyTable data={data} />
    </>
  );
}

function Imports({ canImport, showToast, refresh }: { canImport: boolean; showToast: (message: string) => void; refresh: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const upload = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (!fileList.length) return;
    if (!canImport) {
      showToast("Permiso insuficiente");
      return;
    }
    setSelectedFiles(fileList.map((file) => file.name));
    setUploading(true);
    setResults([]);
    const form = new FormData();
    fileList.forEach((file) => form.append("files", file));
    try {
      const response = await fetch("/api/import", { method: "POST", body: form });
      const json = await response.json();
      if (!response.ok) {
        showToast(json.error || "Error de importacion");
        return;
      }
      setResults(json);
      showToast(json.some((row: any) => row.duplicate) ? "Archivos ya importados" : "Importacion procesada");
      refresh();
    } catch {
      showToast("Error de conexion durante la importacion");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  return (
    <div className="grid layout-main">
      <div className="card panel">
        <div className={`import-zone ${dragging ? "dragging" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}>
          <div className="import-icon"><Upload /></div>
          <h3>Arrastra aqui los archivos Excel</h3>
          <p>{uploading ? "Importacion en curso..." : canImport ? "Reporte Mensual.xlsx o archivos diarios por sala" : "Permiso requerido: ADMIN"}</p>
          {selectedFiles.length ? <div className="file-list">{selectedFiles.map((name) => <span key={name}>{name}</span>)}</div> : null}
          <button className="action primary" disabled={!canImport || uploading} onClick={() => inputRef.current?.click()}>{uploading ? "Procesando..." : "Seleccionar archivos"}</button>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" multiple hidden disabled={!canImport} onChange={(e) => e.target.files && upload(e.target.files)} />
        </div>
      </div>
      <div className="card panel"><PanelHead title="Resultado de validacion" subtitle="Resumen del ultimo lote" /><div className="alert-stack">{uploading ? <div className="alert-box amber"><div className="alert-ico">...</div><div className="alert-copy"><strong>Procesando importacion</strong><span>Validando archivos y recalculando KPIs.</span></div></div> : results.length ? results.map((r) => <div className={`alert-box ${r.errors ? "red" : r.warnings || r.duplicate ? "amber" : "green"}`} key={r.filename}><div className="alert-ico">{r.duplicate ? "D" : r.errors ? "!" : "✓"}</div><div className="alert-copy"><strong>{r.duplicate ? `${r.filename} · duplicado` : `${r.filename} · OK`}</strong><span>{r.type} · {r.validRows}/{r.rows} validas · {r.warnings} advertencias</span></div></div>) : <div className="alert-box green"><div className="alert-ico">✓</div><div className="alert-copy"><strong>Listo para importar</strong><span>Selecciona archivos para iniciar la importacion.</span></div></div>}</div></div>
    </div>
  );
}

function SettingsPanel({ data }: { data: Analytics }) {
  return <div className="card panel"><PanelHead title="Reglas de alerta" subtitle="Configurables en base de datos" /><div className="table-wrap"><table className="data-table"><thead><tr><th>Codigo</th><th>Regla</th><th>Severidad</th><th>Umbral</th><th>Min</th><th>Max</th><th>Estado</th></tr></thead><tbody>{data.rules.map((r) => <tr key={r.id}><td className="model">{r.code}</td><td>{r.label}</td><td>{r.severity}</td><td>{r.threshold ?? "-"}</td><td>{r.minValue ?? "-"}</td><td>{r.maxValue ?? "-"}</td><td><span className={r.enabled ? "badge green" : "badge red"}>{r.enabled ? "Activa" : "Inactiva"}</span></td></tr>)}</tbody></table></div></div>;
}

function Kpi({ label, value, meta }: { label: string; value: string; meta: string }) {
  return <div className="card kpi"><div className="kpi-head"><span>{label}</span><span className="kpi-icon">$</span></div><div className="kpi-value">{value}</div><div className="kpi-meta"><span>{meta}</span><span className="trend">calc.</span></div></div>;
}

function PanelHead({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="panel-head"><div><h3 className="panel-title">{title}</h3><div className="panel-sub">{subtitle}</div></div></div>;
}

function RankList({ rows, negative = false, onSelect }: { rows: Analytics["topModels"]; negative?: boolean; onSelect?: (row: any) => void }) {
  return <div className="rank-list">{rows.map((row, index) => {
    const name = <>{row.model}<span>{row.casino.name} · {row.area} · {row.units} uds.</span></>;
    return <div className="rank" key={`${row.model}-${row.casinoId}-${index}`}><div className="rank-num">{index + 1}</div>{onSelect ? <button className="rank-name rank-button" onClick={() => onSelect(row)}>{name}</button> : <div className="rank-name">{name}</div>}<div className={`rank-value ${negative || row.netWin < 0 ? "money neg" : ""}`}>{compactMoney(row.netWin)}<span>{pct(row.retention)}</span></div></div>;
  })}</div>;
}

function AiObservations({ data }: { data: Analytics }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState("");
  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/observations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ summary: aiSummary(data) })
      });
      const text = await response.text();
      const json = text ? JSON.parse(text) : null;
      if (!response.ok) throw new Error(json.error || "Error IA");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error IA");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="card panel ai-panel">
      <div className="ai-head">
        <div>
          <div className="eyebrow">Hugging Face</div>
          <h3 className="panel-title">Observacion IA</h3>
          <div className="panel-sub">Analisis automatico con los filtros actuales.</div>
        </div>
        <button className="action primary" onClick={run} disabled={loading}><Brain size={16} />{loading ? "Analizando..." : "Analizar"}</button>
      </div>
      {error ? <div className="alert-box red"><div className="alert-ico">!</div><div className="alert-copy"><strong>Error de IA</strong><span>{error}</span></div></div> : null}
      {result ? <div className="ai-copy">{result.observation}</div> : <div className="ai-copy muted">Pulsa Analizar para generar observaciones ejecutivas, riesgos y acciones recomendadas.</div>}
    </div>
  );
}

function aiSummary(data: Analytics) {
  return {
    overview: {
      period: data.overview.period,
      activeMachines: data.overview.activeMachines,
      totalCoinIn: compactMoney(data.overview.totalCoinIn),
      totalNetWin: compactMoney(data.overview.totalNetWin),
      retention: pct(data.overview.retention),
      profitPerDay: compactMoney(data.overview.profitPerDay)
    },
    alertSummary: data.alertSummary,
    byCasino: data.byCasino.map((row: any) => ({
      name: row.name,
      units: row.units,
      coinIn: compactMoney(row.coinIn),
      netWin: compactMoney(row.netWin),
      retention: pct(row.retention),
      netWinPerMachineDay: money(row.netWinPerMachineDay)
    })),
    topModels: data.topModels.slice(0, 10).map((row: any) => ({
      model: row.model,
      casino: row.casino.name,
      area: row.area,
      units: row.units,
      netWin: money(row.netWin),
      retention: pct(row.retention)
    })),
    bottomModels: data.bottomModels.slice(0, 10).map((row: any) => ({
      model: row.model,
      casino: row.casino.name,
      area: row.area,
      units: row.units,
      netWin: money(row.netWin),
      retention: pct(row.retention)
    }))
  };
}

function MachineDetailModal({ filters, model, onClose }: { filters: Record<string, string>; model: any; onClose: () => void }) {
  const [detail, setDetail] = useState<any | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams({ model: model.model });
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    if (model.casinoId) params.set("casinoId", model.casinoId);
    if (model.area) params.set("area", model.area);
    setDetail(null);
    setError("");
    fetch(`/api/machines/detail?${params.toString()}`)
      .then(async (response) => {
        const text = await response.text();
        const json = text ? JSON.parse(text) : null;
        if (!response.ok) throw new Error(json?.error || "No se pudo cargar el detalle");
        setDetail(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el detalle"));
  }, [filters, model]);
  const rows = detail?.rows ?? [];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">Detalle maquina</div>
            <h3>{model.model}</h3>
            <p>{model.casino.name} · {model.area} · {model.manufacturer}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="grid kpis modal-kpis">
          <Kpi label="Unidades" value={String(model.units)} meta="Instaladas" />
          <Kpi label="NetWin" value={compactMoney(model.netWin)} meta={pct(model.retention)} />
          <Kpi label="Coin In" value={compactMoney(model.coinIn)} meta={`${model.days} dias`} />
          <Kpi label="Jugadas" value={model.plays.toLocaleString("es-MX")} meta="Periodo mensual" />
        </div>
        <div className="detail-strip">
          <span><Clock size={14} /> Periodo diario: {!detail ? "Cargando..." : rows[0] ? `${dateLabel(rows[0].startedAt)} - ${dateLabel(rows[0].endedAt)}` : "Sin detalle diario importado"}</span>
          <span>{!detail ? "Cargando terminales..." : `${rows.length} terminales encontradas`}</span>
        </div>
        {error ? <div className="alert-box red"><div className="alert-ico">!</div><div className="alert-copy"><strong>Error de detalle</strong><span>{error}</span></div></div> : null}
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>ID planta</th><th>Juego instalado</th><th>Isla</th><th>Posicion</th><th>Desde</th><th>Hasta</th><th>Coin In</th><th>NetWin</th><th>Payout</th><th>Jugadas</th><th>Alerta</th></tr></thead>
            <tbody>{!detail ? <tr><td colSpan={11}>Cargando detalle...</td></tr> : rows.length ? rows.map((row: any) => <tr key={row.id}><td className="model">{row.plantId}</td><td>{row.game}</td><td>{row.island ?? "-"}</td><td>{row.position ?? "-"}</td><td>{dateLabel(row.startedAt)}</td><td>{dateLabel(row.endedAt)}</td><td>{money(row.coinIn)}</td><td className={row.netWin < 0 ? "money neg" : "money pos"}>{money(row.netWin)}</td><td>{pct(row.payout)}</td><td>{row.plays.toLocaleString("es-MX")}</td><td>{row.alerts[0]?.label ?? "OK"}</td></tr>) : <tr><td colSpan={11}>No hay terminales diarias importadas para este modelo y periodo.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function dateLabel(value: string | Date) {
  return new Date(value).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function Hbars({ rows }: { rows: { label: string; value: string; width: number }[] }) {
  return <div className="hbar-list">{rows.map((row) => <div className="hbar" key={row.label}><label>{row.label}</label><div className="progress"><span style={{ width: `${Math.max(4, Math.min(row.width, 100))}%` }} /></div><b>{row.value}</b></div>)}</div>;
}

function AreaPanel({ data }: { data: Analytics }) {
  const max = Math.max(...data.byArea.map((row) => row.netWinPerMachineDay), 1);
  return <div className="card panel"><PanelHead title="Rendimiento por area" subtitle="NetWin promedio por maquina/dia" /><Hbars rows={data.byArea.map((row) => ({ label: row.name, value: money(row.netWinPerMachineDay), width: (row.netWinPerMachineDay / max) * 100 }))} /></div>;
}

function AlertPanel({ data }: { data: Analytics }) {
  return <div className="card panel"><PanelHead title="Alertas operativas" subtitle="Ultimo archivo diario importado" /><div className="alert-stack"><AlertBox tone="red" label="Payout superior a 100%" value={data.alertSummary.PAYOUT_GT_100 ?? 0} /><AlertBox tone="amber" label="NetWin negativo" value={data.alertSummary.NEGATIVE_NETWIN ?? 0} /><AlertBox tone="green" label="Terminales OK" value={data.alertSummary.OK ?? 0} /></div></div>;
}

function AlertBox({ tone, label, value }: { tone: "red" | "amber" | "green"; label: string; value: number }) {
  return <div className={`alert-box ${tone}`}><div className="alert-ico">{tone === "green" ? "✓" : "!"}</div><div className="alert-copy"><strong>{label}</strong><span>Calculado automaticamente</span></div><div className="alert-count">{value}</div></div>;
}

function RetentionBuckets({ data }: { data: Analytics }) {
  const buckets = [
    ["0-3% · Bajo", data.topModels.concat(data.bottomModels).filter((r) => r.retention < 0.03).length, "#ef5350"],
    ["3-6% · Estandar", data.topModels.concat(data.bottomModels).filter((r) => r.retention >= 0.03 && r.retention < 0.06).length, "#f4a928"],
    ["6-10% · Bueno", data.topModels.concat(data.bottomModels).filter((r) => r.retention >= 0.06 && r.retention < 0.1).length, "#c00021"],
    ["+10% · Excelente", data.topModels.concat(data.bottomModels).filter((r) => r.retention >= 0.1).length, "#13b981"]
  ] as const;
  const max = Math.max(...buckets.map(([, count]) => count), 1);
  return <Hbars rows={buckets.map(([label, count]) => ({ label, value: String(count), width: (count / max) * 100 }))} />;
}

function ProviderTable({ data }: { data: Analytics }) {
  return <div className="card panel"><PanelHead title="Parque instalado por fabricante" subtitle="Unidades y participacion" /><div className="table-wrap"><table className="data-table"><thead><tr><th>Fabricante</th><th>Unidades</th><th>% parque</th><th>Coin In</th><th>NetWin</th><th>NetWin/unidad</th><th>Retencion</th></tr></thead><tbody>{data.byManufacturer.map((row) => <tr key={row.name}><td className="model">{row.name}</td><td>{row.units}</td><td>{pct(row.units / Math.max(data.overview.activeMachines, 1), 1)}</td><td>{compactMoney(row.coinIn)}</td><td>{compactMoney(row.netWin)}</td><td>{money(row.netWin / Math.max(row.units, 1))}</td><td>{pct(row.retention)}</td></tr>)}</tbody></table></div></div>;
}

function DailyTable({ data }: { data: Analytics }) {
  return <div className="card panel"><PanelHead title="Detalle por terminal" subtitle="Datos diarios importados desde Excel" /><div className="table-wrap"><table className="data-table"><thead><tr><th>Casino</th><th>ID planta</th><th>Fabricante</th><th>Modelo</th><th>Area</th><th>Juego</th><th>Coin In</th><th>NetWin</th><th>Payout</th><th>Jugadas</th><th>Alerta</th></tr></thead><tbody>{data.daily.slice(0, 120).map((row) => <tr key={row.id} style={row.alerts.length ? { background: row.netWin < 0 ? "#fff6f6" : "#fff9ef" } : undefined}><td>{row.casino.name}</td><td>{row.plantId}</td><td className="model">{row.manufacturer}</td><td>{row.terminalName}</td><td>{row.area}</td><td>{row.game}</td><td>{money(row.coinIn)}</td><td className={row.netWin < 0 ? "money neg" : "money pos"}>{money(row.netWin)}</td><td>{pct(row.payout)}</td><td>{row.plays.toLocaleString("es-MX")}</td><td>{row.alerts.length ? <span className="badge red">{row.alerts[0].label}</span> : <span className="badge green">OK</span>}</td></tr>)}</tbody></table></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric-mini"><span>{label}</span><strong>{value}</strong></div>;
}

function normalizeAnalytics(json: any) {
  return json;
}

function exportUrl(filters: Record<string, string>, format: string) {
  const params = new URLSearchParams({ format });
  Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
  return `/api/export/terminals?${params.toString()}`;
}

function pdfUrl(filters: Record<string, string>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
  return `/api/reports/executive/pdf?${params.toString()}`;
}
