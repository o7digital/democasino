import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 45;

const MODEL = process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.3";

type AiSummary = {
  page?: string;
  overview: {
    period: string;
    activeMachines: number;
    totalCoinIn: string;
    totalNetWin: string;
    retention: string;
    profitPerDay: string;
  };
  alertSummary: Record<string, number>;
  byCasino: Array<{
    name: string;
    units: number;
    coinIn: string;
    netWin: string;
    retention: string;
    netWinPerMachineDay: string;
  }>;
  topModels: Array<{ model: string; casino: string; area: string; units: number; netWin: string; retention: string }>;
  bottomModels: Array<{ model: string; casino: string; area: string; units: number; netWin: string; retention: string }>;
  byManufacturer?: Array<{ name: string; units: number; coinIn: string; netWin: string; retention: string; netWinPerMachineDay: string }>;
  byArea?: Array<{ name: string; units: number; netWin: string; netWinPerMachineDay: string; retention: string }>;
  daily?: Array<{ casino: string; plantId: string; manufacturer: string; model: string; area: string; game: string; netWin: string; payout: string; alert: string }>;
};

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const token = process.env.HUGGINGFACE_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Falta HUGGINGFACE_API_TOKEN en variables de entorno" }, { status: 500 });
    }

    const body = await request.json().catch(() => null);
    const summary = body?.summary as AiSummary | undefined;
    if (!summary?.overview) {
      return NextResponse.json({ error: "Falta resumen de datos para analizar" }, { status: 400 });
    }

    const observation = await generateWithHuggingFace(token, summary);
    return NextResponse.json({
      model: MODEL,
      generatedAt: new Date().toISOString(),
      source: observation ? "huggingface" : "fallback",
      observation: observation || fallbackObservation(summary)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno durante el analisis IA" },
      { status: 500 }
    );
  }
}

async function generateWithHuggingFace(token: string, summary: AiSummary) {
  const prompt = buildPrompt(summary);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 260,
          temperature: 0.2,
          return_full_text: false
        },
        options: { wait_for_model: true }
      }),
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) return "";
    return extractText(parseJson(text)) || text.trim();
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(data: AiSummary) {
  const casinos = data.byCasino
    .map((row) => `${row.name}: ${row.units} maquinas, Coin In ${row.coinIn}, NetWin ${row.netWin}, retencion ${row.retention}, NetWin/maq/dia ${row.netWinPerMachineDay}`)
    .join("\n");
  const top = data.topModels
    .slice(0, 5)
    .map((row, index) => `${index + 1}. ${row.model} (${row.casino}, ${row.area}, ${row.units} uds): ${row.netWin}, retencion ${row.retention}`)
    .join("\n");
  const bottom = data.bottomModels
    .slice(0, 5)
    .map((row, index) => `${index + 1}. ${row.model} (${row.casino}, ${row.area}, ${row.units} uds): ${row.netWin}, retencion ${row.retention}`)
    .join("\n");
  const manufacturers = (data.byManufacturer ?? [])
    .slice(0, 8)
    .map((row, index) => `${index + 1}. ${row.name}: ${row.units} maquinas, NetWin ${row.netWin}, retencion ${row.retention}, NetWin/maq/dia ${row.netWinPerMachineDay}`)
    .join("\n");
  const areas = (data.byArea ?? [])
    .map((row) => `${row.name}: ${row.units} maquinas, NetWin ${row.netWin}, NetWin/maq/dia ${row.netWinPerMachineDay}, retencion ${row.retention}`)
    .join("\n");
  const daily = (data.daily ?? [])
    .slice(0, 8)
    .map((row) => `${row.casino} ${row.plantId} ${row.manufacturer} ${row.game}: NetWin ${row.netWin}, payout ${row.payout}, alerta ${row.alert}`)
    .join("\n");

  return `Eres analista senior de operaciones casino. Responde en espanol con tono ejecutivo, concreto y accionable.
Pantalla analizada: ${data.page ?? "Dashboard"}.

Genera:
1. Observacion especifica de esta pantalla en 3-4 frases.
2. Riesgos operativos principales.
3. Acciones recomendadas para la siguiente semana.

Datos:
Periodo: ${data.overview.period}
Maquinas activas: ${data.overview.activeMachines}
Coin In total: ${data.overview.totalCoinIn}
NetWin total: ${data.overview.totalNetWin}
Retencion ponderada: ${data.overview.retention}
Ganancia por dia: ${data.overview.profitPerDay}
Payout > 100%: ${data.alertSummary.PAYOUT_GT_100 ?? 0}
NetWin negativo: ${data.alertSummary.NEGATIVE_NETWIN ?? 0}
Terminales OK: ${data.alertSummary.OK ?? 0}

Casinos:
${casinos}

Top modelos:
${top}

Modelos a revisar:
${bottom}

Fabricantes:
${manufacturers || "Sin detalle"}

Areas:
${areas || "Sin detalle"}

Terminales con alertas visibles:
${daily || "Sin detalle"}`;
}

function extractText(payload: unknown) {
  if (Array.isArray(payload)) {
    const first = payload[0] as { generated_text?: string };
    return first?.generated_text?.trim() || "Sin observacion generada.";
  }
  if (payload && typeof payload === "object" && "generated_text" in payload) {
    return String((payload as { generated_text: unknown }).generated_text).trim();
  }
  return "";
}

function parseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function fallbackObservation(data: AiSummary) {
  const leader = data.topModels[0];
  const risk = data.bottomModels[0];
  return `Observacion ${data.page ?? "ejecutiva"}: el periodo ${data.overview.period} concentra ${data.overview.totalNetWin} de NetWin con retencion de ${data.overview.retention} sobre ${data.overview.activeMachines} maquinas activas.

Riesgos operativos: revisar ${data.alertSummary.NEGATIVE_NETWIN ?? 0} terminales con NetWin negativo y ${data.alertSummary.PAYOUT_GT_100 ?? 0} casos de payout superior a 100%. El modelo mas debil visible es ${risk?.model ?? "sin dato"}.

Acciones recomendadas: mantener exposicion de ${leader?.model ?? "los modelos lideres"}, auditar los modelos bottom por sala y validar configuracion/juego instalado de las terminales con alerta antes del siguiente cierre.`;
}
