import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import FooterSection from './FooterSection'
import { useScrollReveal } from '../../../shared/hooks/useScrollReveal'

function LandingChrome({ loading, children }) {
  useScrollReveal()

  return (
    <div className="bg-[rgba(5,5,5,0.9)]">
      <main>
        {children ?? (
          <Suspense fallback={<div className="min-h-[60vh] bg-deep-black" />}>
            <Outlet />
          </Suspense>
        )}
      </main>
      <FooterSection />

      {loading ? <div className="fixed bottom-3 left-1/2 z-[1500] -translate-x-1/2 rounded-full border border-[#3a3a3a] bg-[rgba(20,20,20,0.92)] px-3 py-2 text-xs text-[#d0d0d0]">Syncing from API...</div> : null}
    </div>
  )
}

export default LandingChrome
