import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Modal, { ModalComponent } from "../components/modal";
import { useKeyboardShortcut, usePref } from "../utils/hooks";
import defaultPreferences from "../utils/prefs.default";
import { KeyCombination, usePrefStateFunction } from "../types/types";
import { useForm } from "react-hook-form";
import { generatePrismaFromTemplate } from "../utils/prisma";
import { PRISMACategory } from "../types/addon";
import { buildPrismaData, PRISMAFormData } from "../utils/prismaData";

// Types
export interface PRISMAViewComponent {
    open: () => void
}

// React Component
const PRISMAView = forwardRef<PRISMAViewComponent>((_, ref) => {

    // Prefs
    const [prismaCategories,] = usePref("prismaCategories", defaultPreferences.prismaCategories, { parseJSON: true, observe: true }) as [PRISMACategory[], usePrefStateFunction]
    const [generatePRISMAShortcut,] = usePref("generatePRISMAShortcut", defaultPreferences.generatePRISMAShortcut, { parseJSON: true, observe: true }) as [KeyCombination, usePrefStateFunction]
    const [commentsTagPrefix,] = usePref("commentsTagPrefix", defaultPreferences.commentsTagPrefix, { observe: true }) as [string, usePrefStateFunction]

    // Refs
    const modalRef = useRef<ModalComponent>(null)

    // Status
    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const [selectedArticles, setSelectedArticles] = useState<Zotero.Item[]>([])
    const [exportError, setExportError] = useState("")

    // Form
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<PRISMAFormData>({
        defaultValues: {
            databases: 0,
            registers: 0,
            useOtherReasons: true
        }
    })

    const totalArticles = selectedArticles.length

    const open = () => {
        setSelectedArticles(ZoteroPane.getSelectedItems())
        setExportError("")
        setModalOpen(true)
    }

    const onSubmit = async (formData: PRISMAFormData) => {
        setExportError("")
        try {
            const prismaData = buildPrismaData(selectedArticles, prismaCategories, commentsTagPrefix, formData)
            if (await generatePrismaFromTemplate(prismaData)) modalRef.current?.close()
        } catch (error) {
            Zotero.logError(error instanceof Error ? error : new Error(String(error)))
            setExportError(`Could not generate the PRISMA diagram: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    // Keyboard Shortcuts
    useKeyboardShortcut(generatePRISMAShortcut, () => {
        open()
    })

    // Export functions
    useImperativeHandle(ref, () => ({
        open: open
    }))

    return (
        <Modal
            ref={modalRef}
            title="Generate PRISMA Diagram"
            openState={modalOpen} setOpenState={setModalOpen}
        >
            <div className="w-[32rem]">
                <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
                    <h2 className="font-bold text-lg">Identification</h2>
                    <div className="flex flex-row gap-4">
                        <div className="flex flex-1 flex-col gap-2">
                            <label htmlFor="databases">
                                Records identified from databases:
                            </label>
                            <input
                                {...register("databases", { valueAsNumber: true, required: true, min: 0 })}
                                type="number" min="0" step="1" required
                                id="databases"
                                className="input"
                                autoFocus={true}
                            />
                        </div>
                        <div className="flex flex-1 flex-col gap-2">
                            <label htmlFor="registers">
                                Records identified from registers:
                            </label>
                            <input
                                {...register("registers", { valueAsNumber: true, required: true, min: 0 })}
                                type="number" min="0" step="1" required
                                id="registers"
                                className="input"
                            />
                        </div>
                    </div>
                    <h2 className="font-bold text-lg">Inclusion</h2>
                    <div className="flex flex-row gap-2">
                        <span>Total records selected:</span>
                        <strong>{totalArticles}</strong>

                        {/* <span>Included:</span>
                        <strong>{totalArticles}</strong> */}
                    </div>
                    <label className="flex flex-row gap-2 bg-slate-100 border border-slate-200 rounded p-4">
                        <div>
                            <input
                                {...register("useOtherReasons")}
                                type="checkbox"
                            />
                        </div>
                        <div>
                            Use comments as exclusion reasons
                            <div className="text-sm text-slate-500">
                                If checked, comments will be used as extra exclusion reasons in the eligibility section.
                            </div>
                        </div>
                    </label>
                    {exportError && <p role="alert">{exportError}</p>}
                    <div className="flex flex-row gap-4">
                        <input id="prisma-data" name="prisma-data" type="hidden" />
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? "Generating…" : "Generate Diagram"}</button>
                        <button type="button" className="btn btn-clear" onClick={() => { modalRef.current?.close() }}>Cancel</button>
                    </div>
                    <div>
                        <br />
                        <strong>References</strong><br />
                        <small className="text-sm text-slate-500">
                            From: Page MJ, McKenzie JE, Bossuyt PM, Boutron I, Hoffmann TC,
                            Mulrow CD, et al. The PRISMA 2020 statement: an updated
                            guideline for reporting systematic reviews. BMJ 2021;372:n71.
                            doi: 10.1136/bmj.n71
                        </small>
                    </div>
                </form>
            </div >
        </Modal>
    )
})
export default PRISMAView
