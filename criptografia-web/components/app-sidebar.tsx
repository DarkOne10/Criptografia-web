"use client"

import * as React from "react"
import { LockKeyhole, LockOpen, LogOut, UserRound } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const appItems = [
  {
    title: "Desencriptacion",
    href: "/",
    icon: LockOpen,
  },
  {
    title: "Encriptacion",
    href: "/encriptacion",
    icon: LockKeyhole,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = React.useState<{ username: string; role: string } | null>(null)

  React.useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session")
        const data = await response.json()

        if (response.ok && data.ok) {
          setUser({ username: data.user.username, role: data.user.role })
          return
        }

        setUser(null)
      } catch {
        setUser(null)
      }
    }

    void loadSession()
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    router.replace("/register")
    router.refresh()
  }

  return (
    <Sidebar collapsible="offcanvas" {...props} className="flex flex-col">
      <SidebarHeader>
        <div className="px-2 py-1">
          <p className="text-sm font-semibold">Proyecto</p>
          <p className="text-xs text-muted-foreground">Criptografia</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-1 flex-col">
        <SidebarGroup>
          <SidebarGroupLabel>Navegacion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {appItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    render={<a href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user ? (
        <div className="border-t p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
              <span className="truncate text-sm font-medium">{user.username}</span>
            </div>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="h-8 px-2.5"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <SidebarRail />
    </Sidebar>
  )
}
