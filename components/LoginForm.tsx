"use client";

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("admin@keptos.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      setError("Credenciales invalidas");
      return;
    }
    window.location.href = "/";
  };
  return (
    <form className="login-card" onSubmit={submit}>
      <div className="brand-mark">K</div>
      <h1>Keptos Analytics</h1>
      <p>Acceso al centro de performance de casinos.</p>
      <div className="field"><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <button className="action primary" style={{ width: "100%", justifyContent: "center" }}>Entrar</button>
      {error ? <div className="error">{error}</div> : null}
      <p style={{ marginTop: 16, fontSize: 12 }}>Usuarios demo: direccion@keptos.local, operaciones@keptos.local, villahermosa@keptos.local.</p>
    </form>
  );
}
