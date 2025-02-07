import { notFound } from 'next/navigation'

export const dynamic = 'force-static'

/*
  This page is used to serve the storybook build.
  It is served from the public/storybook directory.

  Storybook is built by the `prebuild` script in package.json.
  Env. variable NEXT_PUBLIC_EXPOSE_STORYBOOK must be set to 1 to build & expose the storybook.
*/
export default function StorybookPage() {
  const shouldExposeStorybook =
    process.env.NEXT_PUBLIC_EXPOSE_STORYBOOK &&
    process.env.NEXT_PUBLIC_EXPOSE_STORYBOOK === '1'

  if (!shouldExposeStorybook) {
    throw notFound()
  }

  return (
    <iframe
      src="/storybook/index.html"
      className="h-screen w-full border-0"
      title="Storybook"
    />
  )
}
