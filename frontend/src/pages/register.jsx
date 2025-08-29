import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context.jsx';
import axios from 'axios';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', form);
      login(res.data.token, res.data.role);
      navigate('/user');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrarse');
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
      {/* Capa de color */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-orange-500/40"></div>

      {/* Formulario */}
      <div className="relative z-10 bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg w-full max-w-sm space-y-5">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Registro
        </h2>

        <input
          type="text"
          placeholder="Nombre completo"
          className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        <button className="w-full bg-orange-500 text-white py-3 rounded hover:bg-orange-600 transition font-medium">
          Registrarse
        </button>

        <p className="text-center text-sm text-gray-700">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-purple-600 hover:underline">
            Inicia sesión aquí
          </a>
        </p>
      </div>
    </div>
  );
}