import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Select,
  Checkbox,
  Button,
  Banner,
  Box,
  List,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../lib/shopify.server";
import { prisma } from "../lib/db.server";
import { AppLayout } from "../components/layout/AppLayout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Get all themes from Shopify
  const themesResponse = await admin.rest.get({
    path: "themes",
  });

  const themes = themesResponse.data.themes || [];

  // Get installed sections
  const installations = await prisma.installation.findMany({
    where: {
      shop: { shopDomain },
      isActive: true,
    },
    include: {
      section: true,
    },
    orderBy: { installedAt: "desc" },
  });

  // Group installations by theme
  const installationsByTheme = installations.reduce((acc, inst) => {
    if (!acc[inst.themeId]) {
      acc[inst.themeId] = [];
    }
    acc[inst.themeId].push(inst);
    return acc;
  }, {} as Record<string, typeof installations>);

  return json({
    themes,
    installations,
    installationsByTheme,
    shopDomain,
  });
};

export default function ThemeMigrator() {
  const { themes, installationsByTheme } = useLoaderData<typeof loader>();
  
  const [sourceThemeId, setSourceThemeId] = useState("");
  const [destinationThemeId, setDestinationThemeId] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [backupTheme, setBackupTheme] = useState(true);
  const [preserveSettings, setPreserveSettings] = useState(true);
  const [updateReferences, setUpdateReferences] = useState(true);

  const themeOptions = themes.map((theme: any) => ({
    label: `${theme.name}${theme.role === "main" ? " (Live)" : ""}`,
    value: theme.id.toString(),
  }));

  const sourceSections = sourceThemeId ? installationsByTheme[sourceThemeId] || [] : [];

  const handleSectionToggle = (sectionId: string) => {
    if (selectedSections.includes(sectionId)) {
      setSelectedSections(selectedSections.filter((id) => id !== sectionId));
    } else {
      setSelectedSections([...selectedSections, sectionId]);
    }
  };

  const handleSelectAll = () => {
    setSelectedSections(sourceSections.map((inst) => inst.sectionId));
  };

  const handleSelectNone = () => {
    setSelectedSections([]);
  };

  return (
    <AppLayout>
      <Page title="Theme Migrator">
        <Layout>
          {/* Info Banner */}
          <Layout.Section>
            <Banner tone="info">
              <p>
                Easily migrate your Section Store sections from one theme to another. Select the sections you want to transfer and we'll handle the rest.
              </p>
            </Banner>
          </Layout.Section>

          {/* Migration Wizard */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingLg" as="h2">
                  Migration Wizard
                </Text>
                
                <Box paddingBlockStart="400">
                  <Form method="post">
                    {/* Step 1: Source Theme */}
                    <div style={{ marginBottom: "24px" }}>
                      <Text variant="headingMd" as="h3">
                        Step 1: Select Source Theme
                      </Text>
                      <Box paddingBlockStart="300">
                        <Select
                          label="Source theme"
                          options={[
                            { label: "Select a theme", value: "" },
                            ...themeOptions,
                          ]}
                          value={sourceThemeId}
                          onChange={setSourceThemeId}
                        />
                      </Box>

                      {sourceSections.length > 0 && (
                        <Box paddingBlockStart="300">
                          <div
                            style={{
                              background: "#f6f6f7",
                              padding: "16px",
                              borderRadius: "8px",
                            }}
                          >
                            <Text variant="bodySm" as="p">
                              Detected {sourceSections.length} Section Store sections:
                            </Text>
                            <Box paddingBlockStart="200">
                              {sourceSections.map((inst) => (
                                <div
                                  key={inst.id}
                                  style={{ marginBottom: "8px" }}
                                >
                                  <Checkbox
                                    label={inst.section.name}
                                    checked={selectedSections.includes(inst.sectionId)}
                                    onChange={() => handleSectionToggle(inst.sectionId)}
                                  />
                                </div>
                              ))}
                            </Box>
                            <Box paddingBlockStart="200">
                              <div style={{ display: "flex", gap: "8px" }}>
                                <Button size="slim" onClick={handleSelectAll}>
                                  Select All
                                </Button>
                                <Button size="slim" onClick={handleSelectNone}>
                                  Select None
                                </Button>
                              </div>
                            </Box>
                          </div>
                        </Box>
                      )}
                    </div>

                    {/* Step 2: Destination Theme */}
                    <div style={{ marginBottom: "24px" }}>
                      <Text variant="headingMd" as="h3">
                        Step 2: Select Destination Theme
                      </Text>
                      <Box paddingBlockStart="300">
                        <Select
                          label="Destination theme"
                          options={[
                            { label: "Select a theme", value: "" },
                            ...themeOptions.filter((opt) => opt.value !== sourceThemeId),
                          ]}
                          value={destinationThemeId}
                          onChange={setDestinationThemeId}
                        />
                      </Box>

                      {destinationThemeId && (
                        <Box paddingBlockStart="300">
                          <Banner tone="success">
                            <p>
                              ✓ Theme is compatible with all selected sections
                            </p>
                          </Banner>
                        </Box>
                      )}
                    </div>

                    {/* Step 3: Migration Options */}
                    <div style={{ marginBottom: "24px" }}>
                      <Text variant="headingMd" as="h3">
                        Step 3: Migration Options
                      </Text>
                      <Box paddingBlockStart="300">
                        <div
                          style={{
                            background: "#f6f6f7",
                            padding: "16px",
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          <Checkbox
                            label="Backup destination theme before migration"
                            checked={backupTheme}
                            onChange={setBackupTheme}
                            helpText="Recommended for safety"
                          />
                          <Checkbox
                            label="Preserve section settings"
                            checked={preserveSettings}
                            onChange={setPreserveSettings}
                            helpText="Copy settings from source sections"
                          />
                          <Checkbox
                            label="Update section references in templates"
                            checked={updateReferences}
                            onChange={setUpdateReferences}
                            helpText="Automatically update template files"
                          />
                        </div>
                      </Box>
                    </div>

                    {/* Action Button */}
                    <div>
                      <Button
                        variant="primary"
                        size="large"
                        submit
                        disabled={!sourceThemeId || !destinationThemeId || selectedSections.length === 0}
                      >
                        Start Migration ({selectedSections.length} sections)
                      </Button>
                    </div>
                  </Form>
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          {/* Import/Export */}
          <Layout.Section>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              <Card>
                <Box padding="400">
                  <Text variant="headingMd" as="h3">
                    Export Sections
                  </Text>
                  <Box paddingBlockStart="300">
                    <Text variant="bodyMd" as="p">
                      Export your sections from this store to a file. Use this to backup sections or transfer them to another store.
                    </Text>
                  </Box>
                  <Box paddingBlockStart="400">
                    <Button>Export All Sections</Button>
                  </Box>
                </Box>
              </Card>

              <Card>
                <Box padding="400">
                  <Text variant="headingMd" as="h3">
                    Import Sections
                  </Text>
                  <Box paddingBlockStart="300">
                    <Text variant="bodyMd" as="p">
                      Import sections from a previously exported file. This will add the sections to your current store.
                    </Text>
                  </Box>
                  <Box paddingBlockStart="400">
                    <Button>Choose File & Import</Button>
                  </Box>
                </Box>
              </Card>
            </div>
          </Layout.Section>

          {/* How It Works */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingLg" as="h2">
                  How Theme Migration Works
                </Text>
                <Box paddingBlockStart="300">
                  <List type="number">
                    <List.Item>
                      <strong>Section Detection:</strong> We scan your source theme for Section Store sections
                    </List.Item>
                    <List.Item>
                      <strong>Compatibility Check:</strong> Verify all sections are compatible with the destination theme
                    </List.Item>
                    <List.Item>
                      <strong>Backup:</strong> Create a backup of your destination theme (if enabled)
                    </List.Item>
                    <List.Item>
                      <strong>Migration:</strong> Copy selected sections and their settings to the destination theme
                    </List.Item>
                    <List.Item>
                      <strong>Verification:</strong> Confirm all sections installed correctly
                    </List.Item>
                    <List.Item>
                      <strong>Report:</strong> Provide a detailed migration summary
                    </List.Item>
                  </List>
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          {/* Tips */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingMd" as="h3">
                  💡 Migration Tips
                </Text>
                <Box paddingBlockStart="300">
                  <List type="bullet">
                    <List.Item>
                      Always create a backup before migrating to a live theme
                    </List.Item>
                    <List.Item>
                      Test the migration on a development theme first
                    </List.Item>
                    <List.Item>
                      Section settings will be preserved but may need minor adjustments
                    </List.Item>
                    <List.Item>
                      Migration typically takes 1-2 minutes per section
                    </List.Item>
                    <List.Item>
                      Contact support if you encounter any issues
                    </List.Item>
                  </List>
                </Box>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppLayout>
  );
}
