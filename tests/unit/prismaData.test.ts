import { describe, expect, it } from "vitest"

import { buildPrismaData } from "../../src/utils/prismaData"
import defaults from "../../src/utils/prefs.default"
import { createMockItem } from "../helpers/mockItem"

const category = (name: string) => defaults.prismaCategories.find(cat => cat.name === name)!.tag
const items = [
    createMockItem([category("identification:duplicated")]),
    createMockItem([category("screening:screen:excluded")]),
    createMockItem([category("screening:retrieval:excluded")]),
    createMockItem([category("screening:eligibility:excluded"), defaults.commentsTagPrefix + "Wrong population"]),
    createMockItem([category("screening:eligibility:excluded")]),
    createMockItem([category("included:studies")]),
]

describe("PRISMA payload", () => {
    it.each([true, false])("keeps stage totals complete with comments enabled=%s", (useOtherReasons) => {
        const data = buildPrismaData(items, defaults.prismaCategories, defaults.commentsTagPrefix, { databases: 6, registers: 0, useOtherReasons })
        expect(data["screening:screen"]).toBe(5)
        expect(data["screening:retrieval"]).toBe(4)
        expect(data["screening:eligibility"]).toBe(3)
        expect(data["included:studies"]).toBe(1)
    })

    it("counts exclusions without a comment rather than dropping them", () => {
        const data = buildPrismaData(items, defaults.prismaCategories, defaults.commentsTagPrefix, { databases: 6, registers: 0, useOtherReasons: true })
        expect(data["screening:eligibility:excluded"]).toEqual([
            { label: "Wrong population", records: 1 },
            { label: "No reason provided", records: 1 },
        ])
    })

    it("groups exclusions without disclosing comments when comments are disabled", () => {
        const data = buildPrismaData(items, defaults.prismaCategories, defaults.commentsTagPrefix, { databases: 6, registers: 0, useOtherReasons: false })
        expect(data["screening:eligibility:excluded"]).toEqual([{ label: "Screening: Not Eligible", records: 2 }])
    })

    it("uses zero counts for removed categories", () => {
        const data = buildPrismaData([], [], defaults.commentsTagPrefix, { databases: 0, registers: 0, useOtherReasons: false })
        expect(data["screening:screen"]).toBe(0)
        expect(data["included:studies"]).toBe(0)
    })
})
