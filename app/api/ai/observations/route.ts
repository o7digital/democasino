import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics";
import { compactMoney, money, pct } from "@/lib/numbers";

export const runtime = "nodejs";
export const maxDuration = 45;

const MODEL = process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.3";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Falta HUGGINGFACE_API_TOKEN en variables de entorno" }, { status: 500 });
  }

  const params = request.nextUrl.searchParams;
  const data = await getAnalytics({
    period: params.get("period") || undefined,
    casinoId: params.get("casinoId") || undefined,
    area: params.get("area") || undefined,
    manufacturer: params.get("manufacturer") || undefined,
    search: params.get("search") || undefined,
    user: { role: user.role, casinoIds: user.casinoIds, casinoCodes: user.casinoCodes }
  });

  const prompt = buildPrompt(data);
  const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 420,
        temperature: 0.25,
        return_full_text: false
      },
      options: { wait_for_model: true }
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.error || "Hugging Face no devolvio una observacion valida" },
      { status: response.status }
    );
  }

  return NextResponse.json({
    model: MODEL,
    generatedAt: new Date().toISOString(),
    observation: extractText(payload)
  });
}

function buildPrompt(data: Awaited<ReturnType<typeof getAnalytics>>) {
  const casinos = data.byCasino
    .map((row) => `${row.name}: ${row.units} maquinas, Coin In ${money(row.coinIn)}, NetWin ${money(row.netWin)}, retencion ${pct(row.retention)}, NetWin/maq/dia ${money(row.netWinPerMachineDay)}`)
    .join("\n");
  const top = data.topModels
    .slice(0, 5)
    .map((row, index) => `${index + 1}. ${row.model} (${row.casino.name}, ${row.area}, ${row.units} uds): ${money(row.netWin)}, retencion ${pct(row.retention)}`)
    .join("\n");
  const bottom = data.bottomModels
    .slice(0, 5)
    .map((row, index) => `${index + 1}. ${row.model} (${row.casino.name}, ${row.area}, ${row.units} uds): ${money(row.netWin)}, retencion ${pct(row.retention)}`)
    .join("\n");

  return `Eres analista senior de operaciones casino. Responde en espanol con tono ejecutivo, concreto y accionable.

Genera:
1. Observacion ejecutiva de 3-4 frases.
2. Riesgos operativos principales.
3. Acciones recomendadas para la siguiente semana.

Datos:
Periodo: ${data.overview.period}
Maquinas activas: ${data.overview.activeMachines}
Coin In total: ${compactMoney(data.overview.totalCoinIn)}
NetWin total: ${compactMoney(data.overview.totalNetWin)}
Retencion ponderada: ${pct(data.overview.retention)}
Ganancia por dia: ${compactMoney(data.overview.profitPerDay)}
Payout > 100%: ${data.alertSummary.PAYOUT_GT_100 ?? 0}
NetWin negativo: ${data.alertSummary.NEGATIVE_NETWIN ?? 0}
Terminales OK: ${data.alertSummary.OK ?? 0}

Casinos:
${casinos}

Top modelos:
${top}

Modelos a revisar:
${bottom}`;
}

function extractText(payload: unknown) {
  if (Array.isArray(payload)) {
    const first = payload[0] as { generated_text?: string };
    return first?.generated_text?.trim() || "Sin observacion generada.";
  }
  if (payload && typeof payload === "object" && "generated_text" in payload) {
    return String((payload as { generated_text: unknown }).generated_text).trim();
  }
  return "Sin observacion generada.";
}
