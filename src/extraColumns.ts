import { ArticleStatus, PRISMACategory } from "./types/addon"
import { getPRISMALabel, refreshItemTreeColumns, registerColumn, unregisterAllColumns } from "./utils/columns.utils"
import { ensurePluginWindowApi } from "./utils/pluginWindowApi"
import { getZoteroPref } from "./utils/prefs"
import defaultPreferences from "./utils/prefs.default"

import { JSONFromString } from "./utils/utils"

function getArrayPref<T>(name: string, fallback: T[]): T[] {
    const value = JSONFromString(getZoteroPref(name) as string, fallback)
    return Array.isArray(value) ? value : fallback
}

export async function registerExtraColumns(id: string) {

    await unregisterAllColumns()
    ensurePluginWindowApi(Zotero.getMainWindow())

    // Hooks
    // -- Status
    const statusDataKey = await registerColumn({
        pluginID: id,
        dataKey: 'status',
        label: 'Status',
        flex: 1,
        minWidth: 50,
        width: "100px",
        zoteroPersist: ["width", "hidden", "sortDirection"],
        dataProvider: (item: Zotero.Item, _) => {
            const statusList = getArrayPref<ArticleStatus>("statusList", defaultPreferences.statusList)
            return JSON.stringify(statusList.filter(status => item.hasTag(status.tag)))
        },
        renderCell: (index: number, rawData: string, column: any): HTMLElement => {
            // Get the data
            try {
                const data = JSON.parse(rawData) as ArticleStatus[]

                // Create the cell element
                const element = Zotero.getMainWindow().document.createElement("span")
                element.className = `cell ${column.className}` // Do not remove this or the column will look weird

                // Set the innerHTML
                data.map(item => {
                    const element = Zotero.getMainWindow().document.createElement("span")
                    element.className = `rt-badge ${item.invertTextColor ? "invert-text" : ""}`
                    element.style.backgroundColor = item.color
                    element.textContent = item.label
                    return element
                }).forEach(spanElement => {
                    element.append(spanElement)
                })

                // Return the created cell element
                return element
            } catch {
                const fallbackElement = Zotero.getMainWindow().document.createElement("span")
                fallbackElement.className = `cell ${column.className}` // Do not remove this or the column will look weird
                return fallbackElement
            }
        }
    })

    // -- PRISMA
    const prismaDataKey = await registerColumn({
        pluginID: id,
        dataKey: 'prisma',
        label: 'PRISMA Category',
        flex: 1,
        minWidth: 100,
        width: "200px",
        zoteroPersist: ["width", "hidden", "sortDirection"],
        dataProvider: (item: Zotero.Item, _: string) => {
            try {
                const prismaCategories = getArrayPref<PRISMACategory>("prismaCategories", defaultPreferences.prismaCategories)
                const category = prismaCategories.find(cat => item.hasTag(cat.tag))
                return category ? getPRISMALabel(category.label) : ""
            } catch {
                return ""
            }
        }
    })

    // -- Comments
    const commentsDataKey = await registerColumn({
        pluginID: id,
        dataKey: 'comments',
        label: 'Status Comments',
        flex: 1,
        minWidth: 100,
        width: "200px",
        zoteroPersist: ["width", "hidden", "sortDirection"],
        dataProvider: (item: Zotero.Item, _: string) => {
            const commentsTagPrefix = (getZoteroPref("commentsTagPrefix") ?? defaultPreferences.commentsTagPrefix) as string
            let res = item.getTags().filter(tag => tag.tag.startsWith(commentsTagPrefix))
            if (res.length < 1) {
                return ""
            }
            return res[0].tag.replace(commentsTagPrefix, "")
        }
    })

    await refreshItemTreeColumns()

    return { statusDataKey, prismaDataKey, commentsDataKey }
}
