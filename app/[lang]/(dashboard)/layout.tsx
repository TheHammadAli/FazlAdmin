import Layout from "@/components/Layout/Layout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Layout>{children}</Layout>
    </div>
  );
}
