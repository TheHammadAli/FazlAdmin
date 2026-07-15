import { Locale } from "@/i18n.config";
import DictionaryProvider from "@/dictionaries/DictionaryProvider";
import { getDictionary } from "@/utils/dictionary";
import LangDocumentAttributes from "@/components/Layout/LangDocumentAttributes";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang as Locale);

  return (
    <LangDocumentAttributes lang={lang}>
      <DictionaryProvider dictionary={dictionary}>
        {children}
      </DictionaryProvider>
    </LangDocumentAttributes>
  );
}
