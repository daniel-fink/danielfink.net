import * as marked from 'marked';
import './content.css';
import * as types from "./types";
import * as url from './url';

// === Content Data Loading ===
export const about = loadContent(import.meta.glob(`../content/about.json`, {eager: true}));
export const services = loadContent(import.meta.glob(`../content/services/*.json`, {eager: true}));
export const work = loadContent(import.meta.glob(`../content/work/*.json`, {eager: true}));

// === Component State ===
let currentContent: types.Story[] = [];
let currentSection: url.ContentSection = 'about';
let currentHeader: HTMLDivElement;
let currentHeaderTarget = '';
let currentStories: HTMLDivElement;
let modalOverlay: HTMLDivElement;
let modalContent: HTMLDivElement;

/**
 * Initialize the content component
 */
export function initialize(): HTMLDivElement {
    // Set initial content
    currentContent = about;

    // Create container structure
    const container = document.createElement('div');
    container.className = 'content-container';

    // Create header
    currentHeader = document.createElement('div');
    currentHeader.className = 'content-header';
    container.appendChild(currentHeader);

    // Create stories container
    currentStories = document.createElement('div');
    currentStories.className = 'content-items';
    currentStories.addEventListener('scroll', updateHeader);
    currentStories.addEventListener('click', handleContentClick);
    container.appendChild(currentStories);

    // Initialize components
    createMediaModal();
    createBackToTopButton();
    changeContent(currentContent);

    return container;
}

/**
 * Handle clicks within the content area
 */
function handleContentClick(e: MouseEvent) {
    const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement;
    if (!a) return;

    e.preventDefault();
    const target = a.getAttribute('href')!.substring(1);
    const workStory = url.findStoryByTarget(work, target);
    if (workStory) {
        history.pushState({}, '', url.getSectionPath('work', workStory));
        changeContent(work, url.getStorySlug(workStory), 'work');
        return;
    }

    const serviceStory = url.findStoryByTarget(services, target);
    if (serviceStory) {
        history.pushState({}, '', url.getSectionPath('services', serviceStory));
        changeContent(services, url.getStorySlug(serviceStory), 'services');
    }
}

/**
 * Switch to a different content section and optionally scroll to a specific story
 */
export function changeContent(stories: types.Story[], targetId?: string, section: url.ContentSection = 'about') {
    // Update state and render content
    currentContent = stories;
    currentSection = section;
    currentHeaderTarget = '';
    setContentHeader(stories[0]);
    currentStories.innerHTML = '';
    stories.forEach(story => currentStories.appendChild(renderStory(story)));
    updateHeader();

    // If a specific story is targeted, scroll to it
    if (targetId) {
        scrollToStory(targetId);
    }
}

export function scrollToTop() {
    if (currentStories) {
        currentStories.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // Update the header text after scrolling
        setTimeout(updateHeader, 500);
    }
}

/**
 * Scroll to a specific story by ID with precise positioning
 */
function scrollToStory(targetId: string) {
    requestAnimationFrame(() => {
        const targetSlug = url.slugify(targetId);
        const story = Array
            .from(currentStories.querySelectorAll<HTMLElement>('.story'))
            .find(element => element.dataset.slug === targetSlug || url.slugify(element.dataset.id ?? '') === targetSlug);
        if (!story) return;

        const titleEl = story.querySelector<HTMLElement>('.story-title')!;

        // Ensure all media is loaded before calculating positions
        const mediaElements = Array.from(story.querySelectorAll('img, video')) as (HTMLImageElement | HTMLVideoElement)[];
        const loadPromises = getMediaLoadPromises(mediaElements);

        alignStoryToHeader(titleEl, loadPromises);
    });
}

/**
 * Get promises that resolve when all media elements are loaded
 */
function getMediaLoadPromises(elements: (HTMLImageElement | HTMLVideoElement)[]) {
    return elements.map(el => new Promise<void>(resolve => {
        if ((el instanceof HTMLImageElement && el.complete) ||
            (el instanceof HTMLVideoElement && el.readyState >= 1)) {
            resolve();
        } else {
            const event = el instanceof HTMLImageElement ? 'load' : 'loadedmetadata';
            el.addEventListener(event, () => resolve(), {once: true});
        }
    }));
}

/**
 * Align story title with content header with precise positioning
 */
function alignStoryToHeader(titleEl: HTMLElement, loadPromises: Promise<void>[]) {
    Promise.all(loadPromises).then(() => {
        // Reset scroll position
        currentStories.scrollTop = 0;

        // Triple RAF for maximum browser compatibility
        requestAnimationFrame(() => {
            // Force layout recalculation
            void currentStories.offsetHeight;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Get measurements after layout is stable
                    const headerTop = currentHeader.getBoundingClientRect().top;
                    const containerTop = currentStories.getBoundingClientRect().top;
                    const titleTop = titleEl.getBoundingClientRect().top;

                    // Calculate precise scroll position
                    const titleRelativeToContainer = titleTop - containerTop;
                    const headerRelativeToContainer = headerTop - containerTop;
                    const scrollAmount = titleRelativeToContainer - headerRelativeToContainer;

                    // Perform scroll
                    currentStories.scrollTo({
                        top: scrollAmount,
                        behavior: 'smooth'
                    });

                    // Verify scroll position after animation completes
                    verifyScrollPosition(titleEl);
                });
            });
        });
    });
}

/**
 * Verify and adjust final scroll position if needed
 */
function verifyScrollPosition(titleEl: HTMLElement) {
    setTimeout(() => {
        const titleTop = titleEl.getBoundingClientRect().top;
        const headerTop = currentHeader.getBoundingClientRect().top;

        // Adjust if position is off by more than 2px
        if (Math.abs(titleTop - headerTop) > 2) {
            const correction = titleTop - headerTop;
            currentStories.scrollBy({
                top: correction,
                behavior: 'auto'
            });
        }
    }, 1000);
}

/**
 * Update header text based on scroll position
 */
function updateHeader() {
    const position = currentStories.scrollTop + currentHeader.offsetHeight;
    let current = currentContent[0];

    for (const element of currentStories.querySelectorAll<HTMLElement>('.story')) {
        if (element.offsetTop > position) break;
        const story = url.findStoryByTarget(currentContent, element.dataset.slug ?? '');
        if (story) current = story;
    }

    setContentHeader(current);
}

function setContentHeader(story?: types.Story): void {
    const target = story ? `${currentSection}:${url.getStorySlug(story)}` : '';
    if (currentHeaderTarget === target) return;

    currentHeaderTarget = target;
    currentHeader.innerHTML = '';

    const headerText = document.createElement('span');
    headerText.className = 'content-header-text';
    headerText.textContent = story?.title ?? '';
    currentHeader.appendChild(headerText);

    if (story && currentSection === 'work') {
        currentHeader.appendChild(createCopyLinkButton(story));
    }
}

/**
 * Create the modal for displaying expanded media
 */
function createMediaModal() {
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'media-modal-overlay';
    modalOverlay.addEventListener('click', () => modalOverlay.classList.remove('open'));

    modalContent = document.createElement('div');
    modalContent.className = 'media-modal-content';
    modalOverlay.appendChild(modalContent);

    const app = document.getElementById('app') as HTMLElement;
    app.appendChild(modalOverlay);
}

/**
 * Open the media modal with the provided element
 */
function openMediaModal(el: HTMLElement) {
    modalContent.innerHTML = '';
    modalContent.appendChild(el);
    modalOverlay.classList.add('open');
}

/**
 * Load content from imported modules
 */
function loadContent(mods: Record<string, { default: types.Story }>): types.Story[] {
    return Object
        .values(mods)
        .map(m => m.default)
        .sort(({index: a = 0}, {index: b = 0}) => a - b);
}

/**
 * Render a story object into HTML
 */
function renderStory(record: types.Story): HTMLElement {
    const story = document.createElement('div');
    story.className = 'story';

    if (!record.title) {
        throw new Error('Missing title in content record');
    }

    const storySlug = url.getStorySlug(record);
    story.dataset.id = record.title;
    story.dataset.slug = storySlug;
    story.id = storySlug;

    // Create story title element
    const storyTitle = document.createElement('div');
    storyTitle.className = 'story-title';
    const storyTitleText = document.createElement('span');
    storyTitleText.className = 'story-title-text';
    storyTitleText.textContent = record.title;
    storyTitle.appendChild(storyTitleText);

    if (currentSection === 'work') {
        storyTitle.appendChild(createCopyLinkButton(record));
    }

    story.appendChild(storyTitle);

    // Create story container for content
    const storyContainer = document.createElement('div');
    storyContainer.className = 'story-container';

    // Add metadata if available
    if (record.date) {
        const date = document.createElement('p');
        date.className = 'date';
        date.textContent = formatDate(record.date);
        storyContainer.appendChild(date);
    }

    if (record.description) {
        const desc = document.createElement('p');
        desc.className = 'description';
        desc.textContent = record.description;
        storyContainer.appendChild(desc);
    }

    // Render content blocks
    record.blocks.forEach(item => {
        storyContainer.appendChild(renderBlock(item));
    });

    story.appendChild(storyContainer);
    return story;
}

function createCopyLinkButton(record: types.Story): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'story-link-button';
    btn.type = 'button';
    btn.setAttribute('aria-label', `Copy link to ${record.title}`);
    btn.innerHTML = '<i class="fa-solid fa-link"></i>';

    btn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        copyStoryLink(btn, url.getAbsoluteSectionUrl('work', record), `Copy link to ${record.title}`);
    });

    return btn;
}

async function copyStoryLink(btn: HTMLButtonElement, href: string, label: string): Promise<void> {
    let copied = false;

    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(href);
            copied = true;
        } catch {
            copied = false;
        }
    }

    if (!copied) {
        copied = copyTextFallback(href);
    }

    if (!copied) {
        window.prompt('Copy this link:', href);
        return;
    }

    btn.classList.add('copied');
    btn.setAttribute('aria-label', 'Copied link');
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';

    window.setTimeout(() => {
        btn.classList.remove('copied');
        btn.setAttribute('aria-label', label);
        btn.innerHTML = '<i class="fa-solid fa-link"></i>';
    }, 1400);
}

function copyTextFallback(value: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        document.body.removeChild(textarea);
    }
}

/**
 * Format a date string for display
 */
function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Render a content block based on its type
 */
function renderBlock(item: types.Block): HTMLElement {
    switch (item.type) {
        case 'body':
            return createBodyBlock(item.value);

        case 'image':
            return createImageBlock(item.value, {popout: (item as any).popout});

        case 'video':
            return createVideoBlock(item.value);

        case 'caption':
            return createCaptionBlock(item.value);

        case 'subtitle':
            return createSubtitleBlock(item.value);

        default:
            throw new Error(`Unknown item type: ${item.type}`);
    }
}

/**
 * Create a text body block with markdown support
 */
function createBodyBlock(value: string): HTMLElement {
    const body = document.createElement('div');
    body.className = 'body';
    body.innerHTML = marked.parse(value) as string;
    return body;
}

/**
 * Create an image block with optional popout functionality
 */
function createImageBlock(value: string, options?: { popout?: boolean }): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'video-wrapper';

    const img = new Image();
    img.src = new URL(`../content/media/${value}`, import.meta.url).href;
    img.style.display = 'block';
    wrapper.appendChild(img);

    // Only add popout button if popout is not explicitly set to false
    // Default to true if not specified
    const showPopout = options?.popout !== false;
    if (showPopout) {
        const btn = createPopoutButton(() => {
            const clone = img.cloneNode(true) as HTMLImageElement;
            openMediaModal(clone);
        });
        wrapper.appendChild(btn);
    }

    return wrapper;
}

/**
 * Create a video block with popout functionality
 */
function createVideoBlock(value: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'video-wrapper';

    const vid = document.createElement('video');
    vid.src = new URL(`../content/media/${value}`, import.meta.url).href;
    vid.controls = false;
    vid.loop = true;
    vid.muted = true;

    // Add playsinline for iOS
    vid.setAttribute('playsinline', '');

    // Delay autoplay initialization on mobile devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) {
        vid.autoplay = true;
    } else {
        // For iOS, set autoplay after a delay
        setTimeout(() => {
            vid.autoplay = true;
        }, 300);
    }

    vid.className = 'animation';
    wrapper.appendChild(vid);

    // Modify the button to check for synthetic events
    const btn = createPopoutButton(() => {
        // Prevent iOS from auto-opening the modal by checking
        // if this is a genuine user interaction
        if (window.event && !window.event.isTrusted) {
            return;
        }

        const clone = vid.cloneNode(true) as HTMLVideoElement;
        clone.controls = true;
        openMediaModal(clone);
    });

    wrapper.appendChild(btn);
    return wrapper;
}

/**
 * Create a caption block
 */
function createCaptionBlock(value: string): HTMLElement {
    const cap = document.createElement('p');
    cap.textContent = value;
    cap.className = 'caption';
    return cap;
}

/**
 * Create a subtitle block
 */
function createSubtitleBlock(value: string): HTMLElement {
    const sub = document.createElement('h4');
    sub.textContent = value;
    sub.className = 'subtitle';
    return sub;
}

/**
 * Create a popout button for media elements
 */
function createPopoutButton(onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'popout-button';
    btn.innerHTML = '<i class="fa-solid fa-up-right-from-square"></i>';
    btn.addEventListener('click', onClick);
    return btn;
}

/**
 * Create and manage the "back to top" button
 */
function createBackToTopButton(): void {
    const backToTopBtn = document.createElement('div');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';

    // Add to DOM
    document.body.appendChild(backToTopBtn);

    // Click handler scrolls content to top
    backToTopBtn.addEventListener('click', () => {
        scrollToTop();
    });

    // Show/hide based on scroll position
    if (currentStories) {
        currentStories.addEventListener('scroll', () => {
            // Show button when scrolled down a bit (100px)
            if (currentStories.scrollTop > 100) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
    }
}
