import './menu.css';
import * as content from './content';
import * as routing from './routing';
import * as types from './types';
import * as url from './url';

const mobileWidth = 50 * 16; // 50rem in pixels

// === Constants ===
const MENU_ITEMS = [
    "About",
    "Services",
    "Selected Work",
];

// === Component State ===
let menuContainer: HTMLElement;
let menuItems: HTMLDivElement;
let menuHeader: HTMLDivElement;

let menuTopLevelHeight: number = 0;
let menuExpandedHeight: number = 0;
let workSubmenuHeight: number = 0;
let menuHeaderHeight: number = 0;
let hamburgerButton: HTMLButtonElement;

/**
 * Initialize the menu component
 */
export function initialize(): HTMLElement {
    // Create container structure
    menuContainer = document.createElement('nav');
    menuContainer.className = 'menu-container';
    menuContainer.setAttribute('aria-label', 'Primary navigation');

    // Create header with site title
    menuHeader = createMenuHeader();
    menuContainer.appendChild(menuHeader);

    // Create menu items
    menuItems = createMenuItems();
    menuContainer.appendChild(menuItems);

    // Add resize listener to handle responsive behavior
    window.addEventListener('resize', handleResize);
    window.addEventListener('site-route-change', handleRouteChange as EventListener);

    requestAnimationFrame(() => {
        const contentContainer = document.querySelector('.content-items');
        contentContainer?.addEventListener('scroll', handleContentScroll);
    });

    // Add document scroll listener for desktop testing in mobile mode
    document.addEventListener('wheel', handleDocumentWheel, {passive: true});

    // Initialize menu height and state
    initializeMenuHeights();

    return menuContainer;
}

function handleRouteChange(event: CustomEvent<{ section: string; slug: string }>): void {
    const {section, slug} = event.detail;

    menuItems
        .querySelectorAll<HTMLElement>('[aria-current]')
        .forEach(element => element.removeAttribute('aria-current'));

    const sectionButton = menuItems.querySelector<HTMLButtonElement>(`.menu-item-button[data-section="${section}"]`);
    sectionButton?.setAttribute('aria-current', 'page');

    if (section === 'work' && slug) {
        const projectButton = menuItems.querySelector<HTMLButtonElement>(`.sub-menu-item[data-target="${slug}"]`);
        projectButton?.setAttribute('aria-current', 'location');
    }
}

function initializeMenuHeights(): void {
    requestAnimationFrame(() => {
        measureMenuHeights();
        updateMenuState(false);
    });
}

/**
 * Handle window resize events
 */
function handleResize(): void {
    measureMenuHeights();

    if (window.innerWidth > mobileWidth && menuItems.classList.contains('open')) {
        updateMenuState(false);
    }

    updateMenuHeight();
}

/**
 * Handle content scroll events to hide menu in mobile view
 */
function handleContentScroll(event: Event): void {
    if (window.innerWidth > mobileWidth) return;

    // Immediately close menu on any scroll event in mobile view
    if (menuItems.classList.contains('open')) {
        updateMenuState(false);
    }
}

/**
 * Handle wheel events on document for desktop testing
 */
function handleDocumentWheel(event: WheelEvent): void {
    if (window.innerWidth > mobileWidth) return;

    if (event.deltaY > 0) {
        updateMenuState(false);
    }
}


/**
 * Update the menu height CSS variable
 */
// Update the menu height function to also use stored values
function updateMenuHeight(): void {
    const activeMenuHeight = getActiveMenuHeight();
    const totalHeight = menuHeaderHeight + activeMenuHeight;

    document.documentElement.style.setProperty('--menu-open-height', `${activeMenuHeight}px`);
    document.documentElement.style.setProperty(
        '--menu-total-height',
        `${totalHeight}px`
    );
}

function updateMenuState(isOpen: boolean): void {
    menuItems.classList.toggle('open', isOpen);
    hamburgerButton?.setAttribute('aria-expanded', String(isOpen));

    if (!isOpen) {
        const selectedWorkItem = menuItems.querySelector('.menu-item.expanded');
        selectedWorkItem?.classList.remove('expanded');
        menuItems.classList.remove('work-expanded');
        setSelectedWorkExpanded(false);
    }

    updateMenuHeight();
}

