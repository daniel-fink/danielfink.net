import './menu.css';
import * as content from './content';
import * as types from './types';

const mobileWidth = 50 * 16; // 50rem in pixels

// === Constants ===
const MENU_ITEMS = [
    "About",
    "Services",
    "Selected Work",
];

// === Component State ===
let menuContainer: HTMLDivElement;
let menuItems: HTMLDivElement;
let menuHeader: HTMLDivElement;

/**
 * Initialize the menu component
 */
export function initialize(): HTMLDivElement {
    // Create container structure
    menuContainer = document.createElement('div');
    menuContainer.className = 'menu-container';

    // Create header with site title
    menuHeader = createMenuHeader();
    menuContainer.appendChild(menuHeader);

    // Create menu items
    menuItems = createMenuItems();
    menuItemClickHandlers();
    menuContainer.appendChild(menuItems);


    // Check if we're in mobile mode and open the menu by default
    if (window.innerWidth <= mobileWidth) {
        menuItems.classList.add('open');

        // Update the CSS variable for content positioning
        requestAnimationFrame(() => {
            const headerHeight = menuHeader.offsetHeight;
            const itemsHeight = menuItems.offsetHeight;
            const totalHeight = headerHeight + itemsHeight;

            document.documentElement.style.setProperty(
                '--menu-total-height',
                `${totalHeight}px`
            );
        });
    }

    // Add resize listener to handle responsive behavior
    window.addEventListener('resize', handleResize);

    return menuContainer;
}

/**
 * Handle window resize events
 */
function handleResize(): void {
    if (window.innerWidth <= mobileWidth) {
        if (!menuItems.classList.contains('open')) {
            menuItems.classList.add('open');
            updateMenuHeight();
        }
    }
}

function menuItemClickHandlers(): void {
    const menuItemElements = menuItems.querySelectorAll('.menu-item, .sub-menu-item');

    menuItemElements.forEach(item => {
        item.addEventListener('click', () => {
            // Only collapse menu if in mobile mode
            if (window.innerWidth <= mobileWidth) {
                menuItems.classList.remove('open');
                updateMenuHeight();
            }
        });
    });
}

/**
 * Update the menu height CSS variable
 */
function updateMenuHeight(): void {
    requestAnimationFrame(() => {
        const headerHeight = menuHeader.offsetHeight;
        const itemsHeight = menuItems.offsetHeight;
        const totalHeight = headerHeight + itemsHeight;

        document.documentElement.style.setProperty(
            '--menu-total-height',
            `${totalHeight}px`
        );
    });
}

/**
 * Create the menu header with title and mobile toggle
 */
function createMenuHeader(): HTMLDivElement {
    const header = document.createElement('div');
    header.className = 'menu-header';

    // Add site title
    const headerText = document.createElement('div');
    headerText.className = 'menu-header-text';
    headerText.textContent = 'Daniel Fink';
    headerText.style.cursor = 'pointer'; // Make it look clickable

    // Add click handler for scrolling to top
    headerText.addEventListener('click', () => {
        content.scrollToTop();
    });

    header.appendChild(headerText);

    // Add hamburger menu for mobile
    const hamburger = createHamburgerToggle();
    header.appendChild(hamburger);

    return header;
}

/**
 * Create hamburger toggle button for mobile view
 */
function createHamburgerToggle(): HTMLDivElement {
    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger';
    hamburger.textContent = '☰';

    hamburger.addEventListener('click', toggleMobileMenu);

    return hamburger;
}

/**
 * Toggle mobile menu visibility and update CSS variables
 */
function toggleMobileMenu(): void {
    menuItems.classList.toggle('open');

    requestAnimationFrame(() => {
        const headerHeight = menuHeader.offsetHeight;
        const itemsHeight = menuItems.offsetHeight;
        const totalHeight = headerHeight + itemsHeight;

        document.documentElement.style.setProperty(
            '--menu-total-height',
            `${totalHeight}px`
        );
    });
}

/**
 * Create menu items from configuration data
 */
function createMenuItems(): HTMLDivElement {
    const menuElement = document.createElement('div');
    menuElement.className = 'menu-items';

    // Create each top-level menu item
    MENU_ITEMS.forEach(itemText => {
        const menuItem = createMenuItem(itemText);
        menuElement.appendChild(menuItem);
    });

    return menuElement;
}

/**
 * Create a single menu item
 */
function createMenuItem(text: string): HTMLDivElement {
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.textContent = text;

    // Add click handler for content switching
    item.addEventListener('click', () => handleMenuItemClick(text));

    // Add submenu for "Selected Work" section
    if (text === 'Selected Work') {
        const subMenu = createWorkSubmenu();
        item.appendChild(subMenu);
    }

    return item;
}

/**
 * Handle click on main menu item
 */
function handleMenuItemClick(menuText: string): void {
    switch (menuText) {
        case 'About':
            content.changeContent(content.about);
            break;
        case 'Services':
            content.changeContent(content.services);
            break;
        case 'Selected Work':
            content.changeContent(content.work);
            break;
    }
}

/**
 * Create submenu for work section with project links
 */
function createWorkSubmenu(): HTMLDivElement {
    const subMenu = document.createElement('div');
    subMenu.className = 'sub-menu';

    // Add each work item as submenu entry
    content.work.forEach(record => {
        const subItem = createSubmenuItem(record);
        subMenu.appendChild(subItem);
    });

    return subMenu;
}

/**
 * Create a single submenu item for a work project
 */
function createSubmenuItem(project: types.Story): HTMLDivElement {
    const subItem = document.createElement('div');
    subItem.className = 'sub-menu-item';
    subItem.textContent = project.title || '';
    subItem.dataset.target = project.title || '';

    // Add click handler with proper event bubbling prevention
    subItem.addEventListener('click', event => {
        event.stopPropagation();
        navigateToProject(subItem.dataset.target!);
    });

    return subItem;
}

/**
 * Navigate to a specific project by ID
 */
function navigateToProject(projectId: string): void {
    content.changeContent(content.work, projectId);

    // Close mobile menu after navigation
    if (menuItems.classList.contains('open')) {
        menuItems.classList.remove('open');
    }
}