// Minimal layout for the visual builder preview iframe — no sidebar, no topbar.
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
