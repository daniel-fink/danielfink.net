/// <reference types="vite/client" />
import './main.css';
import * as components from './components';

const app = document.getElementById('app');
const columns = document.createElement('div');
columns.className = 'columns';

const menu = components.menu.initialize()
columns.append(menu);

const content = components.content.initialize()
columns.append(content);

app?.appendChild(columns);

