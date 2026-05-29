export const metadata = {
  title: "Chat Igniter — Twitch Engagement Scripts",
  description: "Never stare at a quiet chat again. Instant scripts for every stream moment.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
