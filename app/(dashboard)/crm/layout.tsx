export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-density="compact">{children}</div>;
}
