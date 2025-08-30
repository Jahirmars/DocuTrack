import { createContext, useContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  const rawUser = localStorage.getItem('user');
  const [user, setUser] = useState(
    rawUser && rawUser !== 'undefined' ? JSON.parse(rawUser) : null
  );

  const login = (token, role, user) => {
    setToken(token);
    setRole(role);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setToken('');
    setRole('');
    setUser(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ token, role, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);