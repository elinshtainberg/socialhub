import { Sidebar } from "@/components/layout/Sidebar";
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-4 py-6 md:px-12 md:py-10 max-w-[1060px] mx-auto w-full pb-24 md:pb-10">{children}</main>
    </div>
  );
}
