import { useAuthStore } from '../shared/store/authStore';
import { MovieCatalog } from '../features/catalog/components/MovieCatalog';
import { FeaturedHero } from '../features/catalog/components/FeaturedHero';
import { useNavigate } from 'react-router-dom';

export const HomePage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ backgroundColor: '#0f1115', minHeight: '100vh', color: 'white' }}>
      
      <header style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '1.25rem 6%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(23, 26, 33, 0.75)',
        backdropFilter: 'blur(16px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <h1 style={{ 
            color: '#f4e951', 
            margin: 0, 
            fontSize: '1.65rem', 
            fontWeight: '900', 
            letterSpacing: '1.5px',
            cursor: 'pointer' 
          }} onClick={() => navigate('/home')}>
            CINEMAPLUS
          </h1>
          <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', fontWeight: '600', color: '#9ca3af' }}>
            <span style={{ color: '#fff', cursor: 'pointer' }}>Cartelera</span>
            <span style={{ cursor: 'pointer' }}>Formatos</span>
            <span style={{ cursor: 'pointer' }}>Promociones</span>
          </nav>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>
                Hola, <strong style={{ color: '#fff' }}>{user.name}</strong>
              </span>
              <button 
                onClick={handleLogout} 
                style={{ 
                  background: 'transparent', 
                  color: '#ff4d4d', 
                  border: '1px solid rgba(255,77,77,0.4)', 
                  padding: '0.5rem 1.25rem', 
                  borderRadius: '20px', 
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
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
                color: '#0f1115', 
                backgroundColor: '#f4e951', 
                padding: '0.55rem 1.75rem', 
                borderRadius: '20px', 
                border: 'none',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(244,233,81,0.2)'
              }}
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </header>

      <div style={{ height: '70px' }}></div>

      <FeaturedHero />
      <MovieCatalog />

    </div>
  );
};