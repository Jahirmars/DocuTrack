import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.jsx';
import axios from 'axios';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await axios.post('http://localhost:4000/api/auth/login', form);

    // Verifica qué datos llegan del backend
    console.log("Login exitoso:", res.data);

    // Extraer datos
    const { token, user } = res.data;

    // Actualizar contexto
    login(token, user.role, user);

    // Redirigir según el rol
    console.log("Redirigiendo a:", user.role === 'ADMIN' ? '/admin' : '/user');
    navigate(user.role === 'ADMIN' ? '/admin' : '/user');
   } catch (err) {
  console.log("Error completo:", err);

  if (err.response) {
    console.log("Error del backend:", err.response.data);
    alert(err.response.data?.error || 'Error del servidor');
  } else if (err.request) {
    console.log("No se recibió respuesta del servidor:", err.request);
    alert('No se pudo conectar con el servidor');
  } else {
    console.log("Error interno:", err.message);
    alert('Error inesperado: ' + err.message);
  }
} finally {
    setLoading(false);
  }
};
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://res.cloudinary.com/df2rfqrzp/image/upload/v1756500485/BB1msG0Y_br3b7b.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-orange-500/40"></div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg w-full max-w-sm space-y-5"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Iniciar sesión
        </h2>

        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Correo electrónico"
          required
          className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Contraseña"
          required
          className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white py-3 rounded transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-orange-600 shadow-md hover:shadow-xl"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p className="text-center text-sm text-gray-700">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-purple-600 hover:underline">
            Regístrate aquí
          </a>
        </p>
      </form>
    </div>
  );
}