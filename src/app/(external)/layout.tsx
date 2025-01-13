import { Nav } from "@/components/docs/docs-nav";

import "@/styles/docs.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
