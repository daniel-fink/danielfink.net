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

let menuItemsHeight: number = 0; // Store calculated menu height
let menuHeaderHeight: number = 0; // Store header height
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

    // Add resize listener to handle responsive behavior
    window.addEventListener('resize', handleResize);

    // Add scroll listener for content container - simplified approach
    const contentContainer = document.querySelector('.content-items');
    if (contentContainer) {
        // Use standard scroll event instead of touch events
        contentContainer.addEventListener('scroll', handleContentScroll);
    }

    // Add document scroll listener for desktop testing in mobile mode
    document.addEventListener('wheel', handleDocumentWheel, {passive: true});

    // Initialize menu height and state
    requestAnimationFrame(() => {
        // Force menu items to be measurable without affecting display
        menuItems.style.position = 'absolute';
        menuItems.style.visibility = 'hidden';
        menuItems.style.maxHeight = 'none';
        menuItems.classList.add('open');

        // Measure and store heights
        menuItemsHeight = menuItems.offsetHeight;
        menuHeaderHeight = menuHeader.offsetHeight;

        // Reset styles
        menuItems.style.position = '';
        menuItems.style.visibility = '';
        menuItems.style.maxHeight = '';
        menuItems.classList.remove('open');

        // Set the CSS variable with our stored value
        document.documentElement.style.setProperty('--menu-items-max-height', `${menuItemsHeight}px`);

        // If starting in mobile mode, initialize properly
        if (window.innerWidth <= mobileWidth) {
            menuItems.classList.add('open');
            updateMenuHeight();
        }
    });

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

    // Immediately close menu on any scroll event in mobile view
    if (menuItems.classList.contains('open')) {
        menuItems.classList.remove('open');
        updateMenuHeight();
    }
}

/**
 * Handle wheel events on document for desktop testing
 */
function handleDocumentWheel(event: WheelEvent): void {
    if (window.innerWidth > mobileWidth) return;

    if (event.deltaY > 0) {
        menuItems.classList.remove('open');
        updateMenuHeight();
    }
}


/**
 * Update the menu height CSS variable
 */
// Update the menu height function to also use stored values
function updateMenuHeight(): void {
    // Calculate total height based on stored values
    const totalHeight = menuHeaderHeight +
        (menuItems.classList.contains('open') ? menuItemsHeight : 0);

    document.documentElement.style.setProperty(
        '--menu-total-height',
        `${totalHeight}px`
    );
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

    // Add click handler that checks for mobile/desktop
    headerText.addEventListener('click', () => {
        if (window.innerWidth <= mobileWidth) {
            // In mobile mode, toggle menu like hamburger does
            toggleMobileMenu();
        } else {
            // In desktop mode, keep original scroll-to-top behavior
            content.scrollToTop();
        }
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

    // Set the CSS variable using stored height (no recalculation needed)
    document.documentElement.style.setProperty('--menu-items-max-height', `${menuItemsHeight}px`);

    if (isOpening) {
        menuItems.classList.add('open');

        // Automatically expand the Selected Work submenu
        const selectedWorkItem = menuItems.querySelector('.menu-item:has(.sub-menu)');
        if (selectedWorkItem) {
            selectedWorkItem.classList.add('expanded');
        }

        // Recalculate menu height to include submenu
        requestAnimationFrame(recalculateMenuHeight);
    } else {
        menuItems.classList.remove('open');

        // Collapse Selected Work submenu when closing menu
        const selectedWorkItem = menuItems.querySelector('.menu-item.expanded');
        if (selectedWorkItem) {
            selectedWorkItem.classList.remove('expanded');
        }
    }

    // Update content position with a slight delay to ensure browser applies changes
    setTimeout(updateMenuHeight, 10);
}

/**
 * Recalculate the total menu height including expanded submenus
 */
function recalculateMenuHeight(): void {
    // Force menu items to be measurable
    const originalMaxHeight = menuItems.style.maxHeight;
    menuItems.style.maxHeight = 'none';

    // Get the actual height including expanded submenus
    menuItemsHeight = menuItems.offsetHeight;

    // Restore original max-height
    menuItems.style.maxHeight = originalMaxHeight;

    // Update CSS variable
    document.documentElement.style.setProperty('--menu-items-max-height', `${menuItemsHeight}px`);
    updateMenuHeight();
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
        const subMenu = createSubmenu();
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
function createSubmenu(): HTMLDivElement {
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