import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../lib/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};
