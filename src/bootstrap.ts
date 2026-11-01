// Devtools
import { log } from "./utils/devtools";
import { setPluginInfo } from "./utils/pluginInfo";

// Log when Zotero initializes the plugin
// log("ZOTERO INIT")

// Plugin Options
// Use referenceName for the reference name to be used

type PluginWindow = Window & {
    [key: string]: {
        init?: (props: StartupProps & { referenceName: string; window: Window }) => void | Promise<void>;
        shutdown?: (props: unknown) => void | Promise<void>;
        uninstall?: () => void;
        onMainWindowLoad?: (props: { window: Window }) => void;
        onMainWindowUnload?: (props: { window: Window }) => void | Promise<void>;
    };
};

function getMainWindowFromProps(props?: { window?: Window }) {
    return props?.window ?? Zotero.getMainWindow();
}

function getPluginApi(win: Window | null) {
    return (win as PluginWindow | null)?.[referenceName];
}

let startupInfo: (StartupProps & { referenceName: string }) | undefined;
let startupReady: Promise<unknown> | undefined;
const windowInitializations = new WeakMap<Window, Promise<void>>();

function initializeWindow(win: Window): Promise<void> {
    if (!startupInfo) return Promise.resolve();
    const existing = windowInitializations.get(win);
    if (existing) return existing;

    const initialization = (async () => {
        if (!startupInfo) return;
        if (!getPluginApi(win)?.init) {
            Services.scriptloader.loadSubScript(startupInfo.rootURI + "index.js", win);
        }
        await getPluginApi(win)?.init?.({ ...startupInfo, window: win });
    })().catch(error => {
        windowInitializations.delete(win);
        throw error;
    });
    windowInitializations.set(win, initialization);
    return initialization;
}

// Install
function install(props: unknown) {
    log("Install", props)
    // registerPrefs()
    // startup()
}

// Startup
type StartupProps = {
    id: string,
    version: string,
    rootURI: string,
}
async function startup({ id, version, rootURI }: StartupProps) {
    log("Startup", { id, version, rootURI, referenceName })

    // Wait for Zotero to be ready
    startupReady = Promise.all([
        Zotero.initializationPromise,
        Zotero.unlockPromise,
        Zotero.uiReadyPromise,
    ]);
    await startupReady;

    // String 'rootURI' introduced in Zotero 7
    if (!rootURI) {
        // @ts-ignore legacy support for Zotero 6
        rootURI = resourceURI.spec;
    }

    rootURI = rootURI.replace(/\/?$/, "/");
    startupInfo = { id, version, rootURI, referenceName };
    setPluginInfo(startupInfo);

    for (const win of Zotero.getMainWindows()) {
        await initializeWindow(win);
    }
}

async function onMainWindowLoad(props: { window?: Window }) {
    log("onMainWindowLoad", props)
    await startupReady;
    const win = getMainWindowFromProps(props);
    if (win) await initializeWindow(win);
}

async function onMainWindowUnload(props: { window?: Window }) {
    log("onMainWindowUnload", props)
    const win = getMainWindowFromProps(props);
    const api = getPluginApi(win);
    if (api?.onMainWindowUnload) {
        await api.onMainWindowUnload({ window: win });
    }
    if (win) windowInitializations.delete(win);
}

async function shutdown(props: unknown) {
    log("Shutdown", props)
    for (const win of Zotero.getMainWindows()) {
        await getPluginApi(win)?.shutdown?.(props);
        windowInitializations.delete(win);
    }
}

function uninstall(props: unknown) {
    log("Uninstall", props)
    const win = Zotero.getMainWindow();
    getPluginApi(win)?.uninstall?.();
}
