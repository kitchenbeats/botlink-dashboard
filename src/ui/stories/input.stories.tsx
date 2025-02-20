import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '../primitives/input'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter command...',
  },
}

export const WithValue: Story = {
  args: {
    value: 'E2B_API_KEY',
    readOnly: true,
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <label
        htmlFor="email"
        className="font-mono text-sm uppercase tracking-wider"
      >
        [Email]
      </label>
      <Input type="email" id="email" placeholder="user@domain.com" />
    </div>
  ),
}

export const File: Story = {
  args: {
    type: 'file',
    className: 'cursor-pointer',
  },
}

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
    defaultValue: 'secretpassword',
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
}

export const WithPrefix: Story = {
  render: () => (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <span className="font-mono text-sm text-fg-300">$</span>
      <Input placeholder="npm install e2b" />
    </div>
  ),
}

export const WithSuffix: Story = {
  render: () => (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input placeholder="Search packages" />
      <span className="font-mono text-sm text-fg-300">[Enter]</span>
    </div>
  ),
}
