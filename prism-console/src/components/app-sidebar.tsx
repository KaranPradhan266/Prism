"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import logo from "@/assets/logo.png"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Mointoring & Analytics",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Traffic Analysis",
          url: "#",
        },
        {
          title: "Connection States",
          url: "#",
        },
        {
          title: "Threat Detection",
          url: "#",
        },
        {
          title: "Performance Metrics",
          url: "#",
        },
      ],
    },
    {
      title: "Configuration",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Proxy Settings",
          url: "#",
        },
        {
          title: "Network Policies",
          url: "#",
        },
        {
          title: "DPI Signature",
          url: "#",
        },
        {
          title: "Alerting",
          url: "#",
        },
      ],
    },
    {
      title: "Deployment",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Container Status",
          url: "#",
        },
        {
          title: "Backend Services",
          url: "#",
        },
        {
          title: "Health Checks",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Reports & Logs",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Security Reports",
          url: "#",
        },
        {
          title: "Access Logs",
          url: "#",
        },
        {
          title: "Audit Trail",
          url: "#",
        },
        {
          title: "Export Data",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img src={logo} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Prism</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
