"use client"

import { Link, useLocation } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  User,
  Star,
  Settings,
  Users,
  Crown,
  Folder,
  Flag,
  ImageIcon,
  LogOut,
  Camera,
  ShoppingBag,
  Layers,
  FileText,
  CalendarDays,
  Images,
  UserCircle,
  TrendingUp,
  CreditCard,
  PiggyBank,
  Handshake,
  Repeat,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getPublishedProducts, getUserMode, type PublishedProduct } from "@/lib/storage"
import { cn } from "@/lib/utils"

const adminGeneralItems = [
  {
    title: "Personal Info",
    url: "/profile",
    icon: User,
  },
  {
    title: "Hero Creativity",
    url: "/hero-creativity",
    icon: Star,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

const adminItems = [
  {
    title: "My Creators",
    url: "/creators",
    icon: Users,
  },
  {
    title: "Subscription Tiers",
    url: "/subscription-tiers",
    icon: Crown,
  },
  {
    title: "Product Selection",
    url: "/products",
    icon: ImageIcon,
  },
  {
    title: "Selected Products",
    url: "/selected-products",
    icon: ShoppingBag,
  },
  {
    title: "Masters Management",
    url: "/masters",
    icon: Folder,
  },
  {
    title: "Moderation Queue",
    url: "/moderation",
    icon: Flag,
  },
]

const creatorGeneralItems = [
  { title: "Overview", url: "/creator/overview", icon: ImageIcon },
  { title: "Personal Info", url: "/profile", icon: User },
  { title: "Hero Creativity", url: "/hero-creativity", icon: Star },
  { title: "Settings", url: "/settings", icon: Settings },
]

const creatorMenuItems = [
  { title: "My Collections", url: "/creator/collections", icon: Layers, badge: "50" },
  { title: "My Content", url: "/creator/content", icon: FileText, badge: "246" },
  { title: "My Blogs", url: "/creator/blogs", icon: FileText, badge: "18" },
  { title: "My Events", url: "/creator/events", icon: CalendarDays, badge: "35" },
  { title: "My Merchandise", url: "/products", icon: ShoppingBag },
  { title: "My Images", url: "/creator/images", icon: Images },
  { title: "My Subscribers", url: "/creator/subscribers", icon: UserCircle },
  { title: "Upgrade", url: "/creator/upgrade", icon: Crown },
  { title: "Stripe-Connect", url: "/creator/stripe", icon: TrendingUp, badge: "18" },
  { title: "Payout History", url: "/creator/payouts", icon: CreditCard },
  { title: "Payment", url: "/creator/payment", icon: PiggyBank },
  { title: "Partnerships", url: "/creator/partnerships", icon: Handshake },
  { title: "Distribution Payments", url: "/creator/distribution", icon: Repeat },
]

function MenuLink({
  item,
  pathname,
}: {
  item: {
    title: string
    url: string
    icon: React.ComponentType<{ className?: string }>
    badge?: string
  }
  pathname: string | null
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={pathname === item.url || (pathname?.startsWith(item.url) && item.url !== "/")}
        className={cn(
          "text-gray-300 hover:bg-[#1a1a1a] hover:text-white data-[active=true]:bg-[#99C542] data-[active=true]:text-black",
          item.title === "My Merchandise" &&
            "bg-[#99C542] text-black hover:bg-lime-300 data-[active=true]:bg-lime-500"
        )}
      >
        <Link to={item.url || "#"}>
          <item.icon className="w-4 h-4" />
          <span>{item.title}</span>
          {item.badge && (
            <span className="ml-auto inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-[#1f2937] px-2 py-0.5 text-[10px] font-semibold text-lime-300">
              {item.badge}
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function AdminSidebar({ pathname }: { pathname: string | null }) {
  return (
    <Sidebar
      variant="sidebar"
      className="border-r border-[#1a1a1a] bg-[#1a1a1a] [&_[data-sidebar=sidebar]]:bg-[#1a1a1a] [&_[data-slot=sidebar-gap]]:w-0"
    >
      <SidebarHeader className="p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="w-20 h-20 border-2 border-lime-400">
              <AvatarImage src="/api/placeholder/80/80" alt="Admin" />
              <AvatarFallback className="bg-[#1a1a1a] text-white">AL</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-6 h-6 bg-[#99C542] rounded-full flex items-center justify-center border-2 border-[#0a0a0a] hover:bg-lime-300 transition-colors">
              <Camera className="w-3 h-3 text-black" />
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">Admin Loco</h2>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 text-xs uppercase">General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminGeneralItems.map((item) => (
                <MenuLink key={item.title} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 text-xs uppercase">Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <MenuLink key={item.title} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-[#1a1a1a]">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-[#1a1a1a] hover:text-white bg-[#99C542] text-black"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

function CreatorSidebar({ pathname, publishedProducts }: { pathname: string | null; publishedProducts: PublishedProduct[] }) {
  const merchandise = useMemo(() => publishedProducts, [publishedProducts])

  return (
    <Sidebar
      variant="sidebar"
      className="border-r border-[#1a1a1a] bg-[#1a1a1a] text-gray-100 [&_[data-sidebar=sidebar]]:bg-[#1a1a1a] [&_[data-slot=sidebar-gap]]:w-0"
    >
      <SidebarHeader className="p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24 border-2 border-white">
              <AvatarImage src="/api/placeholder/96/96" alt="Anil Kumar" />
              <AvatarFallback className="bg-[#1f2937] text-white">AK</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#99C542] rounded-full flex items-center justify-center border-2 border-[#0a0a0a] hover:bg-lime-300 transition-colors">
              <Camera className="w-3.5 h-3.5 text-black" />
            </button>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-white">Anil Kumar</h2>
            <div className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#facc15]/20 to-[#f59e0b]/20 px-4 py-1 text-xs font-semibold text-[#f59e0b]">
              <Crown className="w-3.5 h-3.5" />
              Anil Final Plan do not change Member
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#94a3b8] text-xs uppercase">General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {creatorGeneralItems.map((item) => (
                <MenuLink key={item.title} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-[#94a3b8] text-xs uppercase">Creator</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {creatorMenuItems.map((item) => (
                <MenuLink
                  key={item.title}
                  item={{
                    ...item,
                    badge:
                      item.title === "My Merchandise" && merchandise.length > 0
                        ? String(merchandise.length)
                        : item.badge,
                  }}
                  pathname={pathname}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-[#1f2937]">
        <Button
          variant="ghost"
          className="w-full justify-center rounded-lg border border-[#1f2937] bg-[#111c33] text-sm font-semibold text-[#60a5fa] hover:border-[#60a5fa] hover:text-white"
        >
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

export function ProfileSidebar() {
  const location = useLocation()
  const pathname = location?.pathname ?? null
  const [userMode, setUserMode] = useState<"admin" | "creator">("admin")
  const [publishedProducts, setPublishedProducts] = useState<PublishedProduct[]>([])

  useEffect(() => {
    const mode = getUserMode()
    setUserMode(mode)
    setPublishedProducts(getPublishedProducts())

    const handleModeChange = () => {
      const updatedMode = getUserMode()
      setUserMode(updatedMode)
      if (updatedMode === "creator") {
        setPublishedProducts(getPublishedProducts())
      }
    }

    const handlePublishedChange = () => {
      setPublishedProducts(getPublishedProducts())
    }

    window.addEventListener("modeChanged", handleModeChange)
    window.addEventListener("productsPublished", handlePublishedChange)

    return () => {
      window.removeEventListener("modeChanged", handleModeChange)
      window.removeEventListener("productsPublished", handlePublishedChange)
    }
  }, [])

  if (userMode === "creator") {
    return <CreatorSidebar pathname={pathname} publishedProducts={publishedProducts} />
  }

  return <AdminSidebar pathname={pathname} />
}

