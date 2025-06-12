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
let lastScrollTop = 0;

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

    // Add scroll listeners for both the content container and document
    const contentContainer = document.querySelector('.content-container');
    if (contentContainer) {
        contentContainer.addEventListener('scroll', handleContentScroll);
    }

    // Add document scroll listener for desktop testing in mobile mode
    document.addEventListener('wheel', handleDocumentWheel, {passive: true});

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
 * Handle content scroll events to hide menu in mobile view
 */
function handleContentScroll(event: Event): void {
    if (window.innerWidth > mobileWidth) return;

    const container = event.target as HTMLElement;
    const scrollTop = container.scrollTop;

    // If scrolling down, hide the menu
    if (scrollTop > lastScrollTop) {
        menuItems.classList.remove('open');
        updateMenuHeight(); // Add this line
    }

    // Update last scroll position
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

/**
 * Handle wheel events on document for desktop testing
 */
function handleDocumentWheel(event: WheelEvent): void {
    if (window.innerWidth > mobileWidth) return;

    // Positive deltaY means scrolling down
    if (event.deltaY > 0) {
        menuItems.classList.remove('open');
        updateMenuHeight(); // Add this line
    }
}

/**
 * Update the menu height CSS variable
 */
function updateMenuHeight(): void {
    requestAnimationFrame(() => {
        const headerHeight = menuHeader.offsetHeight;
        // If menu is closed, use 0 for its height
        const itemsHeight = menuItems.classList.contains('open') ? menuItems.offsetHeight : 0;
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
    const isOpening = !menuItems.classList.contains('open');

    if (isOpening) {
        // Temporarily remove max-height restriction to measure actual height
        menuItems.style.position = 'absolute';
        menuItems.style.visibility = 'hidden';
        menuItems.style.maxHeight = 'none';
        menuItems.classList.add('open');

        // Force layout calculation
        document.body.offsetHeight;

        // Measure the natural height
        const actualHeight = menuItems.offsetHeight;

        // Reset styles
        menuItems.style.position = '';
        menuItems.style.visibility = '';
        menuItems.style.maxHeight = '';
        menuItems.classList.remove('open');

        // Set the CSS variable with measured height
        document.documentElement.style.setProperty('--menu-items-max-height', `${actualHeight}px`);

        // Now toggle the open class for real
        requestAnimationFrame(() => {
            menuItems.classList.add('open');
            updateMenuHeight();
        });
    } else {
        menuItems.classList.remove('open');
        updateMenuHeight();
    }
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