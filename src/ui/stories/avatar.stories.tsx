import type { Meta, StoryObj } from '@storybook/react'
import { Avatar, AvatarFallback, AvatarImage } from '../primitives/avatar'

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
}

export const WithFallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
}

export const CustomSize: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar className="h-6 w-6">
        <AvatarFallback>XS</AvatarFallback>
      </Avatar>
      <Avatar className="h-8 w-8">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar className="h-12 w-12">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
      <Avatar className="h-14 w-14">
        <AvatarFallback>XL</AvatarFallback>
      </Avatar>
    </div>
  ),
}

export const WithCustomStyles: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar className="bg-blue-500">
        <AvatarFallback className="text-white">BL</AvatarFallback>
      </Avatar>
      <Avatar className="bg-green-500">
        <AvatarFallback className="text-white">GR</AvatarFallback>
      </Avatar>
      <Avatar className="bg-purple-500">
        <AvatarFallback className="text-white">PR</AvatarFallback>
      </Avatar>
    </div>
  ),
}
