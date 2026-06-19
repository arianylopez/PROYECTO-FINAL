import { useAuthStore } from '../shared/store/authStore';
import { MovieCatalog } from '../features/catalog/components/MovieCatalog';
import { FeaturedHero } from '../features/catalog/components/FeaturedHero'; // <-- NUEVO IMPORT
import { useNavigate } from 'react-router-dom';

export const HomePage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ backgroundColor: '#16181f', minHeight: '100vh', color: 'white' }}>
      
      <header style={{ 
        padding: '1rem 5%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid #2a2c36',
        backgroundColor: '#1c1f2a'
      }}>
        <h1 style={{ color: '#f4e951', margin: 0, fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '1px' }}>
          CinemaPlus
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>Bienvenido, <strong>{user.name}</strong></span>
              <button 
                onClick={handleLogout} 
                style={{ 
                  background: 'transparent', 
                  color: '#ff4d4d', 
                  border: '1px solid #ff4d4d', 
                  padding: '0.4rem 1.2rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              style={{ 
                color: '#16181f', 
                backgroundColor: '#f4e951', 
                padding: '0.5rem 1.5rem', 
                borderRadius: '6px', 
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </header>

      <FeaturedHero />

      <MovieCatalog />

    </div>
  );
};