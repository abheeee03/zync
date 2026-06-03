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

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
    isActive?: boolean
  }[]
}) {
  const router = useRouter();
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sm">Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
              className={cn(
                item.isActive && "bg-blue-500 text-white"
              )}
              onClick={()=>{
                router.push(`${item.url}`)
              }}>
              <div className="flex items-center justify-start gap-2">
                  {item.icon}
                  <span>{item.title}</span>
              </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
