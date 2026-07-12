import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  // Sidebar open/closed — persisted so user preference is remembered
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Mobile menu
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export const useLayout = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    }),
    {
      name: 'worksphere-layout',
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
    }
  )
)