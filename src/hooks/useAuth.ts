import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

// Domínio sintético p/ contas "usuário" (sem e-mail real) compartilháveis, ex.: conta de
// visualização geral do time. Supabase Auth exige formato de e-mail; quem loga digita só o
// usuário (sem @) e aqui completamos com esse domínio fixo antes de chamar a API.
const SHARED_LOGIN_DOMAIN = "compartilhado.internal";

function resolveLoginEmail(identifier: string): string {
  const trimmed = identifier.trim();
  return trimmed.includes("@") ? trimmed : `${trimmed.toLowerCase()}@${SHARED_LOGIN_DOMAIN}`;
}

/** Pro cabeçalho: mostra só o usuário nas contas compartilhadas, e-mail completo nas demais. */
export function displayIdentity(email: string): string {
  return email.endsWith(`@${SHARED_LOGIN_DOMAIN}`) ? email.split("@")[0] : email;
}

// Usa o mesmo login (Supabase Auth) do Carpe Diem Insights — mesmo projeto, mesmas contas.
export function useAuth() {
  const [state, setState] = useState<AuthState>({ session: null, user: null, loading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ session, user: session?.user ?? null, loading: false });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, user: session?.user ?? null, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(identifier: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: resolveLoginEmail(identifier),
      password,
    });
    return error?.message ?? null;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { ...state, signIn, signOut };
}
