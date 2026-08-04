import Navbar from './Navbar'

/**
 * Public page chrome. Shared by the client app (App.tsx) and the
 * build-time prerenderer (entry-server.tsx) so the static HTML Google
 * receives matches what the browser renders.
 */
export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      {children}
    </div>
  )
}
