import './menu.css';
import data from './menu.json';

export function initialize(): HTMLDivElement {
    // Root container
    const container = document.createElement('div');
    container.className = 'menu-container';
    // container.textContent = 'Menu';

    const header = document.createElement('div');
    header.className = 'menu-header';

    // Title text
    const headerText = document.createElement('div');
    headerText.className = 'menu-header-text';
    headerText.textContent = 'Daniel Fink';
    header.appendChild(headerText);


    // Menu items
    const menu = document.createElement('div');
    menu.className = 'menu-items';
    data.items.forEach(text => {
        const item = document.createElement('div');
        item.textContent = text;
        menu.appendChild(item);
    });

    // Hamburger toggle for mobile
    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger';
    hamburger.textContent = '☰';

    // toggle the 'open' class on the menu
    hamburger.addEventListener('click', () => {
        menu.classList.toggle('open');
    });

    header.appendChild(hamburger);
    container.appendChild(header);
    container.appendChild(menu);


    return container;
}