import { beforeEach, describe, expect, it, vi } from "vitest"

import { registerExtraColumns } from "../../src/extraColumns"
import { setPluginInfo } from "../../src/utils/pluginInfo"
import defaults from "../../src/utils/prefs.default"
import { createMockItem } from "../helpers/mockItem"

const { columns } = vi.hoisted(() => ({ columns: new Map<string, any>() }))

vi.mock("../../src/utils/columns.utils", async (importOriginal) => ({
    ...await importOriginal<typeof import("../../src/utils/columns.utils")>(),
    registerColumn: vi.fn(async (options) => {
        columns.set(options.dataKey, options)
        return options.dataKey
    }),
    unregisterAllColumns: vi.fn(),
    refreshItemTreeColumns: vi.fn(),
}))

const prefs = new Map<string, string>()

describe("review columns", () => {
    beforeEach(() => {
        columns.clear()
        prefs.clear()
        setPluginInfo({ id: "test@example.com", version: "test", rootURI: "file:///addon/", referenceName: "ZRA" })
        const win = {}
        vi.stubGlobal("Zotero", {
            getMainWindow: () => win,
            Prefs: { get: (key: string) => prefs.get(key) },
        })
    })

    it("renders status, PRISMA category and comments on a fresh profile", async () => {
        await registerExtraColumns("test@example.com")
        const item = createMockItem([
            defaults.statusList[0].tag,
            defaults.prismaCategories[0].tag,
            defaults.commentsTagPrefix + "Relevant",
        ])
        expect(JSON.parse(columns.get("status").dataProvider(item))).toEqual([defaults.statusList[0]])
        expect(columns.get("prisma").dataProvider(item)).toBe("Identification › Duplicated")
        expect(columns.get("comments").dataProvider(item)).toBe("Relevant")
    })

    it("uses edited preferences without restarting or re-registering columns", async () => {
        prefs.set("extensions.ZRA.statusList", JSON.stringify(defaults.statusList))
        await registerExtraColumns("test@example.com")
        const customStatus = { ...defaults.statusList[0], label: "Screened", tag: "#Screened" }
        prefs.set("extensions.ZRA.statusList", JSON.stringify([customStatus]))
        prefs.set("extensions.ZRA.commentsTagPrefix", "Review: ")
        const item = createMockItem([customStatus.tag, "Review: Context"])
        expect(JSON.parse(columns.get("status").dataProvider(item))).toEqual([customStatus])
        expect(columns.get("comments").dataProvider(item)).toBe("Context")
    })

    it("uses safe defaults when array preferences contain invalid JSON or the wrong shape", async () => {
        prefs.set("extensions.ZRA.statusList", "{")
        prefs.set("extensions.ZRA.prismaCategories", "{}")
        await registerExtraColumns("test@example.com")
        const item = createMockItem([defaults.statusList[0].tag, defaults.prismaCategories[0].tag])
        expect(JSON.parse(columns.get("status").dataProvider(item))).toEqual([defaults.statusList[0]])
        expect(columns.get("prisma").dataProvider(item)).toBe("Identification › Duplicated")
    })
})
