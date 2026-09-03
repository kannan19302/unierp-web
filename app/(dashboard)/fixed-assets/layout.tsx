export default function FixedAssetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-density="ultra-compact">{children}</div>;
}
