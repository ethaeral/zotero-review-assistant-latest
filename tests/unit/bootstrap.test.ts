import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import { beforeEach, describe, expect, it, vi } from "vitest"

const bootstrapSource = ts.transpileModule(
    readFileSync(new URL("../../src/bootstrap.ts", import.meta.url), "utf8"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } },
).outputText

describe("Zotero bootstrap lifecycle", () => {
    let mainWindow: Record<string, any> | null
    let context: Record<string, any>
    let loadSubScript: ReturnType<typeof vi.fn>
    let init: ReturnType<typeof vi.fn>

    beforeEach(() => {
        mainWindow = {}
        init = vi.fn(async () => {})
        loadSubScript = vi.fn((_url, win) => {
            win.ZRA = { init, onMainWindowLoad: vi.fn(), onMainWindowUnload: vi.fn(), shutdown: vi.fn() }
        })
        context = {
            exports: {},
            require: (name: string) => name.includes("devtools") ? { log: vi.fn() } : { setPluginInfo: vi.fn() },
            referenceName: "ZRA",
            Zotero: {
                getMainWindow: () => mainWindow,
                getMainWindows: () => mainWindow ? [mainWindow] : [],
                initializationPromise: Promise.resolve(),
                unlockPromise: Promise.resolve(),
                uiReadyPromise: Promise.resolve(),
            },
            Services: { scriptloader: { loadSubScript } },
        }
        runInNewContext(bootstrapSource, context)
    })

    const props = { id: "test@example.com", version: "test", rootURI: "file:///addon/" }

    it("waits for asynchronous plugin initialization", async () => {
        const steps: string[] = []
        init.mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 5))
            steps.push("initialized")
        })
        await context.startup(props)
        steps.push("startup complete")
        expect(steps).toEqual(["initialized", "startup complete"])
    })

    it("loads and initializes the plugin after the main window is reopened", async () => {
        await context.startup(props)
        const reopenedWindow = {}
        mainWindow = reopenedWindow
        await context.onMainWindowLoad({ window: reopenedWindow })
        expect(loadSubScript).toHaveBeenCalledTimes(2)
        expect(init).toHaveBeenCalledTimes(2)
    })

    it("can be disabled after the last main window closes", async () => {
        await context.startup(props)
        mainWindow = null
        await expect(context.shutdown({})).resolves.toBeUndefined()
    })
})
