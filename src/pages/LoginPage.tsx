import { useState } from "react";
import { AuthCard, inputClass, PrimaryButton } from "../components/AuthCard";

interface Props {
  onSignIn: (email: string, password: string) => Promise<string | null>;
  onRequestReset: (email: string) => Promise<string | null>;
}

export function LoginPage({ onSignIn, onRequestReset }: Props) {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: "login" | "forgot") {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const err = await onSignIn(email, password);
    if (err) setError(err);
    setLoading(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    // Contas compartilhadas (usuário sem @) usam domínio sintético e não recebem e-mail.
    if (!email.includes("@")) {
      setError("Informe o seu e-mail. Contas de usuário compartilhado não têm recuperação por e-mail — fale com o administrador.");
      return;
    }
    setLoading(true);
    const err = await onRequestReset(email);
    setLoading(false);
    if (err) setError(err);
    else setNotice("Se esse e-mail tiver acesso, você vai receber um link para criar uma nova senha. Confira também o spam.");
  }

  if (mode === "forgot") {
    return (
      <AuthCard subtitle="Recuperar senha">
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--cd-muted)]">E-mail</label>
            <input
              type="email"
              autoCapitalize="none"
              autoCorrect="off"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="voce@carpediemhomes.com.br"
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {notice && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

          <PrimaryButton disabled={loading}>{loading ? "Enviando..." : "Enviar link de recuperação"}</PrimaryButton>

          <button
            type="button"
            onClick={() => switchMode("login")}
            className="w-full text-center text-xs font-medium text-[var(--cd-muted)] hover:underline"
          >
            Voltar para o login
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard subtitle="Acesso restrito ao time interno">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--cd-muted)]">Usuário</label>
          <input
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="usuário"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--cd-muted)]">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error === "Invalid login credentials" ? "Usuário ou senha inválidos." : error}
          </div>
        )}

        <PrimaryButton disabled={loading}>{loading ? "Entrando..." : "Entrar"}</PrimaryButton>

        <button
          type="button"
          onClick={() => switchMode("forgot")}
          className="w-full text-center text-xs font-medium hover:underline"
          style={{ color: "var(--cd-orange)" }}
        >
          Esqueci minha senha
        </button>
      </form>
    </AuthCard>
  );
}
