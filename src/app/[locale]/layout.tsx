import { ReactNode } from "react";
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';

type Props = {
  children: ReactNode;
  params: {locale: string};
};
 
export default async function LocaleLayout({
  children,
  params: {locale}
}: Props) {
  // Enable static rendering
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
