import { describe, expect, it } from "vitest"

import { createMockItem } from "../helpers/mockItem"
import {
    countArticlesWithTag,
    getComments,
    getKeyCombination,
    getMatchingTag,
    getStatus,
    getStringFromKeyCombination,
    JSONFromString,
} from "../../src/utils/utils"

describe("getKeyCombination", () => {
    it("parses modifier keys and a letter", () => {
        expect(getKeyCombination("Ctrl Alt A")).toEqual({
            ctrlKey: true,
            altKey: true,
            shiftKey: false,
            metaKey: false,
            code: "KeyA",
        })
    })

    it("parses a single digit", () => {
        expect(getKeyCombination("Digit 5")).toEqual({
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            code: "Digit5",
        })
    })

    it("parses a lone digit token", () => {
        expect(getKeyCombination("5")).toEqual({
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            code: "Digit5",
        })
    })
})

describe("getStringFromKeyCombination", () => {
    it("formats keys using Linux labels from setup", () => {
        const combination = getKeyCombination("Ctrl Alt A")
        expect(getStringFromKeyCombination(combination)).toBe("Ctrl Alt A")
    })
})

describe("JSONFromString", () => {
    it("parses valid JSON", () => {
        expect(JSONFromString('{"a":1}')).toEqual({ a: 1 })
    })

    it("returns default on invalid JSON", () => {
        expect(JSONFromString("not json", { ok: false })).toEqual({ ok: false })
    })

    it("returns default for empty string", () => {
        expect(JSONFromString("", [])).toEqual([])
    })
})

describe("tag helpers", () => {
    const statusList = [
        {
            tag: "#Status: Included",
            label: "Included",
            color: "#60a5fa",
            invertTextColor: false,
        },
        {
            tag: "#Status: Excluded",
            label: "Excluded",
            color: "#f87171",
            invertTextColor: true,
        },
    ]

    it("getStatus finds matching status from item tags", () => {
        const item = createMockItem(["#Status: Included", "other"])
        expect(getStatus(item, statusList)?.label).toBe("Included")
    })

    it("getMatchingTag returns first matching tag from list", () => {
        const item = createMockItem(["foo", "#Status: Excluded"])
        expect(getMatchingTag(item, ["missing", "#Status: Excluded"])).toBe(
            "#Status: Excluded",
        )
    })

    it("getComments filters by prefix", () => {
        const prefix = "#Status: Comments: "
        const item = createMockItem([
            prefix + "Reason A",
            "#Status: Included",
        ])
        expect(getComments(prefix, item)).toEqual([prefix + "Reason A"])
    })

    it("countArticlesWithTag counts items with tag", () => {
        const items = [
            createMockItem(["#tag"]),
            createMockItem([]),
            createMockItem(["#tag", "other"]),
        ]
        expect(countArticlesWithTag(items, "#tag")).toBe(2)
    })
})
