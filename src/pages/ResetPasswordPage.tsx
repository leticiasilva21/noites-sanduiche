import { useState } from "react";
import { AuthCard, inputClass, PrimaryButton } from "../components/AuthCard";

interface Props {
  onUpdatePassword: (password: string) => Promise<string | null>;
  onCancel: () => void;
}

/** Aberta quando o usuário volta pelo link do e-mail de recuperação (evento PASSWORD_RECOVERY). */
export function ResetPasswordPage({ onUpdatePassword, onCancel }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setLoading(true);
    const err = await onUpdatePassword(password);
    setLoading(false);
    if (err) setError(err);
  }

  return (
    <AuthCard subtitle="Crie sua nova senha">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--cd-muted)]">Nova senha</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--cd-muted)]">Confirmar nova senha</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>

        <p className="text-xs text-[var(--cd-muted)]">
          A nova senha também vale para o Carpediem Insights (mesma conta).
        </p>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        <PrimaryButton disabled={loading}>{loading ? "Salvando..." : "Salvar nova senha"}</PrimaryButton>

        <button
          type="button"
          onClick={onCancel}
          className="w-full text-center text-xs font-medium text-[var(--cd-muted)] hover:underline"
        >
          Cancelar
        </button>
      </form>
    </AuthCard>
  );
}
