import { Outlet } from "react-router-dom"
import { LayoutWrapper } from "@/components/layout-wrapper"

export default function RootLayout() {
  return (
    <LayoutWrapper>
      <Outlet />
    </LayoutWrapper>
  )
}


