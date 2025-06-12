export interface Block {
    type: 'date' | 'description' | 'body' | 'image' | 'caption' | 'subtitle' | 'video';
    value: string;
}

export interface Story {
    title?: string;
    date?: string;
    description?: string;
    index?: number;
    blocks: Block[];
}