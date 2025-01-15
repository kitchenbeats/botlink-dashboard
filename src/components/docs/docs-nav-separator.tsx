import { SidebarComponents } from "fumadocs-ui/layouts/docs/shared";

const DocsNavSeparator: SidebarComponents["Separator"] = ({ item }) => (
  <p className="mb-2 mt-8 font-mono text-[0.65rem] uppercase first:mt-0">
    {item.name}
  </p>
);

export default DocsNavSeparator;
