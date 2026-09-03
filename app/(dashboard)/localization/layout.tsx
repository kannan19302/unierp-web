export default function LocalizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-density="compact">{children}</div>;
}
