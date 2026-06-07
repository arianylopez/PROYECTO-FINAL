import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RegisterForm } from './features/auth/RegisterForm';
import { LoginForm } from './features/auth/LoginForm';

const HomeTemp = () => (
  <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>
    <h1>¡Bienvenido a la Cartelera!</h1>
    <p>Has iniciado sesión exitosamente.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
        
        <Route path="/home" element={<HomeTemp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;