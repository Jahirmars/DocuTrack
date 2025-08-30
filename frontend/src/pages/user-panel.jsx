import { useState } from "react";
import { useAuth } from "../context/auth-context";
import SolicitudForm from "../layouts/SolicitudForm";

export default function UserPanel() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Hola, {user?.name}</h1>
          <p className="text-gray-400 text-lg">
            Crea tu solicitud de certificado completando el formulario.
          </p>
        </div>

        {/* Botón para abrir el formulario */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-500 hover:bg-orange-600 transition px-6 py-3 rounded-lg font-medium shadow-md"
          >
            Crear nueva solicitud
          </button>
        </div>

        {/* Formulario de solicitud */}
        {showForm && (
          <SolicitudForm
            onClose={() => setShowForm(false)}
            onSubmitted={() => setShowForm(false)} // no recarga nada
          />
        )}
      </div>
    </div>
  );
}