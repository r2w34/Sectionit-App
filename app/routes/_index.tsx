import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { login } from "../lib/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { message: "Section Store - Shopify App" };
};

export default function Index() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Section Store</h1>
      <p>This app must be accessed through your Shopify Admin.</p>
    </div>
  );
}
