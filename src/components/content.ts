import './content.css';
import * as types from "./types";

const contentRecords: types.ContentRecord[] = Object
    .values(import.meta.glob('../content/*.json', {eager: true}) as Record<string, { default: types.ContentRecord }>)
    .map(m => m.default)
    .sort(({index: a = 0}, {index: b = 0}) => a - b);

export function initialize(): HTMLDivElement {
    // Root container
    const container = document.createElement('div');
    container.className = 'content-container';

    const header = document.createElement('div');
    header.className = 'menu-header';
    container.appendChild(header);

    // Content items
    const content = document.createElement('div');
    content.className = 'content-items';
    // Render each contentRecord
    contentRecords.forEach(record => {
        const story = renderRecord(record);
        content.appendChild(story);
    });
    container.appendChild(content);


    return container;
}


function renderItem(item: types.ContentItem): HTMLElement {
    switch (item.type) {
        case 'body':
            const p: HTMLParagraphElement = document.createElement('p');
            p.textContent = item.value;
            return p;
        case 'image': {
            const img = new Image();
            img.src = new URL(`../content/images/${item.value}`, import.meta.url).href;
            return img;
        }
        case 'caption':
            const cap: HTMLParagraphElement = document.createElement('p');
            cap.textContent = item.value;
            cap.className = 'caption';
            return cap;
        default:
            throw new Error(`Unknown item type: ${item.type}`);
    }
}

function renderRecord(record: types.ContentRecord): HTMLElement {
    const story = document.createElement('story');

    // Title
    if (record.title) {
        const h2 = document.createElement('h2');
        h2.textContent = record.title;
        story.appendChild(h2);
    }

    // Description
    if (record.description) {
        const desc = document.createElement('p');
        desc.textContent = record.description;
        story.appendChild(desc);
    }

    // Content Items
    record.content.forEach(item => {
        const renderedItem = renderItem(item);
        story.appendChild(renderedItem);
    });

    return story;
}