import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, Form } from "@remix-run/react";
import { Page, Layout, Card, Text, Select, Button, Banner, Box, Checkbox } from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../lib/shopify.server";
import { prisma } from "../lib/db.server";
import { AppLayout } from "../components/layout/AppLayout";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const { sectionId } = params;

  if (!sectionId) {
    throw new Response("Section ID required", { status: 400 });
  }

  // Check if user owns this section
  const purchase = await prisma.purchase.findUnique({
    where: {
      shopId_sectionId: {
        shopId: session.shop,
        sectionId: sectionId,
      },
      status: "completed",
    },
    include: {
      section: true,
    },
  });

  if (!purchase) {
    throw redirect("/app/explore");
  }

  // Get themes
  const themesResponse = await admin.rest.get({
    path: "themes",
  });

  const themes = themesResponse.data.themes || [];

  // Check existing installations
  const installations = await prisma.installation.findMany({
    where: {
      shop: { shopDomain: session.shop },
      sectionId: sectionId,
      isActive: true,
    },
  });

  return json({
    section: purchase.section,
    themes,
    installations,
    shopDomain: session.shop,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const { sectionId } = params;
  const formData = await request.formData();
  const themeId = formData.get("themeId") as string;

  if (!sectionId || !themeId) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get section
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });

  if (!section) {
    return json({ error: "Section not found" }, { status: 404 });
  }

  // Verify purchase
  const purchase = await prisma.purchase.findUnique({
    where: {
      shopId_sectionId: {
        shopId: session.shop,
        sectionId: sectionId,
      },
      status: "completed",
    },
  });

  if (!purchase) {
    return json({ error: "Section not purchased" }, { status: 403 });
  }

  try {
    // Get theme info
    const themeResponse = await admin.rest.get({
      path: `themes/${themeId}`,
    });
    const theme = themeResponse.data.theme;

    // Install section to theme
    await admin.rest.put({
      path: `themes/${themeId}/assets`,
      data: {
        asset: {
          key: `sections/${section.slug}.liquid`,
          value: section.liquidContent,
        },
      },
    });

    // Record installation
    await prisma.installation.create({
      data: {
        shop: {
          connect: { shopDomain: session.shop },
        },
        section: {
          connect: { id: sectionId },
        },
        themeId: themeId,
        themeName: theme.name,
      },
    });

    // Update section stats
    await prisma.section.update({
      where: { id: sectionId },
      data: {
        installCount: {
          increment: 1,
        },
      },
    });

    return redirect(`/app?installed=${sectionId}`);
  } catch (error: any) {
    console.error("Installation error:", error);
    return json(
      {
        error: "Failed to install section",
        details: error.message,
      },
      { status: 500 }
    );
  }
};

export default function InstallSection() {
  const { section, themes, installations } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [addToHomepage, setAddToHomepage] = useState(false);

  const themeOptions = themes.map((theme: any) => ({
    label: `${theme.name}${theme.role === "main" ? " (Live)" : ""}`,
    value: theme.id.toString(),
  }));

  const installedThemeIds = installations.map((inst: any) => inst.themeId);
  const selectedTheme = themes.find((t: any) => t.id.toString() === selectedThemeId);
  const alreadyInstalled = installedThemeIds.includes(selectedThemeId);

  return (
    <AppLayout>
      <Page
        title="Install Section"
        backAction={{ onAction: () => navigate("/app") }}
      >
        <Layout>
          {/* Section Info */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div
                    style={{
                      width: "100px",
                      height: "75px",
                      background: "#f6f6f7",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={section.previewImageUrl}
                      alt={section.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div>
                    <Text variant="headingLg" as="h2">
                      {section.name}
                    </Text>
                    <Box paddingBlockStart="100">
                      <Text variant="bodyMd" as="p" tone="subdued">
                        {section.shortDescription}
                      </Text>
                    </Box>
                  </div>
                </div>
              </Box>
            </Card>
          </Layout.Section>

          {/* Installation Form */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingLg" as="h2">
                  Installation Options
                </Text>

                <Box paddingBlockStart="400">
                  <Form method="post">
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {/* Theme Selection */}
                      <Select
                        label="Select Theme"
                        options={[
                          { label: "Choose a theme", value: "" },
                          ...themeOptions,
                        ]}
                        value={selectedThemeId}
                        onChange={(value) => {
                          setSelectedThemeId(value);
                        }}
                        name="themeId"
                      />

                      {/* Already Installed Warning */}
                      {alreadyInstalled && (
                        <Banner tone="warning">
                          <p>
                            This section is already installed on this theme. Installing again will overwrite the existing version.
                          </p>
                        </Banner>
                      )}

                      {/* Theme Info */}
                      {selectedTheme && (
                        <div
                          style={{
                            background: "#f6f6f7",
                            padding: "16px",
                            borderRadius: "8px",
                          }}
                        >
                          <Text variant="headingMd" as="h3">
                            Theme: {selectedTheme.name}
                          </Text>
                          <Box paddingBlockStart="200">
                            <Text variant="bodySm" as="p" tone="subdued">
                              {selectedTheme.role === "main" ? "✓ Live theme" : "Draft theme"}
                            </Text>
                          </Box>
                        </div>
                      )}

                      {/* Options */}
                      <Checkbox
                        label="Open theme editor after installation"
                        checked={addToHomepage}
                        onChange={setAddToHomepage}
                        helpText="Automatically open the theme editor so you can add the section to a page"
                      />

                      {/* Submit Button */}
                      <Button
                        submit
                        variant="primary"
                        size="large"
                        disabled={!selectedThemeId}
                      >
                        Install Section
                      </Button>
                    </div>
                  </Form>
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          {/* Instructions */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingMd" as="h3">
                  After Installation
                </Text>
                <Box paddingBlockStart="300">
                  <Text variant="bodyMd" as="p">
                    Once installed, you can:
                  </Text>
                  <Box paddingBlockStart="200">
                    <ol style={{ paddingLeft: "20px" }}>
                      <li style={{ marginBottom: "8px" }}>
                        Go to your Shopify admin → Online Store → Themes
                      </li>
                      <li style={{ marginBottom: "8px" }}>
                        Click "Customize" on the theme you installed to
                      </li>
                      <li style={{ marginBottom: "8px" }}>
                        Click "Add section" on any page
                      </li>
                      <li style={{ marginBottom: "8px" }}>
                        Find "{section.name}" in the section list
                      </li>
                      <li>
                        Customize the section settings to match your brand
                      </li>
                    </ol>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          {/* Previously Installed */}
          {installations.length > 0 && (
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <Text variant="headingMd" as="h3">
                    Installation History
                  </Text>
                  <Box paddingBlockStart="300">
                    <Text variant="bodyMd" as="p" tone="subdued">
                      This section is currently installed on:
                    </Text>
                    <Box paddingBlockStart="200">
                      <ul style={{ paddingLeft: "20px" }}>
                        {installations.map((inst: any) => (
                          <li key={inst.id}>
                            {inst.themeName} (Installed{" "}
                            {new Date(inst.installedAt).toLocaleDateString()})
                          </li>
                        ))}
                      </ul>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Layout.Section>
          )}
        </Layout>
      </Page>
    </AppLayout>
  );
}
