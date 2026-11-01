const zoteroStub = {
    isMac: false,
    isWin: false,
    isLinux: true,
}

Object.assign(globalThis, { Zotero: zoteroStub })
