// src/contentRenderer.ts
import type {ContentRecord, ContentItem} from './types';

// If you need image URLs:
const imageData = import.meta.glob('./content/images/*', {eager: true, as: 'url'}) as Record<string, string>;

export function renderContent(records: ContentRecord[]): HTMLElement {
    const container = document.createElement('div');
    container.className = 'content';

    records.forEach(record => {
        const section = document.createElement('section');
        // title, desc, content loop...
        record.content.forEach((item: ContentItem) => {
            // switch on item.type → p, img, caption, etc.
        });
        container.appendChild(section);
    });

    return container;
}

function renderItem(item: ContentItem): HTMLElement {
    switch (item.type) {
        case 'body':
            const p: HTMLParagraphElement = document.createElement('p');
            p.textContent = item.value;
            return p;
        case 'image': {
            const key = `./content/images/${item.value}`;
            const imgUrl = imageData[key];
            if (!imgUrl) {
                console.warn(`Image not found for key: ${key}`);
            }
            const img: HTMLImageElement = document.createElement('img');
            img.src = imgUrl;
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

export function renderRecord(record: ContentRecord): HTMLElement {
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