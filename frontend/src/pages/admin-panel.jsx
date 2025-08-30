import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/auth-context";

export default function AdminPanel() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI -> DB: lo que la DB acepta
  const STATUS_MAP = {
    "En revisión": "Pendiente",
    Rechazado: "Rechazado",
    Emitido: "Emitido",
  };

  // DB -> UI: lo que mostramos al usuario
  const renderStatus = (dbStatus) => (dbStatus === "Pendiente" ? "En revisión" : dbStatus);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:4000/api/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al obtener solicitudes:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchRequests();
  }, [token, fetchRequests]);

  const handleStatusChange = async (id, uiStatus) => {
    try {
      const status = STATUS_MAP[uiStatus] || uiStatus; // normaliza a valores aceptados por la DB
      const res = await fetch(`http://localhost:4000/api/requests/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "No se pudo actualizar el estado");
      }
      // Actualiza con el valor guardado (DB)
      setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status } : req)));
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      alert(err.message || "No se pudo actualizar el estado.");
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await fetch(`http://localhost:4000/api/requests/${id}/file`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Archivo no disponible");
      const { file_url } = await res.json();
      if (file_url) window.open(file_url, "_blank");
      else alert("Esta solicitud no tiene archivo adjunto.");
    } catch (err) {
      console.error("Error al descargar archivo:", err);
      alert("No se pudo descargar el archivo.");
    }
  };

  // Usa la clase según el valor en DB, pero recuerda que Pendiente se muestra como En revisión
  const statusChip = (dbStatus) =>
    dbStatus === "Emitido"
      ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
      : dbStatus === "Rechazado"
      ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"
      : dbStatus === "Pendiente"
      ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30"
      : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-sky-400">
            Panel de administración
          </h1>
          <p className="text-slate-300">
            Revisa, valida y emite certificados con trazabilidad. Descarga los documentos originales cuando los necesites.
          </p>
        </header>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-cyan-300">Solicitudes en gestión</h2>
            <p className="text-sm text-slate-300 mt-1">Supervisa el avance y toma acciones sobre cada trámite.</p>
          </div>
          {!loading && (
            <button
              onClick={fetchRequests}
              className="text-sm text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg px-3 py-1.5"
              title="Actualizar"
              aria-label="Actualizar lista"
            >
              Actualizar
            </button>
          )}
        </div>

        {loading && (
          <div className="grid gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-800 bg-slate-800/60 p-6">
                <div className="h-5 w-64 bg-slate-700 rounded mb-3" />
                <div className="h-4 w-40 bg-slate-700 rounded mb-2" />
                <div className="h-4 w-72 bg-slate-700 rounded mb-2" />
                <div className="h-4 w-52 bg-slate-700 rounded mb-4" />
                <div className="h-9 w-80 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="text-center rounded-2xl border border-slate-800 bg-slate-800/60 p-12">
            <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
              <span className="text-2xl">📂</span>
            </div>
            <p className="text-lg font-medium">No hay solicitudes registradas</p>
            <p className="text-slate-400">Cuando existan nuevas solicitudes, aparecerán aquí.</p>
          </div>
        )}

        {!loading &&
          requests.length > 0 &&
          requests.map((req) => (
            <article
              key={req.id}
              className="group relative rounded-2xl p-[1px] bg-gradient-to-r from-slate-700/40 via-slate-600/30 to-slate-700/40 hover:from-cyan-500/25 hover:via-sky-500/20 hover:to-cyan-500/25 transition-all duration-300"
            >
              <div className="rounded-2xl bg-slate-900/70 backdrop-blur-xl p-6 border border-slate-800 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-cyan-500/15 text-cyan-300 grid place-items-center ring-1 ring-cyan-400/20">
                      <span className="text-lg">🧾</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">
                        {req.details?.nombre || "Nombre no especificado"}
                      </h3>
                      <p className="text-sm text-slate-300">
                        Cédula: <span className="text-slate-100">{req.details?.cedula || "N/D"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusChip(req.status)}`}>
                      {renderStatus(req.status)}
                    </span>
                    <span className="text-xs text-slate-200">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

                {req.status_note && <p className="mt-3 text-sm text-slate-400 italic">Nota: {req.status_note}</p>}

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleStatusChange(req.id, "En revisión")}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-medium shadow-lg shadow-cyan-900/25 transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    Validar
                  </button>

                  <button
                    onClick={() => handleStatusChange(req.id, "Rechazado")}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium shadow-lg shadow-rose-900/25 transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  >
                    Rechazar
                  </button>

                  <button
                    onClick={() => handleStatusChange(req.id, "Emitido")}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium shadow-lg shadow-emerald-900/25 transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    Emitir
                  </button>

                  <button
                    onClick={() => handleDownload(req.id)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-700/90 text-slate-100 font-medium border border-slate-700 transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                    title="Descargar archivo original"
                  >
                    Descargar archivo
                  </button>
                </div>
              </div>

              <div className="pointer-events-none absolute -inset-0.5 rounded-2xl opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-40 bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-cyan-500/10" />
            </article>
          ))}
      </div>
    </div>
  );
}