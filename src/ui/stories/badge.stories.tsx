import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../primitives/badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Badge',
  },
}

export const Muted: Story = {
  args: {
    children: 'Muted',
    variant: 'muted',
  },
}

export const Destructive: Story = {
  args: {
    children: 'Error',
    variant: 'error',
  },
}

export const Outline: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Badge>Default</Badge>
      <Badge variant="muted">Muted</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="success">Success</Badge>
    </div>
  ),
}

export const WithCustomClass: Story = {
  args: {
    children: 'Custom',
    className: 'bg-purple-500 text-white',
  },
}
