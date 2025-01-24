import { Nav } from "@/features/docs/navbar/navbar";

import "@/styles/docs.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <div className="container mx-auto w-full max-w-[1200px]">{children}</div>
    </>
  );
}
