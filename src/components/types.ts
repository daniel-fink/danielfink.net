export interface ContentItem {
    type: 'body' | 'image' | 'caption';
    value: string;
}

export interface ContentRecord {
    title?: string;
    description?: string;
    index?: number;
    content: ContentItem[];
}