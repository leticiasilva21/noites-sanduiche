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

export interface SandwichApplyLogRow {
  id: string;
  sandwich_night_id: string | null;
  master_listing_id: string;
  calendar_date: string;
  action: "apply" | "revert";
  price_before: number | null;
  price_after: number | null;
  ok: boolean;
  error: string | null;
  created_at: string;
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

export function useSandwichNights(from: string, to: string) {
  return useAsync<SandwichNightRow[]>(async () => {
    const { data, error } = await supabase
      .from("pricing_sandwich_nights")
      .select("*")
      .gte("updated_at", `${from}T00:00:00`)
      .lte("updated_at", `${to}T23:59:59`)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as SandwichNightRow[];
  }, [from, to]);
}

export function useSandwichApplyLog(from: string, to: string) {
  return useAsync<SandwichApplyLogRow[]>(async () => {
    const { data, error } = await supabase
      .from("pricing_sandwich_apply_log")
      .select("*")
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as SandwichApplyLogRow[];
  }, [from, to]);
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
