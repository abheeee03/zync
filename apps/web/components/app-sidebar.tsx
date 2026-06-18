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
import { CommandIcon, Home01Icon, LockPasswordIcon, Folder02Icon, HelpSquareIcon, GithubIcon, HelpCircleIcon, PlusMinus01FreeIcons, PlusSignIcon } from "@hugeicons/core-free-icons"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import Logo from "./logo"
import { Button } from "./ui/button"
import { motion, AnimatePresence } from "framer-motion"

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
      url: "https://zync.abhee.dev/usage",
      icon: (
        <HugeiconsIcon icon={HelpSquareIcon} strokeWidth={2} />
      ),
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const navMain = data.navMain.map((item) => ({
    ...item,
    isActive: pathname === item.url,
  }))
  const projects = data.projects.map((project) => ({
    ...project,
    isActive: pathname === project.url,
  }))

  const isWorkflowPage = pathname.startsWith("/workflow/") && pathname !== "/workflow"

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <a href="#" className="flex gap-2 items-center justify-center">
              <Logo />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="text-xl font-medium">zync</span>
              </div>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="mt-2">
        <AnimatePresence initial={false}>
          {!isWorkflowPage && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.95, y: -10 }}
              animate={{ height: "auto", opacity: 1, scale: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, scale: 0.95, y: -10 }}
              transition={{
                duration: 0.2,
                ease: [0.23, 1, 0.32, 1],
              }}
              style={{ overflow: "hidden" }}
              className="px-2 pb-2"
            >
              <button
                onClick={() => router.push("/workflow")}
                className="w-full cursor-pointer rounded-sm bg-linear-to-b from-blue-500 to-blue-700 px-4 py-2 text-white ring-1 ring-white/20 ring-offset-1 ring-offset-blue-500 transition-transform duration-150 ring-inset active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              >
                New Workflow <HugeiconsIcon icon={PlusSignIcon} size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
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
