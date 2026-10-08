import type { ReactNode } from "react";
import logoWhite from "../assets/logo-white.png";

export const inputClass =
  "w-full rounded-lg border border-[var(--cd-border)] bg-white px-4 py-3 text-sm text-[var(--cd-fg)] placeholder-gray-400 outline-none focus:border-[var(--cd-orange)] focus:ring-1 focus:ring-[var(--cd-orange)]";

/** Moldura comum das telas de login, recuperação e nova senha. */
export function AuthCard({ subtitle, children }: { subtitle: string; children: ReactNode }) {
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
          <p className="mt-1 text-sm text-[var(--cd-muted)]">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PrimaryButton({ disabled, children }: { disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full rounded-lg py-3 text-sm font-semibold text-white transition disabled:opacity-50"
      style={{ background: "var(--cd-orange)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cd-orange-dark)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--cd-orange)")}
    >
      {children}
    </button>
  );
}
