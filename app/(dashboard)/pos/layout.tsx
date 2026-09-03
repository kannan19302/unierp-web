export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-density="ultra-compact">{children}</div>;
}
