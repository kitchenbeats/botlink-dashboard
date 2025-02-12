import { useTreeContext } from 'fumadocs-ui/provider'
import SidebarItem from './sidebar-item'
import Header from './header'

export default function Sidebar() {
  const tree = useTreeContext()

  return (
    <>
      <div className="min-w-[var(--fd-sidebar-width)] truncate" />
      <aside className="fixed top-0 w-full max-w-[var(--fd-sidebar-width)] truncate pt-8 md:pt-12 xl:pt-10">
        <Header />
        {tree.root.children.map((item, index) => (
          <SidebarItem key={`sidebar-root-${index}`} item={item} />
        ))}
      </aside>
    </>
  )
}
