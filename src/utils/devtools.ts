// Log to file
export async function log(...message: any[]) {
    // Log on the console
    const console = Zotero.getMainWindow()?.console
    const formattedMessage = message.map(m => {
        try {
            return typeof m === "object" ? JSON.stringify(m) : String(m);
        } catch {
            return String(m);
        }
    }).join(" ");
    if (console) console.log(...message)
    else Zotero.debug(formattedMessage)

    // Write it to file
    if (!pluginLogPath || pluginLogPath === "undefined") return
    try {
        const outputFile = Zotero.File.pathToFile(pluginLogPath || "");
        const now = new Date();
        const timestamp = `${(now.getMonth() + 1).toString().padStart(2, '0')}/` +
            `${now.getDate().toString().padStart(2, '0')}/` +
            `${now.getFullYear()} ` +
            `${now.getHours().toString().padStart(2, '0')}:` +
            `${now.getMinutes().toString().padStart(2, '0')}:` +
            `${now.getSeconds().toString().padStart(2, '0')}`;
        let existing = "";
        try {
            existing = (await Zotero.File.getContentsAsync(outputFile)) as string;
        } catch {
            existing = "";
        }
        const newContent = `${existing}${timestamp} - ${formattedMessage}\n`;
        await Zotero.File.putContentsAsync(outputFile, newContent);
    } catch (error) {
        // An optional development log must never prevent the plugin from loading.
        Zotero.logError(error instanceof Error ? error : new Error(String(error)));
    }
}

export function wait(milliseconds: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}













// export function log(...args: any[]) {
//     window.console.log(processArgs(args).join(", "))
// }
// export function warn(...args: any[]) {
//     window.console.warn(processArgs(args).join(", "))
// }
// export function error(...args: any[]) {
//     window.console.error(processArgs(args).join(", "))
// }

// function processArgs(args: any[]) {
//     return args.map(arg => {
//         if (typeof arg === "object") {
//             return JSON.stringify(arg)
//         } else {
//             return arg
//         }
//     })
// }
