import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/auth-context.jsx';

import Login from './pages/login.jsx';
import Register from './pages/register.jsx';
//import UserPanel from './pages/user-panel.jsx';
//import AdminPanel from './pages/admin-panel.jsx';

const PrivateRoute = ({ children, role }) => {
  const { token, role: userRole } = useAuth();
  if (!token || userRole !== role) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirección inicial */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />



       /*   {/* Rutas protegidas 
          <Route
            path="/user/*"
            element={
              <PrivateRoute role="USER">
                <UserPanel />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <PrivateRoute role="ADMIN">
                <AdminPanel />
              </PrivateRoute>
            }
          />
*/}



          {/* Ruta por defecto si no coincide ninguna */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}