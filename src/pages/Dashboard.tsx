import { useMemo, useState } from "react";
import {
  Sandwich,
  RefreshCw,
  ExternalLink,
  LogOut,
  X,
  Undo2,
  Loader2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import logoWhite from "../assets/logo-white.png";
import {
  useSandwichNights,
  useSandwichScanState,
  revertSandwichNight,
  type SandwichNightRow,
} from "../hooks/useSandwichData";

type PeriodKey = "hoje" | "7d" | "30d" | "custom";
type StatusFilter = "all" | SandwichNightRow["status"];
type SortKey = "nome_interno" | "calendar_date" | "base_rate_2n" | "applied_price" | "status";
type SortDirection = "asc" | "desc";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildPeriod(key: PeriodKey, customFrom: string, customTo: string): { from: string; to: string } {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (key === "custom") return { from: customFrom || isoDate(today), to: customTo || isoDate(today) };
  const days = key === "hoje" ? 0 : key === "7d" ? 7 : 30;
  const start = new Date(today.getTime() - days * 86_400_000);
  return { from: isoDate(start), to: isoDate(today) };
}

function brl(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

const STATUS_STYLE: Record<SandwichNightRow["status"], { label: string; className: string }> = {
  candidate: { label: "Pendente", className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200" },
  applied: { label: "Aplicada", className: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" },
  reverted: { label: "Revertida", className: "bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200" },
  booked: { label: "Reservada", className: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200" },
};

function StatusBadge({ status }: { status: SandwichNightRow["status"] }) {
  const s = STATUS_STYLE[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--cd-border)] bg-white ${className}`}>{children}</div>
  );
}

function KpiCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-[var(--cd-muted)]">{label}</p>
      <p
        className="mt-1 text-2xl font-bold tabular-nums"
        style={{ color: accent ? "var(--cd-orange)" : "var(--cd-navy)" }}
      >
        {value}
      </p>
    </Card>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  align?: "left" | "right" | "center";
}) {
  const isActive = sortKey === activeKey;
  const Icon = isActive ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  const justifyClass = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  return (
    <th className={`px-4 py-2 font-medium ${alignClass}`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 ${justifyClass} w-full text-xs font-medium transition ${
          isActive ? "text-[var(--cd-navy)]" : "text-[var(--cd-muted)] hover:text-[var(--cd-navy)]"
        }`}
      >
        {label}
        <Icon className={`h-3 w-3 ${isActive ? "opacity-100" : "opacity-40"}`} />
      </button>
    </th>
  );
}

const inputClass =
  "rounded-lg border border-[var(--cd-border)] bg-white px-3 py-2 text-sm text-[var(--cd-fg)] outline-none focus:border-[var(--cd-orange)] focus:ring-1 focus:ring-[var(--cd-orange)]";

interface DashboardProps {
  userEmail: string;
  onSignOut: () => void;
}

export function Dashboard({ userEmail, onSignOut }: DashboardProps) {
  const [periodKey, setPeriodKey] = useState<PeriodKey>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [checkinFrom, setCheckinFrom] = useState("");
  const [checkinTo, setCheckinTo] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("calendar_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedNight, setSelectedNight] = useState<SandwichNightRow | null>(null);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [revertError, setRevertError] = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const { from, to } = useMemo(() => buildPeriod(periodKey, customFrom, customTo), [periodKey, customFrom, customTo]);

  const { data: nights, loading: nightsLoading, refetch } = useSandwichNights(from, to);
  const { data: scanState } = useSandwichScanState();

  const filteredNights = useMemo(() => {
    let list = nights ?? [];
    if (statusFilter !== "all") {
      list = list.filter((n) => n.status === statusFilter);
    }
    if (checkinFrom) {
      list = list.filter((n) => n.calendar_date >= checkinFrom);
    }
    if (checkinTo) {
      list = list.filter((n) => n.calendar_date <= checkinTo);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((n) => (n.nome_interno ?? "").toLowerCase().includes(term));
    }
    return list;
  }, [nights, search, statusFilter, checkinFrom, checkinTo]);

  const sortedNights = useMemo(() => {
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...filteredNights].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), "pt-BR") * dir;
    });
  }, [filteredNights, sortKey, sortDirection]);

  const kpis = useMemo(() => {
    const list = nights ?? [];
    return {
      total: list.length,
      applied: list.filter((n) => n.status === "applied").length,
      reverted: list.filter((n) => n.status === "reverted").length,
      booked: list.filter((n) => n.status === "booked").length,
    };
  }, [nights]);

  const bookedNights = useMemo(() => (nights ?? []).filter((n) => n.status === "booked"), [nights]);

  async function handleRevert(id: string) {
    setRevertError(null);
    setRevertingId(id);
    const res = await revertSandwichNight(id);
    setRevertingId(null);
    if (!res.ok) {
      setRevertError(res.error ?? "Falha ao reverter");
      return;
    }
    refetch();
  }

  return (
    <div className="min-h-screen bg-[var(--cd-bg)] text-[var(--cd-fg)]">
      <header
        className="flex items-center justify-between px-6 py-3.5"
        style={{ background: "var(--cd-navy)" }}
      >
        <div className="flex items-center gap-3">
          <img src={logoWhite} alt="Carpediem Homes" className="h-6 w-auto" />
          <span className="h-5 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <Sandwich className="h-4 w-4" style={{ color: "var(--cd-orange)" }} />
            <h1 className="text-sm font-semibold text-white">Noites Sanduíche</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/70">
          <span>{userEmail}</span>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-6">
        {/* Filtros */}
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--cd-muted)]">Data da alteração</label>
              <div className="flex items-center gap-2">
                <select
                  value={periodKey}
                  onChange={(e) => setPeriodKey(e.target.value as PeriodKey)}
                  className={inputClass}
                >
                  <option value="hoje">Hoje</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Último mês</option>
                  <option value="custom">Personalizado</option>
                </select>

                {periodKey === "custom" && (
                  <>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className={inputClass}
                    />
                    <span className="text-sm text-[var(--cd-muted)]">até</span>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className={inputClass}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--cd-muted)]">Check-in do pacote</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={checkinFrom}
                  onChange={(e) => setCheckinFrom(e.target.value)}
                  className={inputClass}
                />
                <span className="text-sm text-[var(--cd-muted)]">até</span>
                <input
                  type="date"
                  value={checkinTo}
                  onChange={(e) => setCheckinTo(e.target.value)}
                  className={inputClass}
                />
                {(checkinFrom || checkinTo) && (
                  <button
                    onClick={() => {
                      setCheckinFrom("");
                      setCheckinTo("");
                    }}
                    className="text-[var(--cd-muted)] hover:text-[var(--cd-fg)]"
                    title="Limpar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--cd-muted)]">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className={inputClass}
              >
                <option value="all">Todos os status</option>
                <option value="candidate">Pendente</option>
                <option value="applied">Aplicada</option>
                <option value="booked">Reservada</option>
                <option value="reverted">Revertida</option>
              </select>
            </div>

            <div className="flex min-w-[180px] flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-[var(--cd-muted)]">Imóvel</label>
              <input
                placeholder="Buscar imóvel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              onClick={refetch}
              className="flex items-center gap-2 rounded-lg border border-[var(--cd-border)] px-3 py-2 text-sm text-[var(--cd-navy)] transition hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>

          {scanState && (
            <p className="text-xs text-[var(--cd-muted)]">
              {scanState.last_full_pass_at
                ? `Última passada completa: ${new Date(scanState.last_full_pass_at).toLocaleString("pt-BR")}`
                : "Varredura em andamento — ainda não completou uma passada hoje"}
            </p>
          )}
        </Card>

        {revertError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
            Erro ao reverter: {revertError}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Noites sanduíche no período" value={kpis.total} />
          <KpiCard label="Pacotes aplicados" value={kpis.applied} accent />
          <KpiCard label="Revertidos" value={kpis.reverted} />
          <KpiCard label="Reservadas (venderam a noite avulsa)" value={kpis.booked} />
        </div>

        {/* Reservas — clicável */}
        {bookedNights.length > 0 && (
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--cd-navy)" }}>
              Reservas feitas em cima de pacotes de 1 noite
            </h3>
            <div className="flex flex-wrap gap-2">
              {bookedNights.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNight(n)}
                  className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs transition hover:bg-blue-100"
                >
                  <Sandwich className="h-3.5 w-3.5 text-blue-600" />
                  <span className="font-medium text-[var(--cd-navy)]">{n.nome_interno}</span>
                  <span className="text-[var(--cd-muted)]">{n.calendar_date}</span>
                  <ExternalLink className="h-3 w-3 text-[var(--cd-muted)]" />
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Tabela: noites sanduíche */}
        <Card className="overflow-hidden">
          <div className="border-b border-[var(--cd-border)] px-4 py-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--cd-navy)" }}>
              Noites sanduíche detectadas
            </h3>
          </div>
          {nightsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : sortedNights.length === 0 ? (
            <div className="p-12 text-center text-[var(--cd-muted)]">
              <Sandwich className="mx-auto mb-3 h-10 w-10 opacity-30" />
              Nenhuma noite sanduíche no período selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--cd-border)] bg-gray-50 text-left text-xs text-[var(--cd-muted)]">
                    <SortableHeader label="Imóvel" sortKey="nome_interno" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                    <SortableHeader label="Data" sortKey="calendar_date" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                    <SortableHeader label="Base (2n)" sortKey="base_rate_2n" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="right" />
                    <SortableHeader label="Tarifa 1 noite" sortKey="applied_price" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="right" />
                    <SortableHeader label="Status" sortKey="status" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="center" />
                    <th className="px-4 py-2 text-center font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedNights.map((n) => {
                    const canRevert = n.status === "applied" || n.status === "booked";
                    return (
                      <tr
                        key={n.id}
                        className="border-b border-[var(--cd-border)] last:border-0"
                      >
                        <td
                          className={`px-4 py-2.5 font-medium ${n.status === "booked" ? "cursor-pointer" : ""}`}
                          style={{ color: "var(--cd-navy)" }}
                          onClick={() => n.status === "booked" && setSelectedNight(n)}
                        >
                          {n.nome_interno}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--cd-muted)]">{n.calendar_date}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-[var(--cd-muted)]">
                          {brl(n.base_rate_2n)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium text-[var(--cd-fg)]">
                          {brl(n.applied_price)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <StatusBadge status={n.status} />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {canRevert ? (
                            <button
                              onClick={() => handleRevert(n.id)}
                              disabled={revertingId === n.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-[var(--cd-border)] px-2.5 py-1 text-xs text-[var(--cd-navy)] transition hover:bg-gray-50 disabled:opacity-50"
                            >
                              {revertingId === n.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Undo2 className="h-3.5 w-3.5" />
                              )}
                              Reverter
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {selectedNight && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedNight(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--cd-border)] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold" style={{ color: "var(--cd-navy)" }}>
                Reserva na noite avulsa
              </h3>
              <button
                onClick={() => setSelectedNight(null)}
                className="text-[var(--cd-muted)] hover:text-[var(--cd-fg)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-[var(--cd-muted)]">Imóvel</p>
                <p className="font-medium text-[var(--cd-fg)]">{selectedNight.nome_interno}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[var(--cd-muted)]">Data</p>
                  <p className="font-medium text-[var(--cd-fg)]">{selectedNight.calendar_date}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--cd-muted)]">Canal</p>
                  <p className="font-medium text-[var(--cd-fg)]">
                    {selectedNight.reservation_channel ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--cd-muted)]">Valor da reserva</p>
                  <p className="font-medium text-[var(--cd-fg)]">{brl(selectedNight.reservation_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--cd-muted)]">Tarifa do pacote</p>
                  <p className="font-medium text-[var(--cd-fg)]">{brl(selectedNight.applied_price)}</p>
                </div>
              </div>
              {selectedNight.reservation_id && (
                <p className="text-xs text-[var(--cd-muted)]">Reserva #{selectedNight.reservation_id}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
