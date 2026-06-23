import { routerInstance } from '../shared/lib/router/Router';
import { HomePage } from '../pages/home/HomePage';
import { LoginPage } from '../pages/login/LoginPage';
import './styles/global.css';

document.addEventListener('DOMContentLoaded', () => {
  routerInstance
    .use('/home', HomePage)
    .use('/login', LoginPage)
    .start();

  if (window.location.pathname === '/') {
    routerInstance.go('/home');
  }
});