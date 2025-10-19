import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { AppProvider, Page, Card, FormLayout, TextField, Button, Text, Banner, Box } from "@shopify/polaris";
import { useState } from "react";
import { verifyLogin, createAdminSession, getAdminId } from "../lib/admin-auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Check if already logged in
  const adminId = await getAdminId(request);
  if (adminId) {
    return redirect("/admin");
  }
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  // Verify credentials
  const admin = await verifyLogin(email, password);

  if (!admin) {
    return json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Create session and redirect
  return createAdminSession(admin.id, "/admin");
};

export default function AdminLogin() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSubmitting = navigation.state === "submitting";

  return (
    <AppProvider i18n={{}}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f6f6f7",
          padding: "20px",
        }}
      >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <Text variant="heading2xl" as="h1">
            Section Store Admin
          </Text>
          <Box paddingBlockStart="200">
            <Text variant="bodyMd" as="p" tone="subdued">
              Sign in to your admin account
            </Text>
          </Box>
        </div>

        {actionData?.error && (
          <Box paddingBlockEnd="400">
            <Banner tone="critical">
              <p>{actionData.error}</p>
            </Banner>
          </Box>
        )}

        <Card>
          <Box padding="400">
            <Form method="post">
              <FormLayout>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  name="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  requiredIndicator
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  name="password"
                  autoComplete="current-password"
                  requiredIndicator
                />
                <Button
                  submit
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </FormLayout>
            </Form>
          </Box>
        </Card>

        <Box paddingBlockStart="400">
          <div style={{ textAlign: "center" }}>
            <Text variant="bodySm" as="p" tone="subdued">
              © 2025 Section Store. All rights reserved.
            </Text>
          </div>
        </Box>
      </div>
    </div>
    </AppProvider>
  );
}
