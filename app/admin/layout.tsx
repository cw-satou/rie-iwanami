// Admin layout — renders full-screen, breaking out of the 430px app-shell
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "auto",
        background: "#f9fafb",
        zIndex: 9999,
      }}
    >
      {children}
    </div>
  );
}
