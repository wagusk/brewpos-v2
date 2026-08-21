import { useState } from "react";
import { Coffee } from "lucide-react";
import { api } from "../api";
import type { User } from "../types";

export default function Login({
  onLogin,
}: {
  onLogin: (user: User, token: string) => void;
}) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (pin.length < 3) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.login(pin);
      onLogin(result.user, result.access_token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">
          <Coffee size={26} />
        </div>
        <p className="eyebrow">Brew-POS</p>
        <h1>Sign in to your workspace</h1>
        <p className="muted">Use your staff PIN to continue.</p>
        <div className="pin-display" aria-label="PIN">
          {pin ? "•".repeat(pin.length) : "Enter PIN"}
        </div>
        <div className="pin-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} onClick={() => pin.length < 8 && setPin(pin + n)}>
              {n}
            </button>
          ))}
          <button onClick={() => setPin("")}>Clear</button>
          <button onClick={() => pin.length < 8 && setPin(pin + "0")}>0</button>
          <button onClick={() => setPin(pin.slice(0, -1))}>⌫</button>
        </div>
        {error && <div className="alert error">{error}</div>}
        <button
          className="primary full"
          disabled={busy || pin.length < 3}
          onClick={submit}
        >
          {busy ? "Signing in…" : "Continue"}
        </button>
      </section>
    </main>
  );
}
