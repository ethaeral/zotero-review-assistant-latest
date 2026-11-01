import type { StorybookConfig } from "@storybook/react-vite"
import { mergeConfig } from "vite"
import tailwindcss from "@tailwindcss/postcss"

const config: StorybookConfig = {
    stories: ["../src/**/*.stories.@(ts|tsx)"],
    addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
    framework: {
        name: "@storybook/react-vite",
        options: {},
    },
    async viteFinal(config) {
        return mergeConfig(config, {
            css: {
                postcss: {
                    plugins: [tailwindcss()],
                },
            },
        })
    },
}

export default config