function getActiveMenuHeight(): number {
    if (!menuItems.classList.contains('open')) return 0;
    return menuItems.classList.contains('work-expanded')
        ? menuExpandedHeight
        : menuTopLevelHeight;
}

function measureMenuHeights(): void {
    const selectedWorkItem = getSelectedWorkItem();
    const selectedWorkButton = getSelectedWorkButton();
    const subMenu = getWorkSubmenu();
    const wasOpen = menuItems.classList.contains('open');
    const wasExpanded = menuItems.classList.contains('work-expanded');
    const originalSubMenuMaxHeight = subMenu?.style.maxHeight ?? '';
    const originalSubMenuMarginTop = subMenu?.style.marginTop ?? '';
    const originalSubMenuOpacity = subMenu?.style.opacity ?? '';
    const originalSubMenuTransition = subMenu?.style.transition ?? '';

    menuHeaderHeight = menuHeader.offsetHeight;

    menuItems.style.position = 'absolute';
    menuItems.style.visibility = 'hidden';
    menuItems.style.maxHeight = 'none';
    menuItems.style.transition = 'none';
    menuItems.classList.add('open');
    menuItems.classList.remove('work-expanded');
    selectedWorkItem?.classList.remove('expanded');
    selectedWorkButton?.setAttribute('aria-expanded', 'false');
    if (subMenu) {
        subMenu.style.maxHeight = '0px';
        subMenu.style.marginTop = '0px';
        subMenu.style.opacity = '0';
        subMenu.style.transition = 'none';
    }

    menuTopLevelHeight = menuItems.offsetHeight;
    workSubmenuHeight = subMenu?.scrollHeight ?? 0;
    menuExpandedHeight = menuTopLevelHeight + workSubmenuHeight + getSubmenuExpandedGap();

    menuItems.style.position = '';
    menuItems.style.visibility = '';
    menuItems.style.maxHeight = '';
    menuItems.style.transition = '';
    if (subMenu) {
        subMenu.style.maxHeight = originalSubMenuMaxHeight;
        subMenu.style.marginTop = originalSubMenuMarginTop;
        subMenu.style.opacity = originalSubMenuOpacity;
        subMenu.style.transition = originalSubMenuTransition;
    }
    menuItems.classList.toggle('open', wasOpen);
    menuItems.classList.toggle('work-expanded', wasExpanded);
    selectedWorkItem?.classList.toggle('expanded', wasExpanded);
    selectedWorkButton?.setAttribute('aria-expanded', String(wasExpanded));

    document.documentElement.style.setProperty('--menu-top-level-height', `${menuTopLevelHeight}px`);
    document.documentElement.style.setProperty('--menu-expanded-height', `${menuExpandedHeight}px`);
    document.documentElement.style.setProperty('--work-submenu-height', `${workSubmenuHeight}px`);
}

function getSubmenuExpandedGap(): number {
    return parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.25;
}

/**
 * Create the menu header with title and mobile toggle
 */
