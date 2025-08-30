import { useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";

export default function AdminPanel() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Obtener solicitudes desde el backend
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/admin/requests", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        console.error("Error al obtener solicitudes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [token]);

  const handleApprove = async (id) => {
    try {
      await fetch(`/api/admin/requests/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRequests((prev) =>
        prev.map((req) =>
          req._id === id ? { ...req, status: "aprobado" } : req
        )
      );
    } catch (err) {
      console.error("Error al aprobar:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await fetch(`/api/admin/requests/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRequests((prev) =>
        prev.map((req) =>
          req._id === id ? { ...req, status: "rechazado" } : req
        )
      );
    } catch (err) {
      console.error("Error al rechazar:", err);
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await fetch(`/api/admin/requests/${id}/certificate`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificado-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar certificado:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Panel de administrador</h1>

      {loading ? (
        <p className="text-center text-gray-400">Cargando solicitudes...</p>
      ) : requests.length === 0 ? (
        <p className="text-center text-gray-400">No hay solicitudes pendientes.</p>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-gray-800 p-4 rounded-lg shadow-md space-y-2"
            >
              <p><span className="font-semibold">Usuario:</span> {req.userName}</p>
              <p><span className="font-semibold">Correo:</span> {req.email}</p>
              <p><span className="font-semibold">Estado:</span> {req.status}</p>

              {req.fileUrl && (
                <a
                  href={req.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 underline"
                >
                  Ver archivo adjunto
                </a>
              )}

              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => handleApprove(req._id)}
                  className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => handleReject(req._id)}
                  className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => handleDownload(req._id)}
                  className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700 transition"
                >
                  Descargar certificado
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}