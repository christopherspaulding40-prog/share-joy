import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { startTransition } from "react";
import * as ReactRouter from "react-router";

import { App } from "./root";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000 },
  },
});

async function hydrate() {
  startTransition(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </StrictMode>
    );
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", hydrate);
} else {
  hydrate();
}
