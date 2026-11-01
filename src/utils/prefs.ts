import { usePrefValue } from "../types/types"
import { getPluginInfo } from "./pluginInfo"

const PREF_GLOBAL = true

export function prefKey(shortName: string): string {
    return `extensions.${getPluginInfo().referenceName}.${shortName}`
}

function legacyZoteroBranchKey(shortName: string): string {
    return `extensions.zotero.${getPluginInfo().referenceName}.${shortName}`
}

function legacyBareKey(shortName: string): string {
    return `${getPluginInfo().referenceName}.${shortName}`
}

function readPref(key: string): usePrefValue | undefined {
    return Zotero.Prefs.get(key, PREF_GLOBAL) as usePrefValue | undefined
}

function writePref(key: string, value: usePrefValue) {
    Zotero.Prefs.set(key, value, PREF_GLOBAL)
}

function migratePrefIfNeeded(shortName: string): usePrefValue | undefined {
    const key = prefKey(shortName)
    let value = readPref(key)
    if (value !== undefined) {
        return value
    }

    const legacyKeys = [legacyZoteroBranchKey(shortName), legacyBareKey(shortName)]
    for (const legacyKey of legacyKeys) {
        const legacyValue = readPref(legacyKey)
        if (legacyValue !== undefined) {
            writePref(key, legacyValue)
            return legacyValue
        }
    }

    return undefined
}

export function setZoteroPref(name: string, value: usePrefValue) {
    writePref(prefKey(name), value)
}

export function getZoteroPref(name: string): usePrefValue | undefined {
    return migratePrefIfNeeded(name)
}

export function observeZoteroPref(
    shortName: string,
    handler: (value: usePrefValue | undefined) => void,
): ReturnType<typeof Zotero.Prefs.registerObserver> {
    return Zotero.Prefs.registerObserver(prefKey(shortName), handler, PREF_GLOBAL)
}

export function unobserveZoteroPref(observerId: ReturnType<typeof Zotero.Prefs.registerObserver>) {
    Zotero.Prefs.unregisterObserver(observerId)
}
