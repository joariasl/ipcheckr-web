import './style.css';
import './navbar.css';

import { App } from './app';

const app = new App(document.querySelector<HTMLDivElement>('#app')!);
void app.start();
