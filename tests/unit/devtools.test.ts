import { beforeEach, describe, expect, it, vi } from "vitest"

import { log } from "../../src/utils/devtools"

describe("plugin logging", () => {
    beforeEach(() => {
        vi.stubGlobal("pluginLogPath", "")
        vi.stubGlobal("Zotero", {
            getMainWindow: vi.fn(() => ({ console: { log: vi.fn() } })),
            debug: vi.fn(),
            log: vi.fn(),
            logError: vi.fn(),
            File: {
                pathToFile: vi.fn(() => { throw new Error("Invalid path") }),
            },
        })
    })

    it("can log before a main window exists", async () => {
        vi.mocked(Zotero.getMainWindow).mockReturnValue(null as unknown as Window)
        await expect(log("starting")).resolves.toBeUndefined()
    })

    it("does not interpret a missing environment value as a path", async () => {
        vi.stubGlobal("pluginLogPath", "undefined")
        await expect(log("starting")).resolves.toBeUndefined()
        expect(Zotero.File.pathToFile).not.toHaveBeenCalled()
    })

    it("does not stop startup when an optional log file cannot be opened", async () => {
        vi.stubGlobal("pluginLogPath", "/unwritable/plugin.log")
        await expect(log("starting")).resolves.toBeUndefined()
        expect(Zotero.logError).toHaveBeenCalled()
    })
})
