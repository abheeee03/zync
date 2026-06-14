import { AppSidebar } from "@/components/app-sidebar"
import ThemeSwitcher from "@/components/theme-switcher"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ReactNode } from "react"
import { HeaderTitle } from "@/components/header-title"

export default function HomeLayout({children}: {children: ReactNode}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <header className="flex h-16 w-full shrink-0 items-center justify-between gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <span className="text-muted-foreground"><HeaderTitle /></span>
          </div>
          <div className="px-4">
          <ThemeSwitcher/>
          </div>
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
