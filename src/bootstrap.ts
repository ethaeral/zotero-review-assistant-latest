// Devtools
import { log } from "./utils/devtools";
import { setPluginInfo } from "./utils/pluginInfo";

// Log when Zotero initializes the plugin
// log("ZOTERO INIT")

// Plugin Options
// Use referenceName for the reference name to be used

type PluginWindow = Window & {
    [key: string]: {
        init?: (props: StartupProps & { referenceName: string }) => void;
        shutdown?: (props: unknown) => void;
        uninstall?: () => void;
        onMainWindowLoad?: (props: { window: Window }) => void;
        onMainWindowUnload?: (props: { window: Window }) => void;
    };
};

function getMainWindowFromProps(props?: { window?: Window }) {
    return props?.window ?? Zotero.getMainWindow();
}

function getPluginApi(win: Window) {
    return (win as PluginWindow)[referenceName];
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

    // Set the plugin info for internal use
    setPluginInfo({ id, version, rootURI, referenceName })

    // Wait for Zotero to be ready
    await Promise.all([
        Zotero.initializationPromise,
        Zotero.unlockPromise,
        Zotero.uiReadyPromise,
    ]);

    // String 'rootURI' introduced in Zotero 7
    if (!rootURI) {
        // @ts-ignore legacy support for Zotero 6
        rootURI = resourceURI.spec;
    }

    const win = Zotero.getMainWindow();

    // UI
    await Services.scriptloader.loadSubScript(rootURI + "/index.js", win);

    getPluginApi(win)?.init?.({ id, version, rootURI, referenceName });
}

function onMainWindowLoad(props: { window?: Window }) {
    log("onMainWindowLoad", props)
    const win = getMainWindowFromProps(props);
    const api = getPluginApi(win);
    if (api?.onMainWindowLoad) {
        api.onMainWindowLoad({ window: win });
    }
}

function onMainWindowUnload(props: { window?: Window }) {
    log("onMainWindowUnlad", props)
    const win = getMainWindowFromProps(props);
    const api = getPluginApi(win);
    if (api?.onMainWindowUnload) {
        api.onMainWindowUnload({ window: win });
    }
}

function shutdown(props: unknown) {
    log("Shutdown", props)
    const win = Zotero.getMainWindow();
    getPluginApi(win)?.shutdown?.(props);
}

function uninstall(props: unknown) {
    log("Uninstall", props)
    const win = Zotero.getMainWindow();
    getPluginApi(win)?.uninstall?.();
}
