import { getPluginInfo } from "./pluginInfo"

export type PluginWindowApi = {
    extraColumns: string[]
    editStatus?: () => void
    generatePRISMADiagram?: () => void
}

export function ensurePluginWindowApi(win: Window): PluginWindowApi {
    const { referenceName } = getPluginInfo()
    const record = win as Window & Record<string, PluginWindowApi | undefined>
    if (!record[referenceName]) {
        record[referenceName] = { extraColumns: [] }
    }
    const api = record[referenceName]!
    if (!api.extraColumns) {
        api.extraColumns = []
    }
    return api
}
