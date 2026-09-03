export default function ApiPlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-density="compact">{children}</div>;
}
