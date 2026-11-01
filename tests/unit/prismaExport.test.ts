import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import PizZip from "pizzip"

import { buildPrismaData } from "../../src/utils/prismaData"
import defaults from "../../src/utils/prefs.default"
import { setPluginInfo } from "../../src/utils/pluginInfo"
import { showFilePicker } from "../../src/utils/helpers"
import { generatePrismaFromTemplate } from "../../src/utils/prisma"

vi.hoisted(() => {
    vi.stubGlobal("window", {})
    vi.stubGlobal("ChromeUtils", { importESModule: () => ({ FilePicker: { filterAll: 1 } }) })
})
vi.mock("../../src/utils/helpers", () => ({ showFilePicker: vi.fn() }))

const zipUtils = createRequire(import.meta.url)("pizzip/utils")
const template = readFileSync(new URL("../../assets/template.docx", import.meta.url)).toString("binary")
const payload = buildPrismaData([], defaults.prismaCategories, defaults.commentsTagPrefix, { databases: 0, registers: 0, useOtherReasons: true })

describe("PRISMA document export", () => {
    beforeEach(() => {
        setPluginInfo({ id: "test@example.com", version: "test", rootURI: "file:///test-addon/", referenceName: "ZRA" })
        vi.spyOn(zipUtils, "getBinaryContent").mockImplementation((_path, callback: any) => callback(null, template))
        vi.mocked(showFilePicker).mockResolvedValue("/output/prisma.docx")
        vi.stubGlobal("Zotero", {
            File: {
                pathToFile: vi.fn(path => path),
                putContentsAsync: vi.fn(async () => {}),
            },
        })
    })

    afterEach(() => vi.restoreAllMocks())

    it("renders the real template into a valid Word document", async () => {
        await expect(generatePrismaFromTemplate(payload)).resolves.toBe(true)
        expect(zipUtils.getBinaryContent).toHaveBeenCalledWith("file:///test-addon/assets/template.docx", expect.any(Function))
        const buffer = vi.mocked(Zotero.File.putContentsAsync).mock.calls[0][1] as ArrayBuffer
        const xml = new PizZip(buffer).file("word/document.xml")!.asText()
        const text = xml.replace(/<[^>]+>/g, "")
        expect(text.includes("Records screened")).toBe(true)
        expect(/undefined|NaN|\{screening:/.test(text)).toBe(false)
    })

    it("returns normally without writing when the save dialog is cancelled", async () => {
        vi.mocked(showFilePicker).mockResolvedValue(undefined)
        await expect(generatePrismaFromTemplate(payload)).resolves.toBe(false)
        expect(Zotero.File.pathToFile).not.toHaveBeenCalled()
        expect(Zotero.File.putContentsAsync).not.toHaveBeenCalled()
    })

    it("reports template-loading errors to the caller", async () => {
        vi.mocked(zipUtils.getBinaryContent).mockImplementation((_path, callback: any) => callback(new Error("Template missing")))
        await expect(generatePrismaFromTemplate(payload)).rejects.toThrow("Template missing")
        expect(showFilePicker).not.toHaveBeenCalled()
    })

    it("reports save errors to the caller", async () => {
        vi.mocked(Zotero.File.putContentsAsync).mockRejectedValue(new Error("Disk full"))
        await expect(generatePrismaFromTemplate(payload)).rejects.toThrow("Disk full")
    })
})
