export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  return (
    <div dir={lang === "en" ? "ltr" : "rtl"} className="w-full overflow-x-hidden">
      {children}
    </div>
  );
}
