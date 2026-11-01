import { describe, expect, it } from "vitest"

import { isMainKeyValid } from "../../src/components/keystrokeInput/keystrokeInputUtils"

describe("isMainKeyValid", () => {
    it("rejects modifier-only keys", () => {
        expect(isMainKeyValid("Shift")).toBe(false)
        expect(isMainKeyValid("Alt")).toBe(false)
        expect(isMainKeyValid("Control")).toBe(false)
        expect(isMainKeyValid("Meta")).toBe(false)
    })

    it("accepts ordinary keys", () => {
        expect(isMainKeyValid("A")).toBe(true)
        expect(isMainKeyValid("Enter")).toBe(true)
    })
})
