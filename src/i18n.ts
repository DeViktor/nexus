import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // No need to validate locale here, as this is handled by the middleware.
 
  // This try-catch block is a safeguard against unsupported locales.
  // It will render a 404 page if a locale is requested that doesn't have a corresponding messages file.
  try {
    return {
      locale,
      messages: (await import(`../messages/${locale}.json`)).default
    };
  } catch (error) {
    notFound();
  }
});