"use client"

import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar'
import { ProfileSidebar } from '@/components/profile-sidebar'
import { PanelLeft } from 'lucide-react'

function SidebarToggleButton() {
  const { toggleSidebar, state } = useSidebar()
  
  // Calculate position based on sidebar state - always at top-left, moving with sidebar
  const isCollapsed = state === 'collapsed'
  const leftPosition = isCollapsed ? '0.75rem' : 'calc(16rem + 0.5rem)' // Move with sidebar
  
  return (
    <button
      onClick={toggleSidebar}
      className="fixed top-4  z-50 w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#3a3a3a] text-white transition-all duration-200"
      title="Toggle Sidebar"
      style={{ left: leftPosition }}
    >
      <PanelLeft className="w-4 h-4" />
    </button>
  )
}

function ContentArea({ children }: { children: React.ReactNode }) {
  return (
    <SidebarInset className="bg-[#0a0a0a]">
      <div className="flex flex-1 flex-col items-center overflow-auto">
        <div className="w-full max-w-[1600px] flex-1 flex flex-col gap-6 py-6 px-6">
          {children}
        </div>
      </div>
    </SidebarInset>
  )
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SidebarProvider>
        <ProfileSidebar />
        <SidebarToggleButton />
        <ContentArea>
          {children}
        </ContentArea>
      </SidebarProvider>
    </div>
  )
}

