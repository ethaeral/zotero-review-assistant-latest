import type { Preview } from "@storybook/react"

import "../src/styles/styles.css"

Object.assign(globalThis, {
    Zotero: {
        isMac: false,
        isWin: false,
        isLinux: true,
    },
})

const preview: Preview = {
    parameters: {
        layout: "centered",
        a11y: {
            test: "error",
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
}

export default preview
