export default function HrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-density="compact">{children}</div>;
}
