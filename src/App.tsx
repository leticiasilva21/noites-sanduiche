import { useAuth, displayIdentity, isSharedAccount } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { Dashboard } from "./pages/Dashboard";

export default function App() {
  const { user, loading, recovering, signIn, signOut, requestPasswordReset, updatePassword } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSignIn={signIn} onRequestReset={requestPasswordReset} />;
  }

  if (recovering) {
    return <ResetPasswordPage onUpdatePassword={updatePassword} onCancel={signOut} />;
  }

  return (
    <Dashboard
      userEmail={displayIdentity(user.email ?? "")}
      canEditMarkup={!isSharedAccount(user.email ?? "")}
      onSignOut={signOut}
    />
  );
}
