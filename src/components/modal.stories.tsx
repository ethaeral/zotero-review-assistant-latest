import type { Meta, StoryObj } from "@storybook/react"
import { type ComponentProps, useState } from "react"

import Modal from "./modal"

const meta = {
    title: "Components/Modal",
    component: Modal,
    tags: ["autodocs"],
} satisfies Meta<typeof Modal>

export default meta

type Story = StoryObj<typeof meta>

function ModalStory(props: Omit<ComponentProps<typeof Modal>, "openState" | "setOpenState">) {
    const [openState, setOpenState] = useState(true)

    return (
        <div className="relative h-64 w-full min-w-[32rem]">
            <button type="button" className="btn btn-primary" onClick={() => setOpenState(true)}>
                Open modal
            </button>
            <Modal {...props} openState={openState} setOpenState={setOpenState}>
                {props.children}
            </Modal>
        </div>
    )
}

export const OpenWithTitle: Story = {
    render: () => (
        <ModalStory title="Generate PRISMA Diagram">
            <p>Modal body content for review workflows.</p>
            <div className="flex flex-row gap-4 mt-4">
                <button type="button" className="btn btn-primary">
                    Confirm
                </button>
                <button type="button" className="btn btn-clear">
                    Cancel
                </button>
            </div>
        </ModalStory>
    ),
}
