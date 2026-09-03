export default function StorageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-density="compact">{children}</div>;
}
