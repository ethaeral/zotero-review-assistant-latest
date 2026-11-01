import { useEffect } from "react"
import { KeyboardShortcutOptions, KeyCombination } from "../../types/types"

function keystrokeKey(keystroke: KeyCombination) {
    return `${keystroke.code}-${keystroke.ctrlKey}-${keystroke.altKey}-${keystroke.shiftKey}-${keystroke.metaKey}`
}

const keyboardShortcutManager = new (class {
    private shortcuts: KeyboardShortcutOptions[] = []
    public initialized = false

    private handleKeyDown = (event: KeyboardEvent) => {
        for (const shortcut of this.shortcuts) {
            if (
                event.code === shortcut.keystroke.code &&
                event.ctrlKey === shortcut.keystroke.ctrlKey &&
                event.shiftKey === shortcut.keystroke.shiftKey &&
                event.altKey === shortcut.keystroke.altKey &&
                event.metaKey === shortcut.keystroke.metaKey
            ) {
                shortcut.callback()
                event.preventDefault()
                event.stopPropagation()
            }
        }
    }

    public init() {
        if (this.initialized) {
            return
        }
        document.documentElement.addEventListener("keydown", this.handleKeyDown)
        this.initialized = true
    }

    public addShortcut(options: KeyboardShortcutOptions) {
        this.shortcuts.push(options)
    }

    public removeShortcut(options: KeyboardShortcutOptions) {
        this.shortcuts = this.shortcuts.filter(
            (entry) =>
                entry.callback !== options.callback ||
                keystrokeKey(entry.keystroke) !== keystrokeKey(options.keystroke),
        )
    }

})()

export function useKeyboardShortcut(keystroke: KeyCombination, callback: () => void, deps: unknown[] = []) {
    useEffect(() => {
        keyboardShortcutManager.init()
        const entry = { keystroke, callback }
        keyboardShortcutManager.addShortcut(entry)
        return () => keyboardShortcutManager.removeShortcut(entry)
    }, deps)
}

export function useKeyboardShortcutManager(shortcuts: KeyboardShortcutOptions[], deps: unknown[] = []) {
    useEffect(() => {
        keyboardShortcutManager.init()
        const deduped = shortcuts.filter(
            (shortcut, index, list) =>
                list.findIndex((other) => keystrokeKey(other.keystroke) === keystrokeKey(shortcut.keystroke)) === index,
        )
        const entries = deduped.map((shortcut) => ({ ...shortcut }))
        entries.forEach((entry) => keyboardShortcutManager.addShortcut(entry))
        return () => entries.forEach((entry) => keyboardShortcutManager.removeShortcut(entry))
    }, deps)
}
