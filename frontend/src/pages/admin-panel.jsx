import { useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";

export default function AdminPanel() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/requests", {
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

  const handleStatusChange = async (id, status) => {
    try {
      await fetch(`http://localhost:4000/api/requests/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      setRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status } : req
        )
      );
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    }
  };

  const handleDownload = async (id) => {
  try {
    const res = await fetch(`http://localhost:4000/api/requests/${id}/file`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error("Archivo no disponible");
    }

    const { file_url } = await res.json();

    if (file_url) {
      window.open(file_url, "_blank"); // ✅ abre el PDF directamente en una pestaña nueva
    } else {
      alert("Esta solicitud no tiene archivo adjunto.");
    }
  } catch (err) {
    console.error("Error al descargar archivo:", err);
    alert("No se pudo descargar el archivo.");
  }
};



  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Panel de administrador</h1>

      {loading ? (
        <p className="text-center text-gray-400">Cargando solicitudes...</p>
      ) : requests.length === 0 ? (
        <p className="text-center text-gray-400">No hay solicitudes registradas.</p>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-gray-800 p-4 rounded-lg shadow-md space-y-2"
            >
              <p><span className="font-semibold">Nombre:</span> {req.details?.nombre}</p>
              <p><span className="font-semibold">Cédula:</span> {req.details?.cedula}</p>
              <p><span className="font-semibold">Estado:</span> {req.status}</p>

              {req.status_note && (
                <p className="text-sm text-gray-400 italic">Nota: {req.status_note}</p>
              )}

              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => handleStatusChange(req.id, "En revisión")}
                  className="bg-yellow-500 px-4 py-2 rounded hover:bg-yellow-600 transition"
                >
                  Validar
                </button>
                <button
                  onClick={() => handleStatusChange(req.id, "Rechazado")}
                  className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => handleStatusChange(req.id, "Emitido")}
                  className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  Emitir
                </button>
                <button
                  onClick={() => handleDownload(req.id)}
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