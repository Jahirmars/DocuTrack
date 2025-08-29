import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context.jsx';
import axios from 'axios';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', form);
      login(res.data.token, res.data.role);
      navigate(res.data.role === 'ADMIN' ? '/admin' : '/user');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al iniciar sesión');
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
          Iniciar sesión
        </h2>

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

       <button className="w-full bg-orange-500 text-white py-3 rounded transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-orange-600 shadow-md hover:shadow-xl">
        Ingresar
        </button>

        <p className="text-center text-sm text-gray-700">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-purple-600 hover:underline">
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  );
}