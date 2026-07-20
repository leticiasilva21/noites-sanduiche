import { useAuth, displayIdentity } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard";

export default function App() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSignIn={signIn} />;
  }

  return <Dashboard userEmail={displayIdentity(user.email ?? "")} onSignOut={signOut} />;
}
