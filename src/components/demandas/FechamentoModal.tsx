import { useMemo, useRef } from "react";
import type { Demanda } from "@/lib/demandas";
import { MESES, TIPOS, mesDaData } from "@/lib/demandas";
import { X, Download, FileImage } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

const ACOES: Record<string, string> = {
  "Link de assinatura": "Automatizar envio de links via API e criar template padrão",
  "Modificar Cadastro": "Padronizar formulário de atualização e checklist de campos obrigatórios",
  "Cadastro não localizado": "Auditoria mensal de base + integração com sistema da operadora",
  "Reenvio de assinatura médica": "Alerta automático 24h antes do vencimento para médicas responsáveis",
  "Aguardando assinatura do médico": "Dashboard exclusivo para médicas com fila priorizada por SLA",
  "Agendamento EQ": "Bloqueio antecipado de agenda com confirmação 48h antes",
  "Reagendamento EQ": "SLA rigoroso de 24h para reagendamento e canal direto com paciente",
  "N° Incorreto": "Validação de telefone no momento do cadastro + confirmação por SMS",
  "Outro": "Categorizar demandas recorrentes para criar novo tipo específico",
};

const COLORS = ["#7c6af7", "#F47B20", "#00c17c", "#eab308", "#3b82f6", "#a855f7", "#ef4444", "#06b6d4", "#f59e0b"];

export function FechamentoModal({
  demandas, operadora, mesKey, onClose,
}: { demandas: Demanda[]; operadora: string | "TODAS"; mesKey: string; onClose: () => void }) {
  const slideRef = useRef<HTMLDivElement>(null);

  const [ano, mes] = mesKey.split("-");
  const mesNome = MESES[parseInt(mes) - 1] || "";

  const filtered = useMemo(() => demandas.filter((d) => {
    if (mesDaData(d.data).key !== mesKey) return false;
    if (operadora !== "TODAS" && d.operadora !== operadora) return false;
    return true;
  }), [demandas, mesKey, operadora]);

  const total = filtered.length;
  const tipos = useMemo(() => TIPOS
    .map((t) => ({ name: t, value: filtered.filter((d) => d.tipo === t).length }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value), [filtered]);

  const maior = tipos[0];
  const top4 = tipos.slice(0, 4);

  async function exportPNG() {
    if (!slideRef.current) return;
    toast.loading("Gerando PNG...");
    const canvas = await html2canvas(slideRef.current, { scale: 2, backgroundColor: "#0a0a0f", useCORS: true });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fechamento_${operadora}_${mesKey}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success("PNG exportado");
    });
  }
  async function exportPDF() {
    if (!slideRef.current) return;
    toast.loading("Gerando PDF...");
    const canvas = await html2canvas(slideRef.current, { scale: 2, backgroundColor: "#0a0a0f", useCORS: true });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1672, 941] });
    pdf.addImage(img, "PNG", 0, 0, 1672, 941);
    pdf.save(`fechamento_${operadora}_${mesKey}.pdf`);
    toast.dismiss();
    toast.success("PDF exportado");
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 overflow-auto p-6 animate-fade-in">
      <div className="max-w-[1700px] mx-auto">
        <div className="flex items-center justify-between mb-4 sticky top-0 z-10 glass rounded-xl px-4 py-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-accent">Relatório de Fechamento</div>
            <div className="font-semibold">{operadora === "TODAS" ? "Todas as operadoras" : operadora} · {mesNome} {ano}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportPNG} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border hover:border-primary/50 text-sm">
              <FileImage className="w-4 h-4" /> PNG
            </button>
            <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-[var(--glow-primary)]">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Slide 1672x941 */}
        <div ref={slideRef} className="mx-auto" style={{ width: 1672, height: 941, background: "#0a0a0f", color: "#fff", fontFamily: "DM Sans, sans-serif" }}>
          {/* Header laranja */}
          <div style={{ background: "linear-gradient(90deg, #F47B20, #ff9640)", padding: "28px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: 3, opacity: 0.9 }}>KnowU · Customer Success</div>
              <div style={{ fontSize: 42, fontWeight: 700, marginTop: 4 }}>Fechamento {mesNome} {ano}</div>
              <div style={{ fontSize: 20, opacity: 0.95, marginTop: 2 }}>{operadora === "TODAS" ? "Consolidado — todas as operadoras" : operadora}</div>
            </div>
          </div>

          <div style={{ padding: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            {/* Coluna esquerda */}
            <div>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div style={{ background: "linear-gradient(135deg, rgba(124,106,247,0.2), rgba(124,106,247,0.05))", border: "1px solid rgba(124,106,247,0.4)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 11, fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: 2, color: "#aaa" }}>Total de demandas</div>
                  <div style={{ fontSize: 52, fontWeight: 700, color: "#7c6af7" }}>{total}</div>
                </div>
                <div style={{ background: "linear-gradient(135deg, rgba(244,123,32,0.2), rgba(244,123,32,0.05))", border: "1px solid rgba(244,123,32,0.4)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 11, fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: 2, color: "#aaa" }}>Maior demanda</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{maior?.name ?? "—"}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#F47B20" }}>{maior?.value ?? 0}</div>
                </div>
              </div>

              {/* Donut */}
              <div style={{ background: "#111118", border: "1px solid #222", borderRadius: 16, padding: 20, height: 340 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Distribuição por tipo</div>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie data={tipos} dataKey="value" nameKey="name" innerRadius={65} outerRadius={110} paddingAngle={2}>
                      {tipos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Coluna direita: tabela com barras + plano ação */}
            <div>
              <div style={{ background: "#111118", border: "1px solid #222", borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Proporção por tipo</div>
                {tipos.map((t, i) => {
                  const pct = total ? (t.value / total) * 100 : 0;
                  return (
                    <div key={t.name} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span>{t.name}</span>
                        <span style={{ fontFamily: "DM Mono, monospace" }}>{t.value} · {pct.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "#222", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: "linear-gradient(135deg, rgba(124,106,247,0.15), rgba(244,123,32,0.1))", border: "1px solid rgba(124,106,247,0.35)", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#F47B20" }}>Plano de Ação</div>
                {top4.map((t, i) => (
                  <div key={t.name} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 12, background: COLORS[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#000", flexShrink: 0 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{ACOES[t.name] || "Análise detalhada recomendada"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
