import { useState, useRef } from "react";
import { useAuth } from "../context/auth-context";

export default function SolicitudForm({ onClose, onSubmitted }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    archivo: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "archivo") {
      const file = files?.[0] || null;
      setForm((f) => ({ ...f, archivo: file }));
      // Limpia error si se selecciona archivo
      setErrors((prev) => ({ ...prev, archivo: undefined }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Validación mínima en cliente
  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Ingresa tu nombre completo.";
    if (!form.cedula.trim()) e.cedula = "Ingresa tu cédula.";
    if (!form.archivo) e.archivo = "Adjunta un PDF.";
    else if (form.archivo.type !== "application/pdf") e.archivo = "El archivo debe ser PDF.";
    else if (form.archivo.size > 8 * 1024 * 1024) e.archivo = "El PDF no debe superar 8 MB.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadFile = async (solicitudId) => {
    const fileData = new FormData();
    fileData.append("file", form.archivo);

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
    if (!validate()) return;

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
          nombre: form.nombre.trim(),
          cedula: form.cedula.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo crear la solicitud");
      const solicitudId = data.id;
      if (!solicitudId) throw new Error("No se recibió el ID de la solicitud");

      // Paso 2: subir archivo
      await uploadFile(solicitudId);

      onSubmitted?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      alert("Error al enviar la solicitud. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const fileLabel = form.archivo ? form.archivo.name : "Selecciona un PDF…";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-6 shadow-xl space-y-6"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-cyan-300">Nueva solicitud</h2>
        <p className="text-sm text-slate-300">
          Completa los datos y adjunta tu documento en formato PDF.
        </p>
      </div>

      {/* Nombre */}
      <div className="space-y-2">
        <label htmlFor="nombre" className="block text-sm text-slate-300">
          Nombre completo
        </label>
        <input
          id="nombre"
          type="text"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
          className={`w-full rounded-xl bg-slate-800/70 border p-3 text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition
          ${errors.nombre ? "border-rose-400/60" : "border-slate-700"}`}
          placeholder="Ej. Juan Pérez"
          autoComplete="name"
        />
        {errors.nombre && <p className="text-xs text-rose-300">{errors.nombre}</p>}
      </div>

      {/* Cédula */}
      <div className="space-y-2">
        <label htmlFor="cedula" className="block text-sm text-slate-300">
          Cédula
        </label>
        <input
          id="cedula"
          type="text"
          name="cedula"
          value={form.cedula}
          onChange={handleChange}
          required
          className={`w-full rounded-xl bg-slate-800/70 border p-3 text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition
          ${errors.cedula ? "border-rose-400/60" : "border-slate-700"}`}
          placeholder="Ej. 8-888-888"
          autoComplete="off"
        />
        {errors.cedula && <p className="text-xs text-rose-300">{errors.cedula}</p>}
      </div>

      {/* Archivo PDF */}
      <div className="space-y-2">
        <label className="block text-sm text-slate-300">Archivo PDF</label>

        {/* Botón selector elegante */}
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border p-3 bg-slate-800/60
          ${errors.archivo ? "border-rose-400/60" : "border-slate-700"}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-cyan-500/15 text-cyan-300 grid place-items-center ring-1 ring-cyan-400/20">
              <span className="text-base">📎</span>
            </div>
            <span className="truncate text-slate-200">{fileLabel}</span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white text-sm font-medium px-3 py-2 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            Examinar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            name="archivo"
            accept="application/pdf"
            onChange={handleChange}
            className="hidden"
          />
        </div>

        <p className="text-xs text-slate-400">
          Solo PDF. Tamaño máximo sugerido: 8 MB.
        </p>
        {errors.archivo && <p className="text-xs text-rose-300">{errors.archivo}</p>}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-100 hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-medium shadow-lg shadow-cyan-900/30 transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
              Enviando…
            </>
          ) : (
            "Enviar solicitud"
          )}
        </button>
      </div>
    </form>
  );
}