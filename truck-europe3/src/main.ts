import './style.css';
import { Game } from './game/Game';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');
  if (container) {
    new Game(container);
  }
});
