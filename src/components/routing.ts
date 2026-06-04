import * as content from './content';
import * as types from './types';
import * as url from './url';

interface RouteState {
    section: url.ContentSection;
    story?: types.Story;
}

export function initialize(): void {
    window.addEventListener('popstate', applyCurrentRoute);
    applyCurrentRoute();
}

export function navigateTo(section: url.ContentSection, story?: types.Story): void {
    history.pushState({}, '', url.getSectionPath(section, story));
    applyRoute({section, story});
}

function applyCurrentRoute(): void {
    const route = resolveCurrentRoute();
    applyRoute(route);
    canonicalizeHashRoute(route);
}

function applyRoute(route: RouteState): void {
    const target = route.story ? url.getStorySlug(route.story) : undefined;

    switch (route.section) {
        case 'about':
            content.changeContent(content.about, target, 'about');
            break;
        case 'services':
            content.changeContent(content.services, target, 'services');
            break;
        case 'work':
            content.changeContent(content.work, target, 'work');
            break;
    }
}

function resolveCurrentRoute(): RouteState {
    const hashRoute = resolveHashRoute();
    if (hashRoute) return hashRoute;

    const path = window.location.pathname.replace(/\/+$/g, '') || '/';
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 0 || parts[0] === 'about') {
        return {section: 'about'};
    }

    if (parts[0] === 'services') {
        return {
            section: 'services',
            story: parts[1] ? url.findStoryByTarget(content.services, parts[1]) : undefined,
        };
    }

    if (parts[0] === 'work') {
        return {
            section: 'work',
            story: parts[1] ? url.findStoryByTarget(content.work, parts[1]) : undefined,
        };
    }

    return {section: 'about'};
}

function resolveHashRoute(): RouteState | undefined {
    const target = window.location.hash.replace(/^#/, '');
    if (!target) return undefined;

    const workStory = url.findStoryByTarget(content.work, target);
    if (workStory) return {section: 'work', story: workStory};

    const serviceStory = url.findStoryByTarget(content.services, target);
    if (serviceStory) return {section: 'services', story: serviceStory};

    return undefined;
}

function canonicalizeHashRoute(route: RouteState): void {
    if (!window.location.hash) return;

    history.replaceState({}, '', url.getSectionPath(route.section, route.story));
}
