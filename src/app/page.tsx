import { App } from "@/components/app";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Toaster } from "@/components/ui/toast";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex-1">
        <div className="aurora" aria-hidden="true" />
        <App />
      </main>
      <SiteFooter />
      <Toaster />
    </>
  );
}
