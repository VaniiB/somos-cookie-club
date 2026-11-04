import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function CookieEater() {
  return (
    <svg className="cc-eater" viewBox="0 0 260 230" aria-hidden="true">
      <g className="cc-eater-crumb">
        <circle cx="188" cy="54" r="4" fill="#c9894a" />
      </g>
      <g className="cc-eater-crumb cc-eater-crumb-b">
        <circle cx="204" cy="70" r="3" fill="#5c3a2a" />
      </g>
      <g className="cc-eater-cookie">
        <circle cx="214" cy="72" r="26" fill="#d7a05a" />
        <circle cx="214" cy="72" r="22" fill="#c9894a" />
        <circle cx="206" cy="64" r="4.2" fill="#4a2a18" />
        <circle cx="222" cy="68" r="3.4" fill="#3a2012" />
        <circle cx="212" cy="80" r="3.8" fill="#5c3a2a" />
        <circle cx="224" cy="82" r="2.8" fill="#4a2a18" />
      </g>
      <g className="cc-eater-body">
        <ellipse cx="54" cy="92" rx="22" ry="20" fill="#2e78c4" />
        <ellipse cx="186" cy="92" rx="22" ry="20" fill="#2e78c4" />
        <ellipse cx="120" cy="132" rx="84" ry="78" fill="#3b8fd6" />
        <ellipse cx="86" cy="150" rx="28" ry="18" fill="#2f7fc8" opacity="0.45" />
        <ellipse cx="168" cy="86" rx="18" ry="12" fill="#5aa3e0" opacity="0.4" />
        <g className="cc-eater-eye">
          <ellipse cx="90" cy="108" rx="24" ry="28" fill="#fff" />
          <circle className="cc-eater-pupil" cx="96" cy="114" r="11" fill="#17120f" />
          <circle cx="101" cy="108" r="4" fill="#fff" />
        </g>
        <g className="cc-eater-eye">
          <ellipse cx="148" cy="108" rx="24" ry="28" fill="#fff" />
          <circle className="cc-eater-pupil" cx="154" cy="114" r="11" fill="#17120f" />
          <circle cx="159" cy="108" r="4" fill="#fff" />
        </g>
        <path d="M78 86c18-16 48-18 72-2" fill="none" stroke="#245f9a" strokeWidth="7" strokeLinecap="round" />
        <g className="cc-eater-jaw">
          <ellipse cx="120" cy="160" rx="42" ry="30" fill="#17120f" />
          <ellipse cx="120" cy="172" rx="20" ry="12" fill="#d45a6a" />
          <path d="M92 146c8 10 16 12 28 12s20-2 28-12" fill="#f4efe6" />
        </g>
      </g>
    </svg>
  )
}

export function LostPage({
  homeTo,
  reason = 'lost',
}: {
  homeTo: string
  reason?: 'lost' | 'offline'
}) {
  const offline = reason === 'offline'
  return (
    <section className="cc-stack mx-auto grid min-h-[70dvh] max-w-md place-content-center px-5 py-12 text-center">
      <CookieEater />
      <h1 className="display text-4xl sm:text-5xl">{offline ? 'Se cortó internet' : 'Se la comió'}</h1>
      <p className="text-sm text-[#5c3a2a]/70">
        {offline
          ? 'Sin conexión no hay horno. En cuanto vuelva la red, seguimos con las galletas.'
          : 'Esta página no existe. El comegalletas llegó primero.'}
      </p>
      {!offline && (
        <Link
          to={homeTo}
          className="mx-auto w-fit rounded-full bg-[#5c3a2a] px-5 py-3 text-[11px] tracking-[0.14em] uppercase text-[#f6f0e6]"
        >
          Volver al inicio
        </Link>
      )}
    </section>
  )
}

function useOnline() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    let live = true
    let timer = 0

    async function probe() {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (live) setOnline(false)
        return
      }
      try {
        const ctrl = new AbortController()
        const kill = window.setTimeout(() => ctrl.abort(), 4000)
        const res = await fetch(`/ping.txt?cc-ping=${Date.now()}`, {
          cache: 'no-store',
          signal: ctrl.signal,
        })
        window.clearTimeout(kill)
        if (live) setOnline(res.ok)
      } catch {
        if (live) setOnline(false)
      }
    }

    function goOffline() {
      if (live) setOnline(false)
    }

    function goOnline() {
      void probe()
    }

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    window.addEventListener('focus', goOnline)
    document.addEventListener('visibilitychange', goOnline)
    void probe()
    timer = window.setInterval(() => {
      void probe()
    }, 2000)

    return () => {
      live = false
      window.clearInterval(timer)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
      window.removeEventListener('focus', goOnline)
      document.removeEventListener('visibilitychange', goOnline)
    }
  }, [])

  return online
}

export function OfflineGate({ homeTo, children }: { homeTo: string; children: ReactNode }) {
  const online = useOnline()

  return (
    <>
      {children}
      {!online && (
        <div className="fixed inset-0 z-[200] overflow-auto bg-[#f7f1e8]">
          <LostPage homeTo={homeTo} reason="offline" />
        </div>
      )}
    </>
  )
}
