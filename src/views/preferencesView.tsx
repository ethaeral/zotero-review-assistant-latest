import { useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import defaultPreferences from "../utils/prefs.default"
import Table from "../components/table"
import Modal from "../components/modal"
import KeystrokeInput from "../components/keystrokeInput/keystrokeInput"
import { usePref } from "../utils/hooks"
import { getStringFromKeyCombination, JSONFromString } from "../utils/utils"

import { KeyCombination, usePrefStateFunction } from "../types/types"
import { ArticleStatus, PRISMACategory } from "../types/addon"
import { Keystroke } from "../components/keystrokeInput/keystrokeInputUtils"

import { log } from "../utils/devtools"

function PreferencePane() {
    Zotero.log("Rendering PreferencePane")

    const [statusList, setStatusList] = usePref("statusList", defaultPreferences.statusList, { parseJSON: true }) as [
        ArticleStatus[],
        usePrefStateFunction,
    ]
    const [prismaCategories, setPrismaCategories] = usePref("prismaCategories", defaultPreferences.prismaCategories, {
        parseJSON: true,
    }) as [PRISMACategory[], usePrefStateFunction]
    const [commentsTagPrefix, setCommentsTagPrefix] = usePref(
        "commentsTagPrefix",
        defaultPreferences.commentsTagPrefix,
    ) as [string, usePrefStateFunction]
    const [prismaTagPrefix, setPrismaTagPrefix] = usePref("prismaTagPrefix", defaultPreferences.prismaTagPrefix) as [
        string,
        usePrefStateFunction,
    ]
    const [editStatusShortcut, setEditStatusShortcut] = usePref(
        "editStatusShortcut",
        defaultPreferences.editStatusShortcut,
        { parseJSON: true },
    ) as [KeyCombination, usePrefStateFunction]
    const [generatePRISMAShortcut, setGeneratePRISMAShortcut] = usePref(
        "generatePRISMAShortcut",
        defaultPreferences.generatePRISMAShortcut,
        { parseJSON: true },
    ) as [KeyCombination, usePrefStateFunction]

    const [selectedStatusIndex, setSelectedStatusIndex] = useState<number | null>(null)
    const [selectedPrismaIndex, setSelectedPrismaIndex] = useState<number | null>(null)

    const statusData = [...statusList]
    const statusColumns = [
        { name: "label", label: "Label" },
        { name: "tag", label: "Tag" },
        { name: "color", label: "Color" },
        {
            name: "invertTextColor",
            label: "Invert Text Color",
            labelFn: (status: ArticleStatus) => (status.invertTextColor ? "✓" : ""),
        },
        {
            name: "keystroke",
            label: "Keystroke",
            labelFn: (status: ArticleStatus) =>
                status.keystroke != null ? getStringFromKeyCombination(status.keystroke) : "",
        },
    ]

    const prismaData = [...prismaCategories]
    const prismaColumns = [
        { name: "label", label: "Label" },
        { name: "name", label: "Name" },
        { name: "tag", label: "Tag" },
        {
            name: "allowCustomReason",
            label: "Allow Custom Reason",
            labelFn: (cat: PRISMACategory) => (cat.allowCustomReason ? "✓" : ""),
        },
    ]

    const [statusModalOpen, setStatusModalOpen] = useState(false)
    const [statusEditing, setStatusEditing] = useState(false)
    const [prismaModalOpen, setPrismaModalOpen] = useState(false)
    const [prismaEditing, setPrismaEditing] = useState(false)

    const formColorRef = useRef<HTMLInputElement>(null)

    interface StatusFormData {
        index: number
        label: string
        tag: string
        color: string
        invertTextColor: boolean
        keystroke: string
    }

    interface PrismaFormData {
        index: number
        label: string
        name: string
        tag: string
        allowCustomReason: boolean
    }

    const {
        register: registerStatus,
        control: statusControl,
        handleSubmit: handleStatusSubmit,
        setValue: setStatusValue,
    } = useForm<StatusFormData>()

    const {
        register: registerPrisma,
        handleSubmit: handlePrismaSubmit,
        setValue: setPrismaValue,
    } = useForm<PrismaFormData>()

    const { control: panelShortcutControl, setValue: setPanelShortcutValue } = useForm({
        values: {
            editStatusShortcut: JSON.stringify(editStatusShortcut),
            generatePRISMAShortcut: JSON.stringify(generatePRISMAShortcut),
        },
    })

    const keystrokeToKeyCombination = (keystroke: Keystroke): KeyCombination => {
        const code =
            keystroke.code.startsWith("Key") || keystroke.code.startsWith("Digit")
                ? keystroke.code
                : keystroke.code
                  ? `Key${keystroke.code}`
                  : ""
        return {
            altKey: keystroke.modifiers.alt,
            ctrlKey: keystroke.modifiers.ctrl,
            metaKey: keystroke.modifiers.meta,
            shiftKey: keystroke.modifiers.shift,
            code,
        }
    }

    const deleteSelectedStatus = () => {
        if (selectedStatusIndex === null) {
            return
        }
        const label = statusList[selectedStatusIndex]?.label ?? "this status"
        if (!window.confirm(`Delete status "${label}"?`)) {
            return
        }
        setStatusList(statusList.filter((_, index) => index !== selectedStatusIndex))
        setSelectedStatusIndex(null)
    }

    const deleteSelectedPrismaCategory = () => {
        if (selectedPrismaIndex === null) {
            return
        }
        const label = prismaCategories[selectedPrismaIndex]?.label ?? "this category"
        if (!window.confirm(`Delete PRISMA category "${label}"?`)) {
            return
        }
        setPrismaCategories(prismaCategories.filter((_, index) => index !== selectedPrismaIndex))
        setSelectedPrismaIndex(null)
    }

    const onStatusSubmit = ({
        index,
        ...formData
    }: {
        index: number
        label: string
        tag: string
        color: string
        invertTextColor: boolean
        keystroke: string
    }) => {
        const processedFormData = { ...formData, keystroke: JSONFromString(String(formData.keystroke)) }
        const newStatusList = [...statusList]
        if (index === -1) {
            newStatusList.push(processedFormData)
        } else {
            newStatusList[index] = processedFormData
        }
        setStatusList(newStatusList)
        setStatusModalOpen(false)
        setStatusEditing(false)
    }

    const onPrismaSubmit = ({ index, ...formData }: PrismaFormData) => {
        const newCategories = [...prismaCategories]
        if (index === -1) {
            newCategories.push(formData)
        } else {
            newCategories[index] = formData
        }
        setPrismaCategories(newCategories)
        setPrismaModalOpen(false)
        setPrismaEditing(false)
    }

    const statusDoubleClickHandler = (item: ArticleStatus, index: number) => {
        if (item) {
            setStatusValue("index", index)
            setStatusValue("label", item.label)
            setStatusValue("invertTextColor", item.invertTextColor)
            const payload = {
                altKey: item.keystroke?.altKey,
                ctrlKey: item.keystroke?.ctrlKey,
                metaKey: item.keystroke?.metaKey,
                shiftKey: item.keystroke?.shiftKey,
                code: item.keystroke?.code,
            }
            setStatusValue("keystroke", JSON.stringify(payload))
            setStatusValue("color", item.color)
            setStatusValue("tag", item.tag)
        }
        setStatusModalOpen(true)
        setStatusEditing(true)
    }

    const prismaDoubleClickHandler = (item: PRISMACategory, index: number) => {
        if (item) {
            setPrismaValue("index", index)
            setPrismaValue("label", item.label)
            setPrismaValue("name", item.name)
            setPrismaValue("tag", item.tag)
            setPrismaValue("allowCustomReason", item.allowCustomReason ?? false)
        }
        setPrismaModalOpen(true)
        setPrismaEditing(true)
    }

    return (
        <div className="preferences">
            <div className="flex flex-col gap-8">
                <section className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold">Article statuses</h2>
                    <Table
                        columns={statusColumns}
                        data={statusData}
                        onDoubleClick={statusDoubleClickHandler}
                        onSelect={(_item, index) => setSelectedStatusIndex(index)}
                    />
                    <div className="flex flex-row gap-4">
                        <button
                            type="button"
                            className="btn btn-clear"
                            disabled={selectedStatusIndex === null}
                            onClick={deleteSelectedStatus}
                        >
                            Delete Selected Status
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setStatusValue("index", -1)
                                setStatusValue("label", "")
                                setStatusValue("invertTextColor", false)
                                setStatusValue("keystroke", "")
                                setStatusValue("color", "#d9d9d9")
                                setStatusValue("tag", "")
                                setStatusModalOpen(true)
                            }}
                        >
                            Create New Status
                        </button>
                        <button type="button" className="btn btn-clear" onClick={() => setStatusList(defaultPreferences.statusList)}>
                            Reset Statuses
                        </button>
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold">PRISMA categories</h2>
                    <Table
                        columns={prismaColumns}
                        data={prismaData}
                        onDoubleClick={prismaDoubleClickHandler}
                        onSelect={(_item, index) => setSelectedPrismaIndex(index)}
                    />
                    <div className="flex flex-row gap-4">
                        <button
                            type="button"
                            className="btn btn-clear"
                            disabled={selectedPrismaIndex === null}
                            onClick={deleteSelectedPrismaCategory}
                        >
                            Delete Selected Category
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setPrismaValue("index", -1)
                                setPrismaValue("label", "")
                                setPrismaValue("name", "")
                                setPrismaValue("tag", "")
                                setPrismaValue("allowCustomReason", false)
                                setPrismaModalOpen(true)
                            }}
                        >
                            Create New Category
                        </button>
                        <button
                            type="button"
                            className="btn btn-clear"
                            onClick={() => setPrismaCategories(defaultPreferences.prismaCategories)}
                        >
                            Reset PRISMA Categories
                        </button>
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold">Tag prefixes</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Changing a prefix does not update tags already on items. New comments and PRISMA tags will use the
                        updated prefix; retag existing items manually if needed.
                    </p>
                    <div className="flex flex-row gap-4">
                        <div className="flex flex-col gap-2 flex-1">
                            <label htmlFor="pref-comments-tag-prefix">Comments tag prefix</label>
                            <input
                                id="pref-comments-tag-prefix"
                                className="input"
                                value={commentsTagPrefix}
                                onChange={(event) => setCommentsTagPrefix(event.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                            <label htmlFor="pref-prisma-tag-prefix">PRISMA tag prefix</label>
                            <input
                                id="pref-prisma-tag-prefix"
                                className="input"
                                value={prismaTagPrefix}
                                onChange={(event) => setPrismaTagPrefix(event.target.value)}
                            />
                        </div>
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold">Panel shortcuts</h2>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="pref-edit-status-shortcut">Open Review Info Panel</label>
                        <Controller
                            name="editStatusShortcut"
                            control={panelShortcutControl}
                            render={({ field }) => (
                                <KeystrokeInput
                                    {...field}
                                    id="pref-edit-status-shortcut"
                                    className="input"
                                    setValue={(_name, keystroke: Keystroke) => {
                                        const combo = keystrokeToKeyCombination(keystroke)
                                        setEditStatusShortcut(combo)
                                        setPanelShortcutValue("editStatusShortcut", JSON.stringify(combo))
                                    }}
                                />
                            )}
                        />
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            Current: {getStringFromKeyCombination(editStatusShortcut)}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="pref-generate-prisma-shortcut">Open Generate PRISMA Diagram Panel</label>
                        <Controller
                            name="generatePRISMAShortcut"
                            control={panelShortcutControl}
                            render={({ field }) => (
                                <KeystrokeInput
                                    {...field}
                                    id="pref-generate-prisma-shortcut"
                                    className="input"
                                    setValue={(_name, keystroke: Keystroke) => {
                                        const combo = keystrokeToKeyCombination(keystroke)
                                        setGeneratePRISMAShortcut(combo)
                                        setPanelShortcutValue("generatePRISMAShortcut", JSON.stringify(combo))
                                    }}
                                />
                            )}
                        />
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            Current: {getStringFromKeyCombination(generatePRISMAShortcut)}
                        </div>
                    </div>
                </section>

                <div>Restart Zotero to apply changes to context menus.</div>
            </div>

            <Modal
                openState={statusModalOpen}
                setOpenState={setStatusModalOpen}
                title={statusEditing ? "Editing Status" : "New Status"}
                onOpen={() => {
                    log("status modal open")
                }}
                onClose={() => {
                    setStatusEditing(false)
                }}
            >
                <form className="flex flex-col gap-4" onSubmit={handleStatusSubmit(onStatusSubmit)}>
                    <input {...registerStatus("index")} type="hidden" />

                    <div className="flex flex-row gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="form-label">Label</label>
                            <input {...registerStatus("label")} id="form-label" className="input" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="form-tag">Tag</label>
                            <input {...registerStatus("tag")} id="form-tag" className="input" />
                        </div>
                    </div>

                    <div className="flex flex-row items-center gap-4">
                        <div className="flex flex-row items-center gap-2">
                            <label htmlFor="form-color">Color</label>
                            <Controller
                                name="color"
                                control={statusControl}
                                render={({ field }) => (
                                    <>
                                        <input type="hidden" {...registerStatus("color")} />
                                        <input
                                            ref={formColorRef}
                                            id="form-color"
                                            type="color"
                                            className="input"
                                            onChange={field.onChange}
                                            value={field.value}
                                        />
                                    </>
                                )}
                            />
                        </div>
                        <div className="flex flex-row items-center gap-2">
                            <label htmlFor="form-invertTextColor">Invert Text Color</label>
                            <input type="checkbox" {...registerStatus("invertTextColor")} id="form-invertTextColor" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="form-keystroke">Keyboard Shortcut</label>
                        <Controller
                            name="keystroke"
                            control={statusControl}
                            render={({ field }) => <KeystrokeInput className="input" {...field} />}
                        />
                    </div>

                    <footer className="flex flex-row items-center justify-end gap-4 h-auto">
                        <button
                            type="button"
                            className="btn btn-clear"
                            onClick={() => {
                                setStatusModalOpen(false)
                                setStatusEditing(false)
                            }}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Submit
                        </button>
                    </footer>
                </form>
            </Modal>

            <Modal
                openState={prismaModalOpen}
                setOpenState={setPrismaModalOpen}
                title={prismaEditing ? "Editing PRISMA Category" : "New PRISMA Category"}
                onClose={() => setPrismaEditing(false)}
            >
                <form className="flex flex-col gap-4" onSubmit={handlePrismaSubmit(onPrismaSubmit)}>
                    <input {...registerPrisma("index")} type="hidden" />

                    <div className="flex flex-row gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="prisma-form-label">Label</label>
                            <input {...registerPrisma("label")} id="prisma-form-label" className="input" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="prisma-form-name">Name</label>
                            <input {...registerPrisma("name")} id="prisma-form-name" className="input" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="prisma-form-tag">Tag</label>
                        <input {...registerPrisma("tag")} id="prisma-form-tag" className="input" />
                    </div>

                    <div className="flex flex-row items-center gap-2">
                        <label htmlFor="prisma-form-allowCustomReason">Allow Custom Reason</label>
                        <input type="checkbox" {...registerPrisma("allowCustomReason")} id="prisma-form-allowCustomReason" />
                    </div>

                    <footer className="flex flex-row items-center justify-end gap-4 h-auto">
                        <button
                            type="button"
                            className="btn btn-clear"
                            onClick={() => {
                                setPrismaModalOpen(false)
                                setPrismaEditing(false)
                            }}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Submit
                        </button>
                    </footer>
                </form>
            </Modal>
        </div>
    )
}

export default PreferencePane
