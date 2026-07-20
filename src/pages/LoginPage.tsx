import { useState } from "react";
import logoWhite from "../assets/logo-white.png";

interface Props {
  onSignIn: (email: string, password: string) => Promise<string | null>;
}

export function LoginPage({ onSignIn }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const err = await onSignIn(email, password);
    if (err) setError(err);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--cd-bg)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--cd-border)] bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-40 items-center justify-center rounded-xl"
            style={{ background: "var(--cd-navy)" }}
          >
            <img src={logoWhite} alt="Carpediem Homes" className="h-8 w-auto" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--cd-navy)" }}>
            Noites Sanduíche
          </h1>
          <p className="mt-1 text-sm text-[var(--cd-muted)]">Acesso restrito ao time interno</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--cd-muted)]">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--cd-border)] bg-white px-4 py-3 text-sm text-[var(--cd-fg)] placeholder-gray-400 outline-none focus:border-[var(--cd-orange)] focus:ring-1 focus:ring-[var(--cd-orange)]"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--cd-muted)]">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--cd-border)] bg-white px-4 py-3 text-sm text-[var(--cd-fg)] placeholder-gray-400 outline-none focus:border-[var(--cd-orange)] focus:ring-1 focus:ring-[var(--cd-orange)]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error === "Invalid login credentials" ? "E-mail ou senha inválidos." : error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-3 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: "var(--cd-orange)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cd-orange-dark)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--cd-orange)")}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
