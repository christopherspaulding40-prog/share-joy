import { ServerDocument } from "react-router";

/**
 * Server document handler for React Router
 * This renders the HTML shell that loads the client bundle
 */
export default function Document({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="preconnect"
          href="https://cdn.shopify.com/"
        />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
