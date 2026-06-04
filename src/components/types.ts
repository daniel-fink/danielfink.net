export interface Block {
    type: 'date' | 'description' | 'body' | 'image' | 'caption' | 'subtitle' | 'video';
    value: string;
    alt?: string;
    popout?: boolean;
}

export interface Story {
    title?: string;
    date?: string;
    description?: string;
    index?: number;
    blocks: Block[];
}
