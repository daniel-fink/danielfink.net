import * as types from './types';

export type ContentSection = 'about' | 'services' | 'work';

export function slugify(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function getStorySlug(story: types.Story): string {
    return slugify(story.title ?? '');
}

export function findStoryByTarget(stories: types.Story[], target: string): types.Story | undefined {
    const normalizedTarget = slugify(decodeURIComponent(target));
    return stories.find(story => getStorySlug(story) === normalizedTarget);
}

export function getSectionPath(section: ContentSection, story?: types.Story): string {
    if (section === 'about') return '/about';

    const sectionPath = `/${section}`;
    if (!story) return sectionPath;

    return `${sectionPath}/${getStorySlug(story)}`;
}

export function getAbsoluteSectionUrl(section: ContentSection, story?: types.Story): string {
    return new URL(getSectionPath(section, story), window.location.origin).href;
}
