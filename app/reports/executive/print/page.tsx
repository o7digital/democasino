import { getAnalytics } from "@/lib/analytics";
import { compactMoney, money, pct } from "@/lib/numbers";

export default async function ExecutivePrintPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const data = await getAnalytics({
    period: value(params.period),
    casinoId: value(params.casinoId),
    area: value(params.area),
    manufacturer: value(params.manufacturer)
  });
  const generatedAt = new Date().toLocaleString("es-MX");
  return (
    <main>
      <section className="hero">
        <div>
          <div className="eyebrow">Keptos Casino Analytics</div>
          <h2>Reporte Ejecutivo</h2>
          <p>Cliente: Keptos · Periodo: {data.overview.period} · Generado: {generatedAt}</p>
        </div>
        <div className="brand-mark">K</div>
      </section>
      <div className="grid kpis">
        <Kpi label="NetWin total" value={compactMoney(data.overview.totalNetWin)} />
        <Kpi label="Coin In total" value={compactMoney(data.overview.totalCoinIn)} />
        <Kpi label="Retencion ponderada" value={pct(data.overview.retention)} />
        <Kpi label="Jugadas" value={data.overview.totalPlays.toLocaleString("es-MX")} />
        <Kpi label="Ganancia / dia" value={compactMoney(data.overview.profitPerDay)} />
        <Kpi label="Maquinas activas" value={String(data.overview.activeMachines)} />
      </div>
      <section className="card panel">
        <h3 className="panel-title">Comparativo multi-casino</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Casino</th><th>Maquinas</th><th>Coin In</th><th>Coin In/maq/dia</th><th>NetWin</th><th>NetWin/maq/dia</th><th>Retencion</th><th>Jugadas</th><th>Ganancia/dia</th></tr></thead>
            <tbody>{data.byCasino.map((row) => <tr key={row.name}><td className="model">{row.name}</td><td>{row.units}</td><td>{money(row.coinIn)}</td><td>{money(row.coinInPerMachineDay)}</td><td>{money(row.netWin)}</td><td>{money(row.netWinPerMachineDay)}</td><td>{pct(row.retention)}</td><td>{row.plays.toLocaleString("es-MX")}</td><td>{money(row.profitPerDay)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="grid layout-equal">
        <div className="card panel">
          <h3 className="panel-title">Top modelos por NetWin</h3>
          <Rows rows={data.topModels.slice(0, 10)} />
        </div>
        <div className="card panel">
          <h3 className="panel-title">Bottom modelos por NetWin</h3>
          <Rows rows={data.bottomModels.slice(0, 10)} />
        </div>
      </section>
      <section className="card panel">
        <h3 className="panel-title">Analisis por fabricante</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Fabricante</th><th>Unidades</th><th>Coin In</th><th>NetWin</th><th>Retencion</th><th>NetWin/maq/dia</th></tr></thead>
            <tbody>{data.byManufacturer.map((row) => <tr key={row.name}><td className="model">{row.name}</td><td>{row.units}</td><td>{money(row.coinIn)}</td><td>{money(row.netWin)}</td><td>{pct(row.retention)}</td><td>{money(row.netWinPerMachineDay)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="card panel">
        <h3 className="panel-title">Alertas y operacion diaria</h3>
        <p className="panel-sub">Payout &gt; 100%: {data.alertSummary.PAYOUT_GT_100 ?? 0} · NetWin negativo: {data.alertSummary.NEGATIVE_NETWIN ?? 0} · Terminales OK: {data.alertSummary.OK ?? 0}</p>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Casino</th><th>ID planta</th><th>Fabricante</th><th>Juego</th><th>Coin In</th><th>NetWin</th><th>Payout</th><th>Alerta</th></tr></thead>
            <tbody>{data.daily.slice(0, 40).map((row) => <tr key={row.id}><td>{row.casino.name}</td><td>{row.plantId}</td><td>{row.manufacturer}</td><td>{row.game}</td><td>{money(row.coinIn)}</td><td>{money(row.netWin)}</td><td>{pct(row.payout)}</td><td>{row.alerts[0]?.label ?? "OK"}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="card panel">
        <h3 className="panel-title">Notas metodologicas</h3>
        <p className="panel-sub">NetWin, payout, retencion, apuesta media y promedios por maquina/dia se recalculan en la aplicacion. Los porcentajes agregados usan ponderacion por Coin In.</p>
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <div className="card kpi"><div className="kpi-head">{label}</div><div className="kpi-value">{value}</div></div>;
}

function Rows({ rows }: { rows: any[] }) {
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>Modelo</th><th>Casino</th><th>Unidades</th><th>NetWin</th><th>Retencion</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.id}`}><td className="model">{row.model}</td><td>{row.casino.name}</td><td>{row.units}</td><td>{money(row.netWin)}</td><td>{pct(row.retention)}</td></tr>)}</tbody></table></div>;
}

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}
