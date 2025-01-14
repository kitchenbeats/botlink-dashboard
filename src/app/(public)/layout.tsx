import { Nav } from "@/components/docs/docs-nav";

import "@/styles/docs.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto">
      <Nav />
      {children}
    </div>
  );
}
