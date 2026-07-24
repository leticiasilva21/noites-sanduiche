import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface SandwichNightRow {
  id: string;
  master_listing_id: string;
  master_listing_id_short: string | null;
  nome_interno: string | null;
  calendar_date: string;
  status: "candidate" | "applied" | "reverted" | "booked";
  base_rate_2n: number | null;
  applied_price: number | null;
  detected_at: string;
  applied_at: string | null;
  reverted_at: string | null;
  reverted_reason: string | null;
  reservation_id: string | null;
  reservation_price: number | null;
  reservation_channel: string | null;
}

export interface SandwichScanState {
  next_offset: number;
  last_full_pass_at: string | null;
  last_run_at: string | null;
}

function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fn().then((res) => {
      if (!cancelled) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  return { data, loading, refetch: () => setReloadKey((k) => k + 1) };
}

async function fetchNights(from: string, to: string): Promise<SandwichNightRow[]> {
  const { data, error } = await supabase
    .from("pricing_sandwich_nights")
    .select("*")
    .gte("updated_at", `${from}T00:00:00`)
    .lte("updated_at", `${to}T23:59:59`)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SandwichNightRow[];
}

/**
 * Além da busca inicial, assina mudanças em tempo real (Supabase Realtime) na tabela — assim
 * os cartões de resumo e a tabela reagem na hora quando a automação aplica/reverte um pacote,
 * sem precisar clicar em "Atualizar". Requer a tabela publicada em `supabase_realtime`.
 */
export function useSandwichNights(from: string, to: string) {
  const [data, setData] = useState<SandwichNightRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchNights(from, to).then((rows) => {
      if (!cancelled) {
        setData(rows);
        setLoading(false);
      }
    });

    const channel = supabase
      .channel("pricing_sandwich_nights_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pricing_sandwich_nights" },
        (payload) => {
          setData((prev) => {
            const list = prev ? [...prev] : [];
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id?: string })?.id;
              return list.filter((r) => r.id !== oldId);
            }
            const row = payload.new as unknown as SandwichNightRow;
            const idx = list.findIndex((r) => r.id === row.id);
            if (idx >= 0) list[idx] = row;
            else list.unshift(row);
            return list;
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, reloadKey]);

  return { data, loading, refetch: () => setReloadKey((k) => k + 1) };
}

/** Dispara a reversão manual (botão "Reverter") — chama a edge function, que confirma na Stays. */
export async function revertSandwichNight(id: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke("pricing-sandwich-nights", {
    body: { action: "manual_revert", id },
  });
  if (error) return { ok: false, error: error.message };
  if (data?.error) return { ok: false, error: data.error };
  return { ok: true };
}

export function useSandwichScanState() {
  return useAsync<SandwichScanState | null>(async () => {
    const { data, error } = await supabase
      .from("pricing_sandwich_scan_state")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as SandwichScanState | null;
  }, []);
}

export interface SandwichConfig {
  markup: number;
  updated_at: string;
  updated_by: string | null;
}

export function useSandwichConfig() {
  return useAsync<SandwichConfig | null>(async () => {
    const { data, error } = await supabase
      .from("pricing_sandwich_config")
      .select("markup, updated_at, updated_by")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as SandwichConfig | null;
  }, []);
}

/**
 * Atualiza o multiplicador. Protegido por RLS: só quem logou com e-mail real (não a conta
 * compartilhada) tem permissão de UPDATE nessa tabela — se uma conta sem permissão chamar,
 * o Supabase recusa e retorna erro (a UI já esconde o controle nesse caso, isso é defesa
 * em profundidade, não a única barreira).
 */
export async function updateSandwichMarkup(
  markup: number,
  updatedBy: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("pricing_sandwich_config")
    .update({ markup, updated_at: new Date().toISOString(), updated_by: updatedBy })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
