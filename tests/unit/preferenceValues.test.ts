import { beforeEach, describe, expect, it, vi } from "vitest"
import { usePrefWithoutHook } from "../../src/utils/hooks/prefs"
import { setPluginInfo } from "../../src/utils/pluginInfo"

const prefs = new Map<string, string>()
const defaults = [{ label: "Included", tag: "#Included" }]

describe("JSON preference values", () => {
    beforeEach(() => {
        prefs.clear()
        setPluginInfo({ id: "test@example.com", version: "test", rootURI: "file:///addon/", referenceName: "ZRA" })
        vi.stubGlobal("Zotero", {
            Prefs: {
                get: (key: string) => prefs.get(key),
                set: (key: string, value: string) => prefs.set(key, value),
            },
        })
    })

    it("initializes a new profile with usable defaults", () => {
        expect(usePrefWithoutHook("statusList", defaults, { parseJSON: true })[0]).toEqual(defaults)
        expect(prefs.get("extensions.ZRA.statusList")).toBe(JSON.stringify(defaults))
    })

    it.each(["{", "{}", "null"])("keeps the UI usable with a malformed stored array (%s)", (value) => {
        prefs.set("extensions.ZRA.statusList", value)
        expect(usePrefWithoutHook("statusList", defaults, { parseJSON: true })[0]).toEqual(defaults)
        expect(prefs.get("extensions.ZRA.statusList")).toBe(value)
    })

    it("preserves an intentionally empty list", () => {
        prefs.set("extensions.ZRA.statusList", "[]")
        expect(usePrefWithoutHook("statusList", defaults, { parseJSON: true })[0]).toEqual([])
    })
})