function createMenuHeader(): HTMLDivElement {
    const header = document.createElement('div');
    header.className = 'menu-header';

    // Add site title
    const headerText = document.createElement('button');
    headerText.className = 'menu-header-text';
    headerText.type = 'button';
    headerText.textContent = 'Daniel Fink';

    // Add click handler that checks for mobile/desktop
    headerText.addEventListener('click', () => {
        if (window.innerWidth <= mobileWidth) {
            // In mobile mode, toggle menu like hamburger does
            toggleMobileMenu();
        } else {
            // In desktop mode, keep original scroll-to-top behavior
            routing.navigateTo('about');
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
function createHamburgerToggle(): HTMLButtonElement {
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.type = 'button';
    hamburger.setAttribute('aria-label', 'Toggle navigation');
    hamburger.setAttribute('aria-expanded', 'false');

    const icon = document.createElement('span');
    icon.className = 'hamburger-icon';
    icon.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i++) {
        icon.appendChild(document.createElement('span'));
    }
    hamburger.appendChild(icon);

    hamburger.addEventListener('click', toggleMobileMenu);
    hamburger.addEventListener('pointerup', () => hamburger.blur());
    hamburgerButton = hamburger;
    return hamburger;
}

/**
 * Toggle mobile menu visibility and update CSS variables
 */
function toggleMobileMenu(): void {
    const isOpening = !menuItems.classList.contains('open');

    if (isOpening) {
        measureMenuHeights();
        updateMenuState(true);
    } else {
        updateMenuState(false);
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

    const button = document.createElement('button');
    button.className = 'menu-item-button';
    button.type = 'button';
    button.dataset.section = getSectionKey(text);
    button.addEventListener('click', () => handleMenuItemClick(text));

    const label = document.createElement('span');
    label.textContent = text;
    button.appendChild(label);

    if (text === 'Selected Work') {
        const indicator = document.createElement('span');
        indicator.className = 'menu-disclosure';
        indicator.setAttribute('aria-hidden', 'true');
        indicator.textContent = '+';
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', 'selected-work-submenu');
        button.appendChild(indicator);
    }

    item.appendChild(button);

    // Add submenu for "Selected Work" section
    if (text === 'Selected Work') {
        const subMenu = createSubmenu();
        item.appendChild(subMenu);
    }

    return item;
}

function getSectionKey(text: string): url.ContentSection {
    switch (text) {
        case 'Services':
            return 'services';
        case 'Selected Work':
            return 'work';
        default:
            return 'about';
    }
}

/**
 * Handle click on main menu item
 */
function handleMenuItemClick(menuText: string): void {
    switch (menuText) {
        case 'About':
            routing.navigateTo('about');
            closeMobileMenuAfterNavigation();
            break;
        case 'Services':
            routing.navigateTo('services');
            closeMobileMenuAfterNavigation();
            break;
        case 'Selected Work':
            if (window.innerWidth <= mobileWidth) {
                toggleSelectedWork();
            } else {
                routing.navigateTo('work');
            }
            break;
    }
}

/**
 * Create submenu for work section with project links
 */
function createSubmenu(): HTMLDivElement {
    const subMenu = document.createElement('div');
    subMenu.className = 'sub-menu';
    subMenu.id = 'selected-work-submenu';

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
function createSubmenuItem(project: types.Story): HTMLButtonElement {
    const subItem = document.createElement('button');
    subItem.className = 'sub-menu-item';
    subItem.type = 'button';
    subItem.textContent = project.title || '';
    subItem.dataset.target = url.getStorySlug(project);

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
    const project = url.findStoryByTarget(content.work, projectId);

    closeMobileMenuAfterNavigation();

    requestAnimationFrame(() => routing.navigateTo('work', project));
}

function toggleSelectedWork(): void {
    const isExpanded = !menuItems.classList.contains('work-expanded');
    const selectedWorkItem = getSelectedWorkItem();

    measureMenuHeights();
    menuItems.classList.toggle('work-expanded', isExpanded);
    selectedWorkItem?.classList.toggle('expanded', isExpanded);
    setSelectedWorkExpanded(isExpanded);
    updateMenuHeight();
}

function closeMobileMenuAfterNavigation(): void {
    if (window.innerWidth <= mobileWidth && menuItems.classList.contains('open')) {
        updateMenuState(false);
    }
}

function setSelectedWorkExpanded(isExpanded: boolean): void {
    const selectedWorkButton = getSelectedWorkButton();
    selectedWorkButton?.setAttribute('aria-expanded', String(isExpanded));
}

function getSelectedWorkItem(): HTMLDivElement | null {
    return menuItems.querySelector('.menu-item:has(.sub-menu)');
}

function getSelectedWorkButton(): HTMLButtonElement | null {
    return menuItems.querySelector('.menu-item-button[data-section="work"]');
}

function getWorkSubmenu(): HTMLDivElement | null {
    return menuItems.querySelector('.sub-menu');
}
