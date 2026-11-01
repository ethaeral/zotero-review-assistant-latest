// External Dependencies
import { useEffect, useState } from "react"

// Internal Dependencies
import { JSONFromString } from "../utils"

// Types
import { usePrefOptions, usePrefState, usePrefStateValue } from "../../types/types"
import { getZoteroPref, observeZoteroPref, setZoteroPref, unobserveZoteroPref } from "../prefs"

function resolveInitialPrefValue(
    prefName: string,
    defaultValue: unknown,
    options: usePrefOptions,
): usePrefStateValue {
    let initialPrefValue = getZoteroPref(prefName)

    if (initialPrefValue === undefined) {
        initialPrefValue = defaultValue
        setZoteroPref(prefName, options.parseJSON ? JSON.stringify(defaultValue) : defaultValue)
    } else if (options.parseJSON === true) {
        initialPrefValue = JSONFromString(initialPrefValue as string, undefined)
    }

    return initialPrefValue as usePrefStateValue
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
            let newValue = value
            if (options.parseJSON === true) {
                newValue = JSONFromString(newValue as string, undefined)
            }
            setPrefState(newValue as usePrefStateValue)
        })

        return () => {
            unobserveZoteroPref(observerId)
        }
    }, [prefName, options.parseJSON, options.observe])

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
