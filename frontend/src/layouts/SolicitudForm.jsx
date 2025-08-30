import { useState } from "react";
import { useAuth } from "../context/auth-context";

export default function SolicitudForm({ onClose, onSubmitted }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    archivo: null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "archivo") {
      setForm({ ...form, archivo: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const uploadFile = async (solicitudId) => {
    const fileData = new FormData();
    fileData.append("file", form.archivo); // ✅ campo correcto

    const res = await fetch(`http://localhost:4000/api/requests/${solicitudId}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: fileData,
    });

    if (!res.ok) throw new Error("Error al subir archivo");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Paso 1: crear solicitud
      const res = await fetch("http://localhost:4000/api/requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: form.nombre,
          cedula: form.cedula,
        }),
      });

      const data = await res.json();
      const solicitudId = data.id;

      if (!solicitudId) throw new Error("No se recibió el ID de la solicitud");

      // Paso 2: subir archivo
      await uploadFile(solicitudId);

      onSubmitted(); // opcional: recargar panel
      onClose();     // cerrar formulario
    } catch (err) {
      alert("Error al enviar la solicitud");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-lg space-y-6"
    >
      <h2 className="text-xl font-semibold">Nueva solicitud</h2>

      <div className="space-y-2">
        <label className="block text-sm text-gray-300">Nombre completo</label>
        <input
          type="text"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
          className="w-full bg-gray-800 border border-gray-600 p-3 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-300">Cédula</label>
        <input
          type="text"
          name="cedula"
          value={form.cedula}
          onChange={handleChange}
          required
          className="w-full bg-gray-800 border border-gray-600 p-3 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-300">Archivo PDF</label>
        <input
          type="file"
          name="archivo"
          accept=".pdf"
          onChange={handleChange}
          required
          className="w-full bg-gray-800 border border-gray-600 p-3 rounded text-white"
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-orange-500 rounded hover:bg-orange-600 transition font-medium"
        >
          {loading ? "Enviando..." : "Enviar solicitud"}
        </button>
      </div>
    </form>
  );
}