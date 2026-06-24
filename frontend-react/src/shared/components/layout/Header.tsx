import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const SearchIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);
const ArrowDownIcon = ({ className }: { className?: string }) => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
);
const MenuIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
);
const CloseIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
);
const ProfileIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const TicketIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
);
const LogoutIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/home');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/home?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };


  return (
    <>
      <style>{`
        .header-wrapper {
          position: sticky;
          top: 1rem;
          z-index: 1000;
          padding: 0 4%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          pointer-events: none; /* Permite clics en el espacio vacío del fondo */
        }

        /* Bloques Píldora */
        .header-pill {
          background: rgba(23, 26, 33, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 50px;
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          pointer-events: auto; /* Reactiva los clics dentro de la píldora */
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        }

        .logo {
          color: #f4e951;
          font-size: 1.4rem;
          font-weight: 900;
          letter-spacing: 0.5px;
          cursor: pointer;
          margin-right: 2.5rem;
          text-transform: uppercase;
        }

        .desktop-nav {
          display: flex;
          gap: 1.8rem;
        }

        .nav-item {
          background: none;
          border: none;
          color: #d1d5db;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0.5rem 0;
          position: relative;
          transition: color 0.2s ease;
        }

        .nav-item:hover, .nav-item.active {
          color: #ffffff;
        }

        .nav-item.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 3px;
          background-color: #f4e951;
          border-radius: 4px;
        }

        /* Buscador Animado */
        .search-wrapper {
          display: flex;
          align-items: center;
        }

        .icon-btn {
          background: none;
          border: none;
          color: #d1d5db;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
          padding: 0.5rem;
        }

        .icon-btn:hover {
          color: #f4e951;
        }

        .search-input {
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 0.95rem;
          padding: 0.5rem 0.5rem 0.5rem 0.8rem;
          outline: none;
          width: 100%;
        }

        .search-input::placeholder {
          color: #6b7280;
        }

        .divider {
          width: 1px;
          height: 24px;
          background-color: rgba(255, 255, 255, 0.15);
          margin: 0 1.25rem;
        }

        /* Menú de Usuario */
        .user-menu-container {
          position: relative;
        }

        .user-profile-btn {
          background: none;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          cursor: pointer;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.95rem;
          transition: opacity 0.2s;
        }

        .user-profile-btn:hover {
          opacity: 0.8;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f4e951 0%, #ca8a04 100%);
          color: #0f1115;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.1rem;
        }

        .arrow {
          transition: transform 0.3s ease;
          color: #9ca3af;
        }
        .user-profile-btn:hover .arrow { color: #fff; }
        .arrow.open { transform: rotate(180deg); }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 20px);
          right: 0;
          background: rgba(23, 26, 33, 0.95);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 0.5rem;
          width: 240px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .dropdown-menu.active {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          width: 100%;
          background: none;
          border: none;
          padding: 0.85rem 1rem;
          color: #d1d5db;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s;
          text-align: left;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .dropdown-item.logout {
          color: #ef4444;
        }

        .dropdown-item.logout:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .dropdown-divider {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.08);
          margin: 0.5rem 0;
        }

        /* Botón Login Específico */
        .login-btn {
          background: #f4e951;
          color: #0f1115;
          border: none;
          padding: 0.65rem 1.75rem;
          border-radius: 30px;
          font-weight: 900;
          font-size: 0.95rem;
          cursor: pointer;
          transition: transform 0.2s, background-color 0.2s;
        }

        .login-btn:hover {
          background: #e2d73f;
          transform: scale(1.03);
        }

        /* Navegación Móvil Hamburguesa */
        .mobile-toggle {
          display: none;
          background: none;
          border: none;
          color: #ffffff;
          cursor: pointer;
          padding: 0.5rem;
        }

        .mobile-nav {
          position: absolute;
          top: 90px;
          left: 4%;
          right: 4%;
          background: rgba(23, 26, 33, 0.98);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          pointer-events: auto;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .mobile-nav.active {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .mobile-nav-link {
          background: none;
          border: none;
          color: #e5e7eb;
          font-size: 1.1rem;
          font-weight: 700;
          text-align: left;
          padding: 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .mobile-nav-link:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #f4e951;
        }

        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          color: #fff;
          font-size: 1.1rem;
          font-weight: 800;
        }

        /* MEDIA QUERIES (Tablet & Mobile) */
        @media (max-width: 968px) {
          .desktop-nav { display: none; }
          .user-menu-container { display: none; }
          .divider { display: none; }
          .login-btn { display: none; }
          .mobile-toggle { display: block; }
          .search-wrapper { margin-right: 0.5rem; }
          .logo { margin-right: 0; }
        }
        
        @media (max-width: 480px) {
          .header-pill { padding: 0 1rem; }
          .logo { font-size: 0; } 
          .logo::after { content: 'C+'; font-size: 1.4rem; }
        }
      `}</style>

      <header className="header-wrapper">
        
        <div className="header-pill">
          <div className="logo" onClick={() => navigate('/home')} title="Ir al Inicio">
            CINEMAPLUS
          </div>
        </div>

        <div className="header-pill">
          
          <div className="search-wrapper">
            <button onClick={toggleSearch} className="icon-btn" title="Buscar películas">
              <SearchIcon />
            </button>
            <form onSubmit={handleSearch} style={{ width: isSearchOpen ? '220px' : '0', opacity: isSearchOpen ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden', display: 'flex' }}>
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Buscar en cartelera..." 
                value={searchQuery}
                onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (val.trim()) {
                    navigate(`/home?q=${encodeURIComponent(val)}`);
                    } else {
                    navigate('/home');
                    }
                }}
                className="search-input"
                />
            </form>
          </div>

          <div className="divider" />

          {user ? (
            <div className="user-menu-container" ref={dropdownRef}>
              <button className="user-profile-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div className="avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user.name ? user.name.split(' ')[0] : 'Usuario'}</span>
                <ArrowDownIcon className={`arrow ${isDropdownOpen ? 'open' : ''}`} />
              </button>

              <div className={`dropdown-menu ${isDropdownOpen ? 'active' : ''}`}>
                <div style={{ padding: '0.8rem 1.2rem', borderBottom: '1px solid #262932', marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#fff', display: 'block', fontSize: '0.95rem' }}>{user.name}</strong>
                  <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{user.email}</span>
                </div>
                
                <button className="dropdown-item" onClick={() => { navigate('/me/orders?tab=tickets'); setIsDropdownOpen(false); }}>
                  <TicketIcon /> Mis Entradas
                </button>
                <button className="dropdown-item" onClick={() => { navigate('/me/orders?tab=list'); setIsDropdownOpen(false); }}>
                  ⭐ Mi Lista
                </button>
                <button className="dropdown-item" onClick={() => { navigate('/me/orders?tab=activity'); setIsDropdownOpen(false); }}>
                  <ProfileIcon /> Mi Actividad
                </button>

                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <LogoutIcon /> Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            <button className="login-btn" onClick={() => navigate('/login')}>
              Iniciar Sesión
            </button>
          )}

          <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        <div className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
          <button className="mobile-nav-link" onClick={() => navigate('/home')}>Cartelera</button>
          <button className="mobile-nav-link" onClick={() => navigate('/home')}>Próximamente</button>
          <button className="mobile-nav-link" onClick={() => alert('Próximamente: Cines')}>Cines</button>
          
          <div className="dropdown-divider" style={{ margin: '1rem 0' }}></div>
          
          {user ? (
            <>
              <div className="mobile-user-info">
                <div className="avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
                <span>{user.name}</span>
              </div>
              <button className="mobile-nav-link" onClick={() => { navigate('/me/orders?tab=tickets'); setIsMobileMenuOpen(false); }}><TicketIcon /> Mis Entradas</button>
              <button className="mobile-nav-link" onClick={() => { navigate('/me/orders?tab=list'); setIsMobileMenuOpen(false); }}>⭐ Mi Lista</button>
              <button className="mobile-nav-link" onClick={() => { navigate('/me/orders?tab=activity'); setIsMobileMenuOpen(false); }}><ProfileIcon /> Mi Actividad</button>
              <button className="mobile-nav-link logout" onClick={handleLogout}><LogoutIcon /> Cerrar Sesión</button>
            </>
          ) : (
            <button className="login-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '1rem' }} onClick={() => navigate('/login')}>
              Iniciar Sesión
            </button>
          )}
        </div>

      </header>
    </>
  );
};