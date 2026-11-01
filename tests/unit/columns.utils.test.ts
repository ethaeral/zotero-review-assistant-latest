import { describe, expect, it } from "vitest"

import { getPRISMALabel } from "../../src/utils/columns.utils"

describe("getPRISMALabel", () => {
    it("replaces colon with chevron separator", () => {
        expect(getPRISMALabel("identification:duplicated")).toBe(
            "identification ›duplicated",
        )
    })
})
