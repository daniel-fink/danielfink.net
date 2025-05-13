/// <reference types="vite/client" />

import './style.css'
import * as renderer from './contentRenderer'

const app = document.getElementById('app');

// Wrapper
const columns = document.createElement('div');
columns.className = 'columns';

// Left
const left = document.createElement('div');
left.className = 'left';
const leftHeader = document.createElement('div');
leftHeader.className = 'left-header';
// leftHeader.textContent = 'Daniel Fink';
// left.appendChild(leftHeader);

// Menu (and Hamburger toggle for small screens)
import menuData from './menu.json';

// Import all images under content/images as URLs

const hamburger = document.createElement('div');
hamburger.className = 'hamburger';
hamburger.textContent = '☰';
hamburger.addEventListener('click', () => {
    menu.classList.toggle('open');
});
leftHeader.appendChild(hamburger);

const leftHeaderText = document.createElement('div');
leftHeaderText.className = 'left-header-text';
leftHeaderText.textContent = 'Daniel Fink';
leftHeader.appendChild(leftHeaderText);
left.appendChild(leftHeader);

const menu = document.createElement('div');
menu.className = 'menu';
menuData.items.forEach(text => {
    const itemDiv = document.createElement('div');
    itemDiv.textContent = text;
    menu.appendChild(itemDiv);
});
left.appendChild(menu);

// Right
const right = document.createElement('div');
right.className = 'right';

const rightHeader = document.createElement('div');
rightHeader.className = 'right-header';
rightHeader.textContent = 'Right Header';
right.appendChild(rightHeader);

const content = document.createElement('div');
content.className = 'content';


// Load all JSON modules from src/content
const contentData = import.meta.glob('./content/*.json', {eager: true}) as Record<string, { default: any }>;

// Extract and sort by index
const records = Object.values(contentData)
    .map(m => m.default)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

// Render each content file
records.forEach(record => {
    const story = renderer.renderRecord(record);
    content.appendChild(story);
});
right.appendChild(content);

columns.append(left, right);

if (app) {
    app.appendChild(columns);
}
