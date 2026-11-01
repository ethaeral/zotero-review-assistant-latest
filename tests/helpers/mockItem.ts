type MockTag = { tag: string }

export function createMockItem(initialTags: string[] = []): Zotero.Item {
    const tags = new Set(initialTags)

    return {
        getTags(): MockTag[] {
            return [...tags].map((tag) => ({ tag }))
        },
        hasTag(tag: string): boolean {
            return tags.has(tag)
        },
        addTag(tag: string): void {
            tags.add(tag)
        },
        removeTag(tag: string): void {
            tags.delete(tag)
        },
    } as Zotero.Item
}
