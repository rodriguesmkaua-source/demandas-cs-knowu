import { useMemo, useRef } from "react";
import type { Demanda } from "@/lib/demandas";
import { MESES, mesDaData } from "@/lib/demandas";
import { X, Download, FileImage } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

const DONUT_COLORS = ["#5a9e5e", "#F15A24", "#2d6e2d", "#9eb0a8", "#c87830", "#6b8a70", "#3d7a6e", "#a07030"];

const C = {
  bg: "#F5F4F1",
  orange: "#F15A24",
  green: "#00843D",
  navy: "#0B1F4A",
  blue: "#3B5AA0",
  gray: "#55524C",
  track: "#EDEAE3",
  card: "#FFFFFF",
  boxBg: "#FAFAF8",
  boxBorder: "#EFEDE7",
  divider: "#E4E1D9",
  mute: "#A9A49A",
};

function planoAcao(tipo: string): string {
  const t = tipo.toLowerCase();
  if (t.includes("reenvio") && t.includes("assinatura")) return "Confirmar recebimento e reenviar documento para assinatura do médico";
  if (t.includes("link") && t.includes("assinatura")) return "Verificar validade do link e reenviar para assinatura do profissional";
  if (t.includes("modificar") || t.includes("cadastro")) return "Revisar e corrigir dados cadastrais do beneficiário junto à operadora";
  if (t.includes("preenchimento")) return "Disponibilizar guia de preenchimento e reforçar suporte ao beneficiário";
  if (t.includes("inclusão") || t.includes("beneficiário")) return "Acompanhar pendências de cadastro e alinhar fluxo com a operadora";
  if (t.includes("plataforma") || t.includes("sistema")) return "Mapear fricções e agendar capacitação com a equipe interna";
  if (t.includes("assinatura")) return "Otimizar fluxo de assinatura digital e resolver pendências com o médico";
  if (t.includes("acesso") || t.includes("login")) return "Verificar autenticação e orientar usuários sobre o processo de login";
  return "Monitorar evolução do volume e definir ação preventiva com a equipe";
}

interface SlideData {
  operadora: string;
  mesNome: string;
  ano: string;
  total: number;
  emAberto: number;
  tipos: Array<{ name: string; value: number; pct: number; color: string }>;
  maior?: { name: string; value: number };
}

function buildSlideData(demandas: Demanda[], operadora: string, mesNome: string, ano: string): SlideData {
  const total = demandas.length;
  const emAberto = demandas.filter((d) => d.status !== "Resolvido").length;
  const map = new Map<string, number>();
  demandas.forEach((d) => map.set(d.tipo, (map.get(d.tipo) ?? 0) + 1));
  const tipos = Array.from(map.entries())
    .map(([name, value]) => ({ name, value, pct: total ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value)
    .map((t, i) => ({ ...t, color: DONUT_COLORS[i % DONUT_COLORS.length] }));
  return { operadora, mesNome, ano, total, emAberto, tipos, maior: tipos[0] };
}

/** Donut SVG segments (1672x941 slide, ~386px donut) */
function DonutSVG({ tipos, total }: { tipos: SlideData["tipos"]; total: number }) {
  const size = 386;
  const cx = size / 2, cy = size / 2;
  const rOuter = 180, rInner = 105;
  let acc = 0;
  const arcs = tipos.map((t) => {
    const start = (acc / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
    acc += t.value;
    const end = (acc / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + rOuter * Math.cos(start), y1 = cy + rOuter * Math.sin(start);
    const x2 = cx + rOuter * Math.cos(end), y2 = cy + rOuter * Math.sin(end);
    const x3 = cx + rInner * Math.cos(end), y3 = cy + rInner * Math.sin(end);
    const x4 = cx + rInner * Math.cos(start), y4 = cy + rInner * Math.sin(start);
    const d = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
    const mid = (start + end) / 2;
    const labelR = (rOuter + rInner) / 2;
    const lx = cx + labelR * Math.cos(mid), ly = cy + labelR * Math.sin(mid);
    return { d, color: t.color, pct: t.pct, lx, ly };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((a, i) => (
        <g key={i}>
          <path d={a.d} fill={a.color} stroke="#fff" strokeWidth={2.5} />
          {a.pct >= 7 && (
            <text x={a.lx} y={a.ly} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={18} fontWeight={700}>
              {a.pct.toFixed(0)}%
            </text>
          )}
        </g>
      ))}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={56} fontWeight={800} fill={C.navy}>{total}</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fontSize={16} fill={C.gray} letterSpacing={2}>tickets</text>
    </svg>
  );
}

function SlideCard({ data }: { data: SlideData }) {
  const { operadora, mesNome, ano, total, emAberto, tipos, maior } = data;
  const maxV = tipos[0]?.value || 1;
  return (
    <div style={{ width: 1672, height: 941, background: C.bg, fontFamily: "DM Sans, Inter, sans-serif", color: C.navy, position: "relative" }}>
      {/* Header */}
      <div style={{ height: 130, background: C.orange, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 60px" }}>
        <div>
          <div style={{ fontSize: 13, fontFamily: "DM Mono, monospace", letterSpacing: 3, color: "rgba(255,255,255,0.85)", textTransform: "uppercase" }}>KnowU · Customer Success</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: "#fff", marginTop: 6, letterSpacing: -1 }}>Fechamento {mesNome} {ano}</div>
        </div>
        <div style={{ padding: "14px 26px", background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 12, color: "#fff", fontSize: 20, fontWeight: 700, maxWidth: 520, textAlign: "right" }}>
          {operadora}
        </div>
      </div>

      {/* Card body */}
      <div style={{ position: "absolute", top: 160, left: 30, right: 30, bottom: 30, background: C.card, borderRadius: 16, padding: 32, boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 27, fontWeight: 700, color: C.navy }}>Relatório mensal de demandas</div>
        <div style={{ fontSize: 17, color: C.blue, marginTop: 4 }}>{operadora} · {mesNome} {ano}</div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 20 }}>
          <div style={{ background: C.boxBg, border: `1px solid ${C.boxBorder}`, borderRadius: 10, padding: "18px 22px" }}>
            <div style={{ fontSize: 11, fontFamily: "DM Mono, monospace", letterSpacing: 2, color: C.gray, textTransform: "uppercase" }}>Total</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: C.orange, lineHeight: 1 }}>{total}</div>
              <div style={{ fontSize: 14, color: C.gray }}>demandas registradas</div>
            </div>
          </div>
          <div style={{ background: C.boxBg, border: `1px solid ${C.boxBorder}`, borderRadius: 10, padding: "18px 22px" }}>
            <div style={{ fontSize: 11, fontFamily: "DM Mono, monospace", letterSpacing: 2, color: C.gray, textTransform: "uppercase" }}>Maior demanda</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: C.green, lineHeight: 1 }}>{maior?.value ?? 0}</div>
              <div style={{ fontSize: 13, color: C.gray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>{maior?.name ?? "—"}</div>
            </div>
          </div>
          <div style={{ background: C.boxBg, border: `1px solid ${C.boxBorder}`, borderRadius: 10, padding: "18px 22px" }}>
            <div style={{ fontSize: 11, fontFamily: "DM Mono, monospace", letterSpacing: 2, color: C.gray, textTransform: "uppercase" }}>Em aberto</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: "#c53030", lineHeight: 1 }}>{emAberto}</div>
              <div style={{ fontSize: 14, color: C.gray }}>não resolvidas</div>
            </div>
          </div>
        </div>

        {/* Two columns */}
        <div style={{ display: "grid", gridTemplateColumns: "566px 1fr", gap: 30, marginTop: 24 }}>
          {/* Donut */}
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Distribuição por tipo</div>
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
              <DonutSVG tipos={tipos} total={total} />
            </div>
          </div>

          {/* Table */}
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Detalhamento</div>
            <div style={{ display: "grid", gridTemplateColumns: "336px 1fr 70px 64px", gap: 12, fontSize: 11, fontFamily: "DM Mono, monospace", color: C.gray, textTransform: "uppercase", letterSpacing: 1.5, paddingBottom: 8 }}>
              <div>Tipo de Demanda</div><div>Volume</div><div style={{ textAlign: "right" }}>Qtd</div><div style={{ textAlign: "right" }}>%</div>
            </div>
            <div style={{ height: 1.5, background: C.divider, marginBottom: 10 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {tipos.map((t) => (
                <div key={t.name} style={{ display: "grid", gridTemplateColumns: "336px 1fr 70px 64px", gap: 12, alignItems: "center" }}>
                  <div style={{ fontSize: 15, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{t.name}</div>
                  <div style={{ height: 13, borderRadius: 7, background: C.track, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(t.value / maxV) * 100}%`, background: t.color, borderRadius: 7 }} />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, textAlign: "right", fontFamily: "DM Mono, monospace" }}>{t.value}</div>
                  <div style={{ fontSize: 14, color: C.mute, textAlign: "right", fontFamily: "DM Mono, monospace" }}>{t.pct.toFixed(1)}%</div>
                </div>
              ))}
            </div>

            {/* Plano de ação compacto */}
            {tipos.length > 0 && (
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.divider}` }}>
                <div style={{ fontSize: 13, fontFamily: "DM Mono, monospace", color: C.gray, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Plano de ação</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {tipos.slice(0, 3).map((t) => (
                    <div key={t.name} style={{ borderLeft: `4px solid ${t.color}`, paddingLeft: 10, fontSize: 12, color: C.gray, lineHeight: 1.4 }}>
                      <span style={{ color: C.navy, fontWeight: 600 }}>{t.name}:</span> {planoAcao(t.name)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoverSlide({ mesNome, ano, totalOps, totalDem }: { mesNome: string; ano: string; totalOps: number; totalDem: number }) {
  return (
    <div style={{ width: 1672, height: 941, background: C.orange, fontFamily: "DM Sans, sans-serif", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", position: "relative" }}>
      <div style={{ fontSize: 15, fontFamily: "DM Mono, monospace", letterSpacing: 4, opacity: 0.9, textTransform: "uppercase" }}>KnowU · Customer Success</div>
      <div style={{ fontSize: 120, fontWeight: 900, letterSpacing: -3, marginTop: 24, lineHeight: 1 }}>Fechamento</div>
      <div style={{ fontSize: 80, fontWeight: 700, marginTop: 8, letterSpacing: -1 }}>{mesNome} {ano}</div>
      <div style={{ fontSize: 22, marginTop: 40, opacity: 0.95 }}>Relatório consolidado — todas as operadoras</div>
      <div style={{ display: "flex", gap: 60, marginTop: 60 }}>
        <div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1 }}>{totalOps}</div>
          <div style={{ fontSize: 16, opacity: 0.9, marginTop: 4 }}>operadoras</div>
        </div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.4)" }} />
        <div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1 }}>{totalDem}</div>
          <div style={{ fontSize: 16, opacity: 0.9, marginTop: 4 }}>demandas registradas</div>
        </div>
      </div>
    </div>
  );
}

export function FechamentoModal({
  demandas, operadora, mesKey, onClose,
}: { demandas: Demanda[]; operadora: string | "TODAS"; mesKey: string; onClose: () => void }) {
  const slideRef = useRef<HTMLDivElement>(null);

  const [ano, mes] = mesKey.split("-");
  const mesNome = MESES[parseInt(mes) - 1] || "";

  const filtered = useMemo(() => demandas.filter((d) => mesDaData(d.data).key === mesKey), [demandas, mesKey]);

  const isConsolidado = operadora === "TODAS";

  const operadorasList = useMemo(() => {
    if (!isConsolidado) return [];
    const map = new Map<string, Demanda[]>();
    filtered.forEach((d) => {
      const arr = map.get(d.operadora) ?? [];
      arr.push(d);
      map.set(d.operadora, arr);
    });
    return Array.from(map.entries())
      .map(([op, arr]) => ({ op, arr }))
      .sort((a, b) => b.arr.length - a.arr.length);
  }, [filtered, isConsolidado]);

  const singleData = useMemo(() => {
    if (isConsolidado) return null;
    const arr = filtered.filter((d) => d.operadora === operadora);
    return buildSlideData(arr, operadora, mesNome, ano);
  }, [filtered, operadora, isConsolidado, mesNome, ano]);

  async function captureNode(node: HTMLElement) {
    return html2canvas(node, { scale: 2, backgroundColor: C.bg, useCORS: true, width: 1672, height: 941, windowWidth: 1672 });
  }

  async function exportPNG() {
    if (!slideRef.current) return;
    const t = toast.loading("Gerando PNG...");
    try {
      const canvas = await captureNode(slideRef.current);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fechamento_${operadora}_${mesKey}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
      toast.success("PNG exportado", { id: t });
    } catch (e) {
      console.error(e);
      toast.error("Falha ao exportar PNG", { id: t });
    }
  }

  async function exportPDF() {
    const t = toast.loading("Gerando PDF...");
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1672, 941], hotfixes: ["px_scaling"] });

      if (isConsolidado) {
        // render off-screen container
        const wrap = document.createElement("div");
        wrap.style.cssText = "position:fixed;left:-99999px;top:0;";
        document.body.appendChild(wrap);

        // Cover
        const { createRoot } = await import("react-dom/client");
        const React = await import("react");

        async function renderAndCapture(el: React.ReactElement) {
          const host = document.createElement("div");
          wrap.appendChild(host);
          const root = createRoot(host);
          root.render(el);
          await new Promise((r) => setTimeout(r, 250));
          const canvas = await html2canvas(host.firstChild as HTMLElement, { scale: 2, backgroundColor: C.bg, useCORS: true, width: 1672, height: 941, windowWidth: 1672 });
          root.unmount();
          host.remove();
          return canvas.toDataURL("image/jpeg", 0.92);
        }

        const coverImg = await renderAndCapture(React.createElement(CoverSlide, { mesNome, ano, totalOps: operadorasList.length, totalDem: filtered.length }));
        pdf.addImage(coverImg, "JPEG", 0, 0, 1672, 941);

        for (const { op, arr } of operadorasList) {
          const data = buildSlideData(arr, op, mesNome, ano);
          const img = await renderAndCapture(React.createElement(SlideCard, { data }));
          pdf.addPage([1672, 941], "landscape");
          pdf.addImage(img, "JPEG", 0, 0, 1672, 941);
        }
        wrap.remove();
        pdf.save(`Fechamento_Consolidado_${mesNome}_${ano}.pdf`);
      } else {
        if (!slideRef.current) return;
        const canvas = await captureNode(slideRef.current);
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 1672, 941);
        pdf.save(`fechamento_${operadora}_${mesKey}.pdf`);
      }
      toast.success("PDF exportado", { id: t });
    } catch (e) {
      console.error(e);
      toast.error("Falha ao gerar PDF", { id: t });
    }
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 overflow-auto p-6 animate-fade-in">
      <div className="max-w-[1720px] mx-auto">
        <div className="flex items-center justify-between mb-4 sticky top-0 z-10 glass rounded-xl px-4 py-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-accent">Relatório de Fechamento</div>
            <div className="font-semibold">{isConsolidado ? `Consolidado · ${operadorasList.length} operadora(s)` : operadora} · {mesNome} {ano}</div>
          </div>
          <div className="flex items-center gap-2">
            {!isConsolidado && (
              <button onClick={exportPNG} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border hover:border-primary/50 text-sm">
                <FileImage className="w-4 h-4" /> PNG
              </button>
            )}
            <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-[var(--glow-primary)]">
              <Download className="w-4 h-4" /> {isConsolidado ? `PDF (${operadorasList.length + 1} páginas)` : "PDF"}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {isConsolidado ? (
          <div className="space-y-6">
            <div ref={slideRef}>
              <CoverSlide mesNome={mesNome} ano={ano} totalOps={operadorasList.length} totalDem={filtered.length} />
            </div>
            {operadorasList.map(({ op, arr }) => (
              <SlideCard key={op} data={buildSlideData(arr, op, mesNome, ano)} />
            ))}
            {operadorasList.length === 0 && (
              <div className="glass rounded-xl p-10 text-center text-muted-foreground">Nenhuma demanda no período.</div>
            )}
          </div>
        ) : (
          <div ref={slideRef} className="mx-auto">
            {singleData && <SlideCard data={singleData} />}
          </div>
        )}
      </div>
    </div>
  );
}
