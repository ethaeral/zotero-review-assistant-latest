import type { Meta, StoryObj } from "@storybook/react"

import KeystrokeInput from "./keystrokeInput"

const meta = {
    title: "Components/KeystrokeInput",
    component: KeystrokeInput,
    tags: ["autodocs"],
} satisfies Meta<typeof KeystrokeInput>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
    render: () => (
        <label className="flex flex-col gap-2">
            <span>Keyboard shortcut</span>
            <KeystrokeInput name="keystroke" aria-label="Keyboard shortcut" />
        </label>
    ),
}
