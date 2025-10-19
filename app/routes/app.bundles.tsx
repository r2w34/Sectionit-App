import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Tabs,
  Button,
  Badge,
  Box,
  Banner,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../lib/shopify.server";
import { prisma } from "../lib/db.server";
import { AppLayout } from "../components/layout/AppLayout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Get all active bundles
  const bundles = await prisma.bundle.findMany({
    where: { isActive: true },
    include: {
      items: {
        include: {
          section: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  // Get user's bundle purchases
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    include: {
      bundlePurchases: true,
    },
  });

  const purchasedBundleIds = shop?.bundlePurchases.map((bp) => bp.bundleId) || [];

  return json({
    bundles,
    purchasedBundleIds,
    shopDomain,
  });
};

export default function Bundles() {
  const { bundles, purchasedBundleIds } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { id: "premade", content: "Pre-Made Bundles" },
    { id: "custom", content: "Create Custom Bundle" },
  ];

  const handleTabChange = (selectedTabIndex: number) => {
    setSelectedTab(selectedTabIndex);
  };

  const handlePurchaseBundle = (bundleId: string) => {
    navigate(`/app/purchase/bundle/${bundleId}`);
  };

  const calculateSavings = (regularPrice: number, bundlePrice: number) => {
    return ((regularPrice - bundlePrice) / regularPrice) * 100;
  };

  return (
    <AppLayout>
      <Page title="Bundle & Save">
        <Layout>
          {/* Info Banner */}
          <Layout.Section>
            <Banner tone="info">
              <p>
                <strong>Save up to 40% with bundles!</strong> Get multiple sections at a
                discounted price. The more you buy, the more you save.
              </p>
            </Banner>
          </Layout.Section>

          {/* Tabs */}
          <Layout.Section>
            <Card>
              <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} />
            </Card>
          </Layout.Section>

          {/* Pre-Made Bundles */}
          {selectedTab === 0 && (
            <Layout.Section>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                  gap: "24px",
                }}
              >
                {bundles.map((bundle) => {
                  const savingsPercent = calculateSavings(
                    bundle.regularPrice,
                    bundle.bundlePrice
                  );
                  const isPurchased = purchasedBundleIds.includes(bundle.id);

                  return (
                    <Card key={bundle.id}>
                      <Box padding="400">
                        {/* Header */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "16px",
                          }}
                        >
                          <div>
                            <Text variant="headingLg" as="h3">
                              {bundle.name}
                            </Text>
                            {bundle.badge && (
                              <Box paddingBlockStart="200">
                                <Badge tone="info">{bundle.badge}</Badge>
                              </Box>
                            )}
                          </div>
                          {bundle.isFeatured && (
                            <Badge tone="success">Most Popular</Badge>
                          )}
                        </div>

                        {/* Description */}
                        <Box paddingBlockStart="200" paddingBlockEnd="400">
                          <Text variant="bodyMd" as="p" tone="subdued">
                            {bundle.description}
                          </Text>
                        </Box>

                        {/* Sections Included */}
                        <Box paddingBlockStart="200" paddingBlockEnd="400">
                          <Text variant="headingMd" as="h4">
                            {bundle.items.length} Sections Included:
                          </Text>
                          <Box paddingBlockStart="200">
                            <ul style={{ paddingLeft: "20px", margin: 0 }}>
                              {bundle.items.slice(0, 5).map((item) => (
                                <li key={item.id} style={{ marginBottom: "4px" }}>
                                  <Text variant="bodyMd" as="span">
                                    {item.section.name}
                                  </Text>
                                </li>
                              ))}
                              {bundle.items.length > 5 && (
                                <li style={{ marginBottom: "4px" }}>
                                  <Text variant="bodyMd" as="span" tone="subdued">
                                    + {bundle.items.length - 5} more sections...
                                  </Text>
                                </li>
                              )}
                            </ul>
                          </Box>
                        </Box>

                        {/* Pricing */}
                        <Box
                          paddingBlockStart="400"
                          paddingBlockEnd="400"
                          borderBlockStartWidth="025"
                          borderColor="border"
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <Text variant="bodySm" as="p" tone="subdued">
                                Regular Value:{" "}
                                <span
                                  style={{
                                    textDecoration: "line-through",
                                  }}
                                >
                                  ${bundle.regularPrice}
                                </span>
                              </Text>
                              <Text variant="headingXl" as="p">
                                ${bundle.bundlePrice}
                              </Text>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <Badge tone="success">
                                Save {savingsPercent.toFixed(0)}%
                              </Badge>
                              <Text variant="bodySm" as="p" tone="subdued">
                                ${(bundle.regularPrice - bundle.bundlePrice).toFixed(2)}{" "}
                                off
                              </Text>
                            </div>
                          </div>
                        </Box>

                        {/* Action Button */}
                        <Box paddingBlockStart="400">
                          {isPurchased ? (
                            <Button fullWidth tone="success" disabled>
                              ✓ Purchased
                            </Button>
                          ) : (
                            <Button
                              fullWidth
                              variant="primary"
                              onClick={() => handlePurchaseBundle(bundle.id)}
                            >
                              Buy Bundle - ${bundle.bundlePrice}
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  );
                })}
              </div>
            </Layout.Section>
          )}

          {/* Custom Bundle Builder */}
          {selectedTab === 1 && (
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <Text variant="headingLg" as="h3">
                    Create Your Custom Bundle
                  </Text>
                  <Box paddingBlockStart="300">
                    <Text variant="bodyMd" as="p">
                      Select multiple sections to create your own custom bundle and save!
                    </Text>
                  </Box>

                  {/* Discount Tiers */}
                  <Box paddingBlockStart="400">
                    <div
                      style={{
                        background: "#f6f6f7",
                        padding: "16px",
                        borderRadius: "8px",
                      }}
                    >
                      <Text variant="headingMd" as="h4">
                        Discount Tiers:
                      </Text>
                      <Box paddingBlockStart="200">
                        <ul style={{ margin: 0, paddingLeft: "20px" }}>
                          <li>
                            <Text variant="bodyMd" as="span">
                              3-5 sections: <strong>15% off</strong>
                            </Text>
                          </li>
                          <li>
                            <Text variant="bodyMd" as="span">
                              6-9 sections: <strong>25% off</strong>
                            </Text>
                          </li>
                          <li>
                            <Text variant="bodyMd" as="span">
                              10-15 sections: <strong>35% off</strong>
                            </Text>
                          </li>
                          <li>
                            <Text variant="bodyMd" as="span">
                              16+ sections: <strong>40% off</strong>
                            </Text>
                          </li>
                        </ul>
                      </Box>
                    </div>
                  </Box>

                  {/* CTA */}
                  <Box paddingBlockStart="400">
                    <Button
                      variant="primary"
                      onClick={() => navigate("/app/explore?bundle=true")}
                    >
                      Start Building Your Bundle
                    </Button>
                  </Box>
                </Box>
              </Card>

              {/* How it Works */}
              <Box paddingBlockStart="400">
                <Card>
                  <Box padding="400">
                    <Text variant="headingMd" as="h3">
                      How Custom Bundles Work
                    </Text>
                    <Box paddingBlockStart="300">
                      <ol style={{ paddingLeft: "20px" }}>
                        <li style={{ marginBottom: "12px" }}>
                          <Text variant="bodyMd" as="span">
                            <strong>Browse Sections:</strong> Visit the Explore page and
                            select sections you want to bundle together.
                          </Text>
                        </li>
                        <li style={{ marginBottom: "12px" }}>
                          <Text variant="bodyMd" as="span">
                            <strong>Add to Bundle:</strong> Click "Add to Bundle" on each
                            section you want to include.
                          </Text>
                        </li>
                        <li style={{ marginBottom: "12px" }}>
                          <Text variant="bodyMd" as="span">
                            <strong>Review Your Bundle:</strong> See your discount
                            automatically applied based on the number of sections.
                          </Text>
                        </li>
                        <li style={{ marginBottom: "12px" }}>
                          <Text variant="bodyMd" as="span">
                            <strong>Checkout:</strong> Purchase all sections together at
                            the discounted bundle price.
                          </Text>
                        </li>
                      </ol>
                    </Box>
                  </Box>
                </Card>
              </Box>
            </Layout.Section>
          )}
        </Layout>
      </Page>
    </AppLayout>
  );
}
