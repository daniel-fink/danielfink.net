import {copyFile, mkdir, readdir, readFile} from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const indexHtml = path.join(distDir, 'index.html');

function slugify(value) {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function loadStories(dir) {
    const files = await readdir(dir);
    const stories = await Promise.all(
        files
            .filter(file => file.endsWith('.json'))
            .map(async file => JSON.parse(await readFile(path.join(dir, file), 'utf8')))
    );

    return stories.filter(story => story.title);
}

async function createAlias(route) {
    const routeDir = path.join(distDir, route);
    await mkdir(routeDir, {recursive: true});
    await copyFile(indexHtml, path.join(routeDir, 'index.html'));
}

const services = await loadStories(path.join(rootDir, 'src/content/services'));
const work = await loadStories(path.join(rootDir, 'src/content/work'));

const routes = [
    'about',
    'services',
    'work',
    ...services.map(story => `services/${slugify(story.title)}`),
    ...work.map(story => `work/${slugify(story.title)}`),
];

await Promise.all(routes.map(createAlias));
console.log(`Generated ${routes.length} route aliases.`);
