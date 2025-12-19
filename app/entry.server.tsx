/**
 * Server entry point - returns a simple HTML document handler
 * This is a minimal implementation for client-only SPA
 */
export default function Document({
  children,
  links,
  scripts,
}: {
  children: React.ReactNode;
  links: any[];
  scripts: any[];
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        {links}
      </head>
      <body>
        <div id="root">{children}</div>
        {scripts}
      </body>
    </html>
  );
}
