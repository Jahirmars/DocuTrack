import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/auth-context";
import SolicitudForm from "../layouts/SolicitudForm";

export default function UserPanel() {
  const { token, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleDownload = async (id) => {
    try {
      const res = await fetch(`http://localhost:4000/api/certificate/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Certificado no disponible");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificado-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar certificado:", err);
      alert("No se pudo descargar el certificado.");
    }
  };

  const onSubmitted = () => {
    setShowForm(false);
    fetchRequests();
  };

  const statusStyles = (s) =>
    s === "Emitido"
      ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
      : s === "Rechazado"
      ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"
      : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Encabezado */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-sky-400">
            Hola, {user?.name}
          </h1>
          <p className="text-slate-400 text-lg">
            Gestiona tus solicitudes y descarga tus certificados emitidos.
          </p>
        </header>

        {/* Acción primaria */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-medium px-5 py-3 rounded-xl shadow-lg shadow-cyan-900/30 transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <span className="text-xl leading-none">＋</span>
            Crear nueva solicitud
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/70 backdrop-blur-md p-6 shadow-xl">
            <SolicitudForm onClose={() => setShowForm(false)} onSubmitted={onSubmitted} />
          </div>
        )}

        {/* Listado */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-cyan-300">Solicitudes recientes</h2>
              <p className="text-sm text-slate-300 mt-1">
                Revisa el estado de tus trámites. Cuando estén emitidos, podrás descargar el certificado.
              </p>
            </div>
            {!loading && (
              <button
                onClick={fetchRequests}
                className="text-sm text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg px-2 py-1"
                title="Refrescar"
              >
                Refrescar
              </button>
            )}
          </div>

          {/* Skeletons */}
          {loading && (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-slate-800 bg-slate-800/60 p-6"
                >
                  <div className="h-5 w-56 bg-slate-700 rounded mb-3" />
                  <div className="h-4 w-32 bg-slate-700 rounded mb-2" />
                  <div className="h-4 w-64 bg-slate-700 rounded mb-2" />
                  <div className="h-4 w-40 bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && requests.length === 0 && (
            <div className="text-center rounded-2xl border border-slate-800 bg-slate-800/60 p-10">
              <div className="mx-auto mb-3 h-12 w-12 flex items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
                <span className="text-2xl">📄</span>
              </div>
              <p className="text-lg font-medium">Aún no hay movimientos</p>
              <p className="text-slate-400 mb-6">
                Crea tu primera solicitud para iniciar el proceso de emisión.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                Crear solicitud
              </button>
            </div>
          )}

          {/* Lista de tarjetas */}
          {!loading &&
            requests.length > 0 &&
            requests.map((req) => (
              <article
                key={req.id}
                className="group relative rounded-2xl p-[1px] bg-gradient-to-r from-slate-700/40 via-slate-600/30 to-slate-700/40 hover:from-cyan-500/25 hover:via-sky-500/20 hover:to-cyan-500/25 transition-all duration-300"
              >
                <div className="rounded-2xl bg-slate-900/70 backdrop-blur-xl p-6 border border-slate-800 shadow-xl">
                  {/* Header */}
                  <div className="flex flex-col items-center gap-3 text-center md:flex-row md:text-left md:items-start md:gap-4">
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-cyan-500/15 text-cyan-300 grid place-items-center ring-1 ring-cyan-400/20">
                      <span className="text-lg">📜</span>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-100 tracking-tight">
                        {req.request_type}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles(req.status)}`}>
                          {req.status}
                        </span>
                        {/* Fecha más clara */}
                        <span className="text-xs text-slate-200">
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                        {req.status_note && (
                          <span className="text-xs text-slate-400 italic">
                            Nota: {req.status_note}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mt-4 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

                  {/* Actions */}
                  {req.status === "Emitido" && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleDownload(req.id)}
                        className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-emerald-900/25 transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <span className="text-base">Descargar certificado</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Glow sutil en hover */}
                <div className="pointer-events-none absolute -inset-0.5 rounded-2xl opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-40 bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-cyan-500/10" />
              </article>
            ))}
        </section>
      </div>
    </div>
  );
}