import { type ActionFunctionArgs } from "@remix-run/node";
import { logout } from "../lib/admin-auth.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  return logout(request);
};

// If someone tries to access this via GET, redirect to login
export const loader = async () => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/admin/login",
    },
  });
};
