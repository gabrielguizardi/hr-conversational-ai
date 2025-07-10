import { Outlet } from "react-router"
import { Navbar } from "@/components/navbar"

const DefaultLayout = () => {
  return (
    <div>
      <Navbar />

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export { DefaultLayout }
