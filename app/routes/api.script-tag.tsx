import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

const json = (body: any, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { admin, session } = await authenticate.admin(request);

    if (!session) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    const shop = session.shop;
    const appUrl = process.env.SHOPIFY_APP_URL || "http://localhost:3000";
    const scriptTagUrl = `${appUrl}/api/script?shop=${encodeURIComponent(shop)}`;

    // Opret script tag via GraphQL
    const response = await admin.graphql(
      `mutation createScriptTag($input: ScriptTagInput!) {
        scriptTagCreate(input: $input) {
          scriptTag {
            id
            src
            displayScope
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            src: scriptTagUrl,
            displayScope: "ONLINE_STORE",
          },
        },
      }
    );

    const data = await response.json();
    const errors = data?.data?.scriptTagCreate?.userErrors || [];

    if (errors.length > 0) {
      console.error("Script tag errors:", errors);
      return json(
        { error: `Failed to create script tag: ${errors.map((e: any) => e.message).join(", ")}` },
        { status: 500 }
      );
    }

    return json({
      success: true,
      message: "Script tag created successfully",
      scriptTag: data?.data?.scriptTagCreate?.scriptTag,
    });
  } catch (error) {
    console.error("Error creating script tag:", error);
    return json(
      { error: `Failed to create script tag: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
