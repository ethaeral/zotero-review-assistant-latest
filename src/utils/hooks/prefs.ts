// External Dependencies
import { useEffect, useState } from "react"

// Internal Dependencies
import { JSONFromString } from "../utils"

// Types
import { usePrefOptions, usePrefState, usePrefStateValue, usePrefValue } from "../../types/types"
import { getZoteroPref, observeZoteroPref, setZoteroPref, unobserveZoteroPref } from "../prefs"

function decodePrefValue(value: usePrefValue | undefined, defaultValue: unknown, options: usePrefOptions): usePrefStateValue {
    if (value === undefined) return defaultValue as usePrefStateValue
    if (!options.parseJSON) return value
    const parsed = JSONFromString(value as string, defaultValue)
    return Array.isArray(defaultValue) && !Array.isArray(parsed) ? defaultValue : parsed
}

function resolveInitialPrefValue(
    prefName: string,
    defaultValue: unknown,
    options: usePrefOptions,
): usePrefStateValue {
    const initialPrefValue = getZoteroPref(prefName)

    if (initialPrefValue === undefined) {
        setZoteroPref(prefName, options.parseJSON ? JSON.stringify(defaultValue) : defaultValue as usePrefValue)
    }

    return decodePrefValue(initialPrefValue, defaultValue, options)
}

// Hook
export function usePref(
    prefName: string,
    defaultValue: any = "",
    options: usePrefOptions = { parseJSON: false, observe: false },
): usePrefState {
    const [prefState, setPrefState] = useState<usePrefStateValue>(() =>
        resolveInitialPrefValue(prefName, defaultValue, options),
    )

    const setPref = (value: any) => {
        setZoteroPref(prefName, options.parseJSON == true ? JSON.stringify(value) : value)
        setPrefState(value)
    }

    useEffect(() => {
        if (options.observe !== true) {
            return
        }

        const observerId = observeZoteroPref(prefName, (value) => {
            setPrefState(decodePrefValue(value, defaultValue, options))
        })

        return () => {
            unobserveZoteroPref(observerId)
        }
    }, [prefName, defaultValue, options.parseJSON, options.observe])

    return [prefState, setPref]
}

// Without Hook
export function usePrefWithoutHook(
    prefName: string,
    defaultValue: any = "",
    options: usePrefOptions = { parseJSON: false, observe: false },
): usePrefState {
    const initialPrefValue = resolveInitialPrefValue(prefName, defaultValue, options)
    return [initialPrefValue, () => {}]
}
