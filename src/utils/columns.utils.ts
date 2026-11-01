import { ArticleStatus, PRISMACategory } from "../types/addon"
import { log } from "./devtools"
import { getPluginInfo } from "./pluginInfo"
import { ensurePluginWindowApi } from "./pluginWindowApi"

type SaveTxUndoOptions = {
    undoAction: string
    undoActionArgs?: { count: number }
}

function saveItemTx(item: Zotero.Item, options?: SaveTxUndoOptions) {
    if (options) {
        item.saveTx(options as Parameters<Zotero.Item["saveTx"]>[0])
        return
    }
    item.saveTx()
}

export async function refreshItemTreeColumns() {
    if (typeof Zotero.ItemTreeManager.refreshColumns === "function") {
        await Zotero.ItemTreeManager.refreshColumns()
    }
}

export async function registerColumn(
    options: _ZoteroTypes.ItemTreeManager.ItemTreeColumnOptions,
): Promise<string | false> {
    await log("columns.utils: registerColumn", options.dataKey)

    const win = Zotero.getMainWindow()
    const api = ensurePluginWindowApi(win)

    const columnOptions = {
        enabledTreeIDs: ["main"],
        pluginID: getPluginInfo().id,
        ...options,
    }

    const alreadyRegistered = api.extraColumns.some(
        (key) => key === columnOptions.dataKey || key.endsWith(`-${columnOptions.dataKey}`),
    )
    if (alreadyRegistered) {
        return columnOptions.dataKey
    }

    const registerColumnFn =
        Zotero.ItemTreeManager.registerColumn || Zotero.ItemTreeManager.registerColumns

    const dataKey = await registerColumnFn.apply(Zotero.ItemTreeManager, [columnOptions])
    if (!dataKey) {
        return false
    }

    if (!api.extraColumns.includes(dataKey)) {
        api.extraColumns.push(dataKey)
    }

    return dataKey
}

export async function unregisterAllColumns() {
    const win = Zotero.getMainWindow()
    const api = ensurePluginWindowApi(win)
    if (api.extraColumns.length === 0) {
        return
    }

    for (const dataKey of [...api.extraColumns]) {
        await Zotero.ItemTreeManager.unregisterColumn(dataKey)
    }
    api.extraColumns = []
}

export function setItemStatus(statusList: ArticleStatus[], status: ArticleStatus) {
    const selectedArticles = ZoteroPane.getSelectedItems()
    replaceTags({
        articles: selectedArticles,
        removeTags: statusList.map(stat => stat.tag) as string[],
        newTags: status ? [status.tag] : [],
    })
}

export function setItemComments(commentsTagPrefix: string, comments: string) {
    const selectedArticles = ZoteroPane.getSelectedItems()
    const reasonTag = commentsTagPrefix + comments

    for (const item of selectedArticles) {
        item.getTags().map((tag) => {
            if (tag.tag.includes(commentsTagPrefix)) item.removeTag(tag.tag)
        })

        if (comments != "") {
            item.addTag(reasonTag)
        }
        saveItemTx(item, {
            undoAction: "undo-action-edit-item-tags",
            undoActionArgs: { count: 1 },
        })
    }
}

export function getPRISMALabel(value: string): string {
    return value.replace(":", " ›")
}

export function setItemPRISMACategory(categoryList: PRISMACategory[], newCategory: PRISMACategory) {
    const selectedArticles = ZoteroPane.getSelectedItems()
    replaceTags({
        articles: selectedArticles,
        removeTags: categoryList.map(stat => stat.tag) as string[],
        newTags: newCategory ? [newCategory.tag] : [],
    })
}

type ReplaceTagsArgs = {
    articles: Zotero.Item[]
    removeTags: string[]
    newTags: string[]
}

function replaceTags({ articles, removeTags, newTags }: ReplaceTagsArgs) {
    articles.map(article => {
        removeTags.map(tag => {
            if (article.hasTag(tag)) article.removeTag(tag)
        })

        newTags.map(tag => {
            if (tag && tag != "") article.addTag(tag)
        })

        saveItemTx(article, {
            undoAction: "undo-action-edit-item-tags",
            undoActionArgs: { count: 1 },
        })
    })
}
