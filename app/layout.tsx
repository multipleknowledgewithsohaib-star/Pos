import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import './responsive.css';

export const metadata: Metadata = {
  title: 'Core SaaS Healthcare',
  description: 'Healthcare SaaS admin panel built with Next.js and TypeScript.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="strip-extension-hydration-attrs" strategy="beforeInteractive">
          {`(() => {
            const EXT_ATTRS = ['bis_skin_checked', 'bis_register', 'cz-shortcut-listen', 'data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'];
            const strip = (root = document) => {
              const nodes = root.querySelectorAll ? root.querySelectorAll('*') : [];
              nodes.forEach((element) => {
                EXT_ATTRS.forEach((attr) => element.removeAttribute(attr));
              });
              if (root.removeAttribute) {
                EXT_ATTRS.forEach((attr) => root.removeAttribute(attr));
              }
            };

            strip();

            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName && EXT_ATTRS.includes(mutation.attributeName)) {
                  mutation.target.removeAttribute(mutation.attributeName);
                }

                mutation.addedNodes.forEach((node) => {
                  if (node.nodeType === 1) {
                    strip(node);
                  }
                });
              });
            });

            observer.observe(document.documentElement, {
              attributes: true,
              attributeFilter: EXT_ATTRS,
              childList: true,
              subtree: true,
            });

            window.addEventListener('load', () => observer.disconnect(), { once: true });
          })();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
