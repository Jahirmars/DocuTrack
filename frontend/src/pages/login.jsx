import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/auth-context.jsx";
import axios from "axios";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrMsg("");
  };

  const emailOk = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    [form.email]
  );

  const validate = () => {
    if (!form.email.trim()) return "Ingresa tu correo electrónico.";
    if (!emailOk) return "Ingresa un correo válido.";
    if (!form.password.trim()) return "Ingresa tu contraseña.";
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
      const res = await axios.post("http://localhost:4000/api/auth/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const { token, user } = res.data || {};
      if (!token || !user?.role) throw new Error("Respuesta de login incompleta.");

      login(token, user.role, user);
      navigate(user.role === "ADMIN" ? "/admin" : "/user");
    } catch (err) {
      const apiErr =
        err.response?.data?.error ||
        err.message ||
        "Error al iniciar sesión. Inténtalo nuevamente.";
      setErrMsg(apiErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100 flex items-center justify-center px-6 py-12">
      {/* Card 2 columnas con altura controlada y sin scroll horizontal */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-900/60 backdrop-blur-md lg:h-[66vh] xl:h-[70vh]">
        {/* Columna visual (imagen temática de documentos), escalada para cubrir sin slide */}
        <div className="relative hidden lg:block h-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-sky-500/10 to-cyan-500/10 pointer-events-none" />
          <img
            src="https://images.unsplash.com/photo-1516387938699-a93567ec168e?q=80&w=1600&auto=format&fit=crop"
            alt="Documentos firmados y gestión segura"
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
          <div className="absolute inset-0 p-10 flex flex-col justify-end bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none">
            <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-sky-400">
              DocuTrack
            </h2>
            <p className="text-slate-300 mt-2">
              Accede para continuar con la validación y emisión de certificados.
            </p>
          </div>
        </div>

        {/* Columna formulario (scroll vertical independiente si hace falta) */}
        <div className="p-8 lg:p-10 h-full overflow-y-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Iniciar sesión
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Ingresa tus credenciales para continuar.
            </p>
          </header>

          {errMsg && (
            <div className="mb-5 rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-200 text-sm px-4 py-3">
              {errMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Password */}
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
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
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
            </div>

            {/* Extras: recordar/recuperar */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-400"
                  defaultChecked
                />
                Recuérdame
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-cyan-300 hover:text-cyan-200 transition underline-offset-2 hover:underline"
              >
                ¿Olvidaste la contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-medium py-3 shadow-lg shadow-cyan-900/30 transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  Ingresando…
                </>
              ) : (
                "Ingresar"
              )}
            </button>

            <p className="text-center text-sm text-slate-300">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="text-cyan-300 hover:text-cyan-200 transition underline-offset-2 hover:underline"
              >
                Regístrate aquí
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}