import { App } from "@/components/app";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Toaster } from "@/components/ui/toast";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <App />
      </main>
      <SiteFooter />
      <Toaster />
    </>
  );
}
