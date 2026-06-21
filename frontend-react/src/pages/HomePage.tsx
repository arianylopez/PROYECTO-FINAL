import { FeaturedHero } from '../features/catalog/components/FeaturedHero';
import { MovieCatalog } from '../features/catalog/components/MovieCatalog';

export const HomePage = () => {
  return (
    <div style={{ backgroundColor: '#0f1115', minHeight: '100vh', color: '#ffffff' }}>
      <FeaturedHero />
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '3rem 2rem' }}>
        <MovieCatalog />
      </div>
    </div>
  );
};