// Route group layout for (auth) - no UI shell needed.
// Each auth page handles its own redirect logic client-side.
// Middleware also handles server-side redirect for logged-in users.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
