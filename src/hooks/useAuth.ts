import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** true quando o usuário chegou pelo link de "recuperar senha" e ainda não definiu a nova. */
  recovering: boolean;
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

/**
 * true pra contas de usuário compartilhado (ex.: "Cdhnoites"), false pra e-mails reais.
 * Usado pra restringir ações sensíveis (ex.: mudar o multiplicador) a quem loga com e-mail
 * próprio — a mesma regra já é reforçada por RLS no banco, isso aqui só evita mostrar um
 * controle que o servidor vai rejeitar de qualquer forma.
 */
export function isSharedAccount(email: string): boolean {
  return email.endsWith(`@${SHARED_LOGIN_DOMAIN}`);
}

// Usa o mesmo login (Supabase Auth) do Carpe Diem Insights — mesmo projeto, mesmas contas.
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    recovering: false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({ ...prev, session, user: session?.user ?? null, loading: false }));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setState((prev) => ({
        session,
        user: session?.user ?? null,
        loading: false,
        recovering: event === "PASSWORD_RECOVERY" ? true : event === "SIGNED_OUT" ? false : prev.recovering,
      }));
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

  /** Manda o e-mail com o link de redefinição; o link volta pra este site (ver PASSWORD_RECOVERY acima). */
  async function requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
    });
    return error?.message ?? null;
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setState((prev) => ({ ...prev, recovering: false }));
    return error?.message ?? null;
  }

  return { ...state, signIn, signOut, requestPasswordReset, updatePassword };
}
