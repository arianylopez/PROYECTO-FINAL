import { HomePage } from '../pages/home/HomePage';
import { LoginPage } from '../pages/login/LoginPage';
import { RegisterPage } from '../pages/register/RegisterPage';
import { MovieDetailPage } from '../pages/movie-detail/MovieDetailPage'
import { routerInstance } from '../shared/lib/router/Router';
import { withMainLayout } from '../shared/ui/layout/MainLayout';
import './styles/global.css';

routerInstance
  .use('/home', withMainLayout(HomePage))
  .use('/login', LoginPage, { requireGuest: true })
  .use('/register', RegisterPage, { requireGuest: true })
  .use('/movie/:id', withMainLayout(MovieDetailPage))
  .start();

if (window.location.pathname === '/') {
  routerInstance.go('/login');
}