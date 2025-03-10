import { useTreeContext } from 'fumadocs-ui/provider'
import SidebarItem from './sidebar-item'
import Header from './header'
import Search from './search'

export default function Sidebar() {
  const tree = useTreeContext()

  return (
    <>
      <aside className="fixed top-[var(--fd-nav-height)] h-full w-[var(--fd-sidebar-width)] max-w-[var(--fd-sidebar-width)] truncate border-r p-4">
        <Header />
        <Search />
        {tree.root.children.map((item, index) => (
          <SidebarItem key={`sidebar-root-${index}`} item={item} />
        ))}
      </aside>
    </>
  )
}
