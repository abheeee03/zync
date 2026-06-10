"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { CommandIcon, Home01Icon, LockPasswordIcon, Folder02Icon, HelpSquareIcon, GithubIcon, HelpCircleIcon } from "@hugeicons/core-free-icons"
import { usePathname } from "next/navigation"
import { authClient } from "@/lib/auth-client"

const data = {
  navMain: [
    {
      title: "Home",
      url: "/home",
      icon: (
        <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Credentials",
      url: "/credentials",
      icon: (
        <HugeiconsIcon icon={LockPasswordIcon} strokeWidth={2} size={36} />
      ),
    }
  ],
  navSecondary: [
    {
      title: "Help",
      url: "/help",
      icon: (
        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Star Us",
      url: "https://github.com/abheeee03/zync",
      icon: (
        <HugeiconsIcon icon={GithubIcon} strokeWidth={2} />
      ),
    },
  ],
  projects: [
    {
      name: "Templates",
      url: "/templates",
      icon: (
        <HugeiconsIcon icon={Folder02Icon} strokeWidth={2} />
      ),
    },
    {
      name: "How to Use",
      url: "/how-to-use",
      icon: (
        <HugeiconsIcon icon={HelpSquareIcon} strokeWidth={2} />
      ),
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: session } = authClient.useSession()

  const navMain = data.navMain.map((item) => ({
    ...item,
    isActive: pathname === item.url,
  }))
  const projects = data.projects.map((project) => ({
    ...project,
    isActive: pathname === project.url,
  }))

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
              <a href="#" className="flex gap-2 items-center justify-center">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <HugeiconsIcon icon={CommandIcon} strokeWidth={2} className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="text-lg font-medium">Zync</span>
                </div>
              </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="mt-2">
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session?.user ?? null} />
      </SidebarFooter>
    </Sidebar>
  )
}
