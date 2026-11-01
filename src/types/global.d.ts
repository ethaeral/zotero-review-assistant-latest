declare const referenceName: string;
declare const pluginLogPath: string;

interface CommandEvent extends Event {
    command: string;
    source: Element;
}
