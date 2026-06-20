import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export const MainLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0f1115' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
};