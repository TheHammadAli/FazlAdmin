import AdminLayout from "@/components/Admin/AdminLayout";
import DictionaryProvider from "@/dictionaries/DictionaryProvider";
import { getDictionary } from "@/utils/dictionary";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dictionary = await getDictionary("en");

  return (
    <DictionaryProvider dictionary={dictionary}>
      <AdminLayout>{children}</AdminLayout>
    </DictionaryProvider>
  );
}
