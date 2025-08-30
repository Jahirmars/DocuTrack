import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/auth-context.jsx";
import axios from "axios";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [accepted, setAccepted] = useState(true); // ponlo en false si quieres forzar aceptación
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrMsg("");
  };

  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email), [form.email]);

  // medidor simple de fuerza
  const pwdScore = useMemo(() => {
    let score = 0;
    if (form.password.length >= 6) score++;
    if (/[A-Z]/.test(form.password)) score++;
    if (/[a-z]/.test(form.password)) score++;
    if (/\d/.test(form.password)) score++;
    if (/[^A-Za-z0-9]/.test(form.password)) score++;
    return Math.min(score, 4);
  }, [form.password]);

  const pwdLabel = ["Débil", "Básica", "Media", "Fuerte", "Sólida"][pwdScore] || "Débil";
  const pwdColor =
    pwdScore <= 1
      ? "bg-rose-500"
      : pwdScore === 2
      ? "bg-amber-500"
      : pwdScore === 3
      ? "bg-emerald-500"
      : "bg-cyan-500";

  const validate = () => {
    if (!form.name.trim()) return "Ingresa tu nombre completo.";
    if (!form.email.trim()) return "Ingresa tu correo electrónico.";
    if (!emailOk) return "Ingresa un correo válido.";
    if (form.password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    if (!accepted) return "Debes aceptar los términos para continuar.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setErrMsg(v);
      return;
    }

    setLoading(true);
    setErrMsg("");
    try {
      const res = await axios.post("http://localhost:4000/api/auth/register", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const { token, role, user } = res.data || {};
      if (!token || !role) throw new Error("Respuesta de registro incompleta.");

      login(token, role, user || { name: form.name, email: form.email });
      navigate(role === "ADMIN" ? "/admin" : "/user");
    } catch (err) {
      const apiErr =
        err.response?.data?.error ||
        err.message ||
        "Error al registrarse. Inténtalo nuevamente.";
      setErrMsg(apiErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100 flex items-center justify-center px-6 py-12">
      {/* Card moderna en 2 columnas en desktop */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-900/60 backdrop-blur-md">
        {/* Lado visual/branding con imagen temática del proyecto (documentos/certificados) */}
        <div className="relative hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-sky-500/10 to-cyan-500/10" />
          <img
            src="https://images.unsplash.com/photo-1521791055366-0d553872125f?q=80&w=1600&auto=format&fit=crop"
            alt="Gestión de documentos y certificados"
            className="h-full w-full object-cover opacity-60"
            loading="lazy"
          />
          <div className="absolute inset-0 p-10 flex flex-col justify-end bg-gradient-to-t from-slate-950/60 to-transparent">
            <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-sky-400">
              DocuTrack
            </h2>
            <p className="text-slate-300 mt-2">
              Regístrate para gestionar tus solicitudes y certificados con seguridad y
              trazabilidad.
            </p>
          </div>
        </div>

        {/* Lado del formulario */}
        <div className="p-8 lg:p-10">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Crea tu cuenta
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Completa los datos para comenzar. Solo toma un minuto.
            </p>
          </header>

          {errMsg && (
            <div className="mb-5 rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-200 text-sm px-4 py-3">
              {errMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm text-slate-300">
                Nombre completo
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                autoComplete="name"
                required
                className="w-full rounded-xl bg-slate-800/70 border border-slate-700 p-3 text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm text-slate-300">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
                required
                className={`w-full rounded-xl bg-slate-800/70 border p-3 text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 transition
                ${form.email ? (emailOk ? "border-emerald-500/60 focus-visible:ring-emerald-400" : "border-rose-400/60 focus-visible:ring-rose-400") : "border-slate-700 focus-visible:ring-cyan-400"}`}
              />
            </div>

            {/* Password + medidor */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm text-slate-300">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl bg-slate-800/70 border border-slate-700 p-3 pr-24 text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute inset-y-0 right-2 my-auto h-9 px-3 rounded-lg text-slate-200 bg-slate-800 hover:bg-slate-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 text-sm"
                  aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                  title={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPwd ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {/* Barra de fuerza */}
              <div className="mt-2">
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-2 ${pwdColor} transition-all duration-300`}
                    style={{ width: `${(pwdScore / 4) * 100}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-300">Fuerza: {pwdLabel}</span>
                  <span className="text-slate-400">Usa mayúsculas, números y símbolos</span>
                </div>
              </div>
            </div>

            {/* Términos (opcional) */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-400"
              />
              <label htmlFor="terms" className="text-sm text-slate-300">
                Acepto los términos y la política de privacidad.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-medium py-3 shadow-lg shadow-cyan-900/30 transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  Creando cuenta…
                </>
              ) : (
                "Crear cuenta"
              )}
            </button>

            <p className="text-center text-sm text-slate-300">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                className="text-cyan-300 hover:text-cyan-200 transition underline-offset-2 hover:underline"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}