import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import './Header.css';

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
      <header className="header">
        
        <div className="header__pill">
          <div className="header__logo" onClick={() => navigate('/home')} title="Ir al Inicio">
            CINEMAPLUS
          </div>
        </div>

        <div className="header__pill">
          
          <div className="header__search">
            <button onClick={toggleSearch} className="header__icon-btn" title="Buscar películas">
              <SearchIcon />
            </button>
            <form onSubmit={handleSearch} className="header__search-form" style={{ width: isSearchOpen ? '220px' : '0', opacity: isSearchOpen ? 1 : 0 }}>
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
                className="header__search-input"
                />
            </form>
          </div>

          <div className="header__divider" />

          {user ? (
            <div className="header__user-menu" ref={dropdownRef}>
              <button className="header__user-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div className="header__avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user.name ? user.name.split(' ')[0] : 'Usuario'}</span>
                <ArrowDownIcon className={`header__arrow ${isDropdownOpen ? 'header__arrow--open' : ''}`} />
              </button>

              <div className={`header__dropdown ${isDropdownOpen ? 'header__dropdown--active' : ''}`}>
                <div className="header__dropdown-header">
                  <strong className="header__dropdown-name">{user.name}</strong>
                  <span className="header__dropdown-email">{user.email}</span>
                </div>
                
                <button className="header__dropdown-item" onClick={() => { navigate('/me/orders?tab=tickets'); setIsDropdownOpen(false); }}>
                  <TicketIcon /> Mis Entradas
                </button>
                <button className="header__dropdown-item" onClick={() => { navigate('/me/orders?tab=list'); setIsDropdownOpen(false); }}>
                  ⭐ Mi Lista
                </button>
                <button className="header__dropdown-item" onClick={() => { navigate('/me/orders?tab=activity'); setIsDropdownOpen(false); }}>
                  <ProfileIcon /> Mi Actividad
                </button>

                <div className="header__dropdown-divider"></div>
                <button className="header__dropdown-item header__dropdown-item--logout" onClick={handleLogout}>
                  <LogoutIcon /> Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            <button className="header__login-btn" onClick={() => navigate('/login')}>
              Iniciar Sesión
            </button>
          )}

          <button className="header__mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        <div className={`header__mobile-nav ${isMobileMenuOpen ? 'header__mobile-nav--active' : ''}`}>
          <button className="header__mobile-link" onClick={() => navigate('/home')}>Cartelera</button>
          <button className="header__mobile-link" onClick={() => navigate('/home')}>Próximamente</button>
          <button className="header__mobile-link" onClick={() => alert('Próximamente: Cines')}>Cines</button>
          
          <div className="header__dropdown-divider" style={{ margin: '1rem 0' }}></div>
          
          {user ? (
            <>
              <div className="header__mobile-user-info">
                <div className="header__avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
                <span>{user.name}</span>
              </div>
              <button className="header__mobile-link" onClick={() => { navigate('/me/orders?tab=tickets'); setIsMobileMenuOpen(false); }}><TicketIcon /> Mis Entradas</button>
              <button className="header__mobile-link" onClick={() => { navigate('/me/orders?tab=list'); setIsMobileMenuOpen(false); }}>⭐ Mi Lista</button>
              <button className="header__mobile-link" onClick={() => { navigate('/me/orders?tab=activity'); setIsMobileMenuOpen(false); }}><ProfileIcon /> Mi Actividad</button>
              <button className="header__mobile-link header__dropdown-item--logout" onClick={handleLogout}><LogoutIcon /> Cerrar Sesión</button>
            </>
          ) : (
            <button className="header__login-btn header__login-btn--mobile" onClick={() => navigate('/login')}>
              Iniciar Sesión
            </button>
          )}
        </div>

      </header>
    </>
  );
};