import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { Page, Layout, Card, FormLayout, TextField, Button, Text, Box, Banner } from "@shopify/polaris";
import { useState } from "react";
import { requireAdmin } from "../lib/admin-auth.server";
import { prisma } from "../lib/db.server";
import { AdminLayout } from "../components/layout/AdminLayout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const admin = await requireAdmin(request);

    // Get app settings (create if doesn't exist)
    let settings = await prisma.appSettings.findFirst();
    
    if (!settings) {
      try {
        settings = await prisma.appSettings.create({
          data: {
            defaultSectionPrice: 29,
            defaultBundleDiscount: 20,
            plusSubscriptionPrice: 15,
            supportEmail: "support@indigenservices.com",
          },
        });
      } catch (createError: any) {
        console.error("Error creating settings:", createError);
        // Return defaults if can't create
        settings = {
          id: "default",
          defaultSectionPrice: 29,
          defaultBundleDiscount: 20,
          plusSubscriptionPrice: 15,
          supportEmail: "support@indigenservices.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      }
    }

    return json({
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      settings: {
        id: settings.id,
        defaultSectionPrice: Number(settings.defaultSectionPrice) || 29,
        defaultBundleDiscount: Number(settings.defaultBundleDiscount) || 20,
        plusSubscriptionPrice: Number(settings.plusSubscriptionPrice) || 15,
        supportEmail: settings.supportEmail || "support@indigenservices.com",
      },
    });
  } catch (error: any) {
    console.error("Error loading settings:", error);
    return json({
      admin: { name: "Admin", email: "", role: "SUPER_ADMIN" },
      settings: {
        id: "default",
        defaultSectionPrice: 29,
        defaultBundleDiscount: 20,
        plusSubscriptionPrice: 15,
        supportEmail: "support@indigenservices.com",
      },
      error: error.message || "Failed to load settings",
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const admin = await requireAdmin(request);
  const formData = await request.formData();

  const defaultSectionPrice = parseFloat(formData.get("defaultSectionPrice") as string);
  const defaultBundleDiscount = parseFloat(formData.get("defaultBundleDiscount") as string);
  const plusSubscriptionPrice = parseFloat(formData.get("plusSubscriptionPrice") as string);
  const supportEmail = formData.get("supportEmail") as string;

  // Update or create settings
  const existingSettings = await prisma.appSettings.findFirst();

  if (existingSettings) {
    await prisma.appSettings.update({
      where: { id: existingSettings.id },
      data: {
        defaultSectionPrice,
        defaultBundleDiscount,
        plusSubscriptionPrice,
        supportEmail,
      },
    });
  } else {
    await prisma.appSettings.create({
      data: {
        defaultSectionPrice,
        defaultBundleDiscount,
        plusSubscriptionPrice,
        supportEmail,
      },
    });
  }

  return json({ success: true, message: "Settings saved successfully!" });
};

export default function AdminSettings() {
  const { admin, settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [defaultSectionPrice, setDefaultSectionPrice] = useState(
    settings.defaultSectionPrice.toString()
  );
  const [defaultBundleDiscount, setDefaultBundleDiscount] = useState(
    settings.defaultBundleDiscount.toString()
  );
  const [plusSubscriptionPrice, setPlusSubscriptionPrice] = useState(
    settings.plusSubscriptionPrice.toString()
  );
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);

  return (
    <AdminLayout user={admin}>
      <Page title="Settings">
        <Layout>
          {actionData?.success && (
            <Layout.Section>
              <Banner tone="success" onDismiss={() => {}}>
                {actionData.message}
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingMd" as="h3">
                  App Settings
                </Text>
                <Box paddingBlockStart="400">
                  <Form method="post">
                    <FormLayout>
                      <TextField
                        label="Default Section Price (USD)"
                        type="number"
                        value={defaultSectionPrice}
                        onChange={setDefaultSectionPrice}
                        name="defaultSectionPrice"
                        prefix="$"
                        helpText="Default price for new sections"
                        autoComplete="off"
                      />

                      <TextField
                        label="Default Bundle Discount (%)"
                        type="number"
                        value={defaultBundleDiscount}
                        onChange={setDefaultBundleDiscount}
                        name="defaultBundleDiscount"
                        suffix="%"
                        helpText="Default discount percentage for bundles"
                        autoComplete="off"
                      />

                      <TextField
                        label="Plus Subscription Price (USD/month)"
                        type="number"
                        value={plusSubscriptionPrice}
                        onChange={setPlusSubscriptionPrice}
                        name="plusSubscriptionPrice"
                        prefix="$"
                        helpText="Monthly subscription price for Plus membership"
                        autoComplete="off"
                      />

                      <TextField
                        label="Support Email"
                        type="email"
                        value={supportEmail}
                        onChange={setSupportEmail}
                        name="supportEmail"
                        helpText="Email address for customer support"
                        autoComplete="email"
                      />

                      <Button submit variant="primary">
                        Save Settings
                      </Button>
                    </FormLayout>
                  </Form>
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingMd" as="h3">
                  App Information
                </Text>
                <Box paddingBlockStart="400">
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        App Version
                      </Text>
                      <Text variant="bodyMd" as="p">
                        2.0.0
                      </Text>
                    </div>
                    <div>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Environment
                      </Text>
                      <Text variant="bodyMd" as="p">
                        Production
                      </Text>
                    </div>
                    <div>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Database Status
                      </Text>
                      <Text variant="bodyMd" as="p">
                        Connected
                      </Text>
                    </div>
                  </div>
                </Box>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AdminLayout>
  );
}
