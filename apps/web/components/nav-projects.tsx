"use client"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: React.ReactNode
    isActive?: boolean
  }[]
}) {
  const router = useRouter()
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-sm">Resource</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              isActive={item.isActive}
              onClick={() => {
                router.push(item.url)
              }}
              className={cn(
                item.isActive && "bg-secondary border-t",
                "hover:ring-1 ring-secondary hover:shadow-sm transition-all duration-100"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-start gap-2",
                )}
              >
                {item.icon}
                <span className="text-md">{item.name}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
