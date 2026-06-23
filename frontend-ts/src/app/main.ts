import { routerInstance } from '../shared/lib/router/Router';
import { HomePage } from '../pages/home/HomePage';
import { LoginPage } from '../pages/login/LoginPage';
import { MovieDetailPage } from '../pages/movie-detail/MovieDetailPage';
import './styles/global.css';

routerInstance
  .use('/home', HomePage)
  .use('/login', LoginPage)
  .use('/movie/:id', MovieDetailPage)
  .start();

if (window.location.pathname === '/') {
  routerInstance.go('/home');
}