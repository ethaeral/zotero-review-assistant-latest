import type { Meta, StoryObj } from "@storybook/react"

import Table from "./table"

const meta = {
    title: "Components/Table",
    component: Table,
    tags: ["autodocs"],
} satisfies Meta<typeof Table>

export default meta

type Story = StoryObj<typeof meta>

const sampleColumns = [
    { name: "label", label: "Status" },
    { name: "tag", label: "Tag" },
    { name: "color", label: "Color" },
] as const

const sampleData = [
    { label: "Included", tag: "#Status: Included", color: "#60a5fa" },
    { label: "Excluded", tag: "#Status: Excluded", color: "#f87171" },
    { label: "Pending", tag: "#Status: Pending", color: "#d4d4d4" },
]

export const Default: Story = {
    args: {
        columns: [...sampleColumns],
        data: sampleData,
    },
}
