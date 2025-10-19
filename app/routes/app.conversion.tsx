import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  Badge,
  Box,
  Banner,
  List,
} from "@shopify/polaris";
import { authenticate } from "../lib/shopify.server";
import { prisma } from "../lib/db.server";
import { AppLayout } from "../components/layout/AppLayout";
import { SectionCard } from "../components/sections/SectionCard";
import { SectionPreviewModal } from "../components/sections/SectionPreviewModal";
import { useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Get Plus-only sections
  const plusSections = await prisma.section.findMany({
    where: {
      isActive: true,
      isPlus: true,
    },
    include: {
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: [
      { isFeatured: "desc" },
      { purchaseCount: "desc" },
    ],
  });

  // Get conversion-focused sections (non-Plus)
  const conversionSections = await prisma.section.findMany({
    where: {
      isActive: true,
      isPlus: false,
      OR: [
        { tags: { some: { tag: { slug: "conversion" } } } },
        { tags: { some: { tag: { slug: "upsell" } } } },
        { tags: { some: { tag: { slug: "countdown" } } } },
        { tags: { some: { tag: { slug: "urgency" } } } },
      ],
    },
    include: {
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { purchaseCount: "desc" },
    take: 12,
  });

  // Check if user has Plus subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      shop: { shopDomain },
      status: { in: ["active", "trial"] },
    },
  });

  const hasPlusSubscription = !!subscription;
  const isInTrial = subscription?.status === "trial";

  // Get user's purchases
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    include: {
      purchases: true,
      favorites: true,
    },
  });

  const purchasedSectionIds = shop?.purchases.map((p) => p.sectionId) || [];
  const favoriteSectionIds = shop?.favorites.map((f) => f.sectionId) || [];

  // Transform sections
  const transformPlusSections = plusSections.map((s) => ({
    ...s,
    tags: s.tags.map((st) => st.tag.name),
    categoryName: s.category.name,
    isPurchased: hasPlusSubscription || purchasedSectionIds.includes(s.id),
    isFavorite: favoriteSectionIds.includes(s.id),
  }));

  const transformConversionSections = conversionSections.map((s) => ({
    ...s,
    tags: s.tags.map((st) => st.tag.name),
    categoryName: s.category.name,
    isPurchased: purchasedSectionIds.includes(s.id),
    isFavorite: favoriteSectionIds.includes(s.id),
  }));

  return json({
    plusSections: transformPlusSections,
    conversionSections: transformConversionSections,
    hasPlusSubscription,
    isInTrial,
    shopDomain,
  });
};

export default function ConversionBlocks() {
  const {
    plusSections,
    conversionSections,
    hasPlusSubscription,
    isInTrial,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [previewSection, setPreviewSection] = useState<any>(null);

  const handlePreview = (id: string) => {
    const section =
      plusSections.find((s) => s.id === id) ||
      conversionSections.find((s) => s.id === id);
    setPreviewSection(section || null);
  };

  const handlePurchase = (id: string) => {
    navigate(`/app/purchase/${id}`);
  };

  const handleUpgrade = () => {
    navigate("/app/subscribe/plus");
  };

  return (
    <AppLayout>
      <Page title="Conversion Blocks - Maximize Your Sales">
        <Layout>
          {/* Plus Subscription Banner */}
          <Layout.Section>
            {!hasPlusSubscription ? (
              <Card>
                <Box padding="400">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "300px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Text variant="headingXl" as="h2">
                          ⚡ Section Store Plus
                        </Text>
                        <Badge tone="magic">Premium</Badge>
                      </div>
                      <Box paddingBlockStart="300">
                        <Text variant="bodyLg" as="p">
                          Get exclusive access to conversion-focused blocks and maximize your store's revenue
                        </Text>
                      </Box>
                      <Box paddingBlockStart="300">
                        <Text variant="headingLg" as="p">
                          $10-15/month
                        </Text>
                      </Box>
                    </div>
                    <div>
                      <Button variant="primary" size="large" onClick={handleUpgrade}>
                        Start Free 14-Day Trial
                      </Button>
                    </div>
                  </div>
                </Box>
              </Card>
            ) : (
              <Banner tone="success">
                <p>
                  {isInTrial ? (
                    <>
                      <strong>🎉 You're on a Plus trial!</strong> Enjoy full access to all Plus-exclusive sections.
                    </>
                  ) : (
                    <>
                      <strong>⚡ You're a Plus member!</strong> You have access to all exclusive conversion blocks.
                    </>
                  )}
                </p>
              </Banner>
            )}
          </Layout.Section>

          {/* Plus Membership Benefits */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingLg" as="h3">
                  Plus Membership Perks
                </Text>
                <Box paddingBlockStart="300">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "24px",
                    }}
                  >
                    <div>
                      <Text variant="headingMd" as="h4">
                        ✓ Plus-Exclusive Sections
                      </Text>
                      <Box paddingBlockStart="200">
                        <Text variant="bodyMd" as="p" tone="subdued">
                          Access advanced conversion blocks not available to regular users
                        </Text>
                      </Box>
                    </div>
                    <div>
                      <Text variant="headingMd" as="h4">
                        ✓ Priority Support
                      </Text>
                      <Box paddingBlockStart="200">
                        <Text variant="bodyMd" as="p" tone="subdued">
                          Get help within 2 hours from our support team
                        </Text>
                      </Box>
                    </div>
                    <div>
                      <Text variant="headingMd" as="h4">
                        ✓ Early Access
                      </Text>
                      <Box paddingBlockStart="200">
                        <Text variant="bodyMd" as="p" tone="subdued">
                          Try new sections 2 weeks before public release
                        </Text>
                      </Box>
                    </div>
                    <div>
                      <Text variant="headingMd" as="h4">
                        ✓ Monthly Releases
                      </Text>
                      <Box paddingBlockStart="200">
                        <Text variant="bodyMd" as="p" tone="subdued">
                          New Plus-exclusive sections added every month
                        </Text>
                      </Box>
                    </div>
                    <div>
                      <Text variant="headingMd" as="h4">
                        ✓ Custom Requests
                      </Text>
                      <Box paddingBlockStart="200">
                        <Text variant="bodyMd" as="p" tone="subdued">
                          Request 1 custom section per month
                        </Text>
                      </Box>
                    </div>
                    <div>
                      <Text variant="headingMd" as="h4">
                        ✓ Beta Features
                      </Text>
                      <Box paddingBlockStart="200">
                        <Text variant="bodyMd" as="p" tone="subdued">
                          Test experimental features before launch
                        </Text>
                      </Box>
                    </div>
                  </div>
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          {/* Plus-Exclusive Sections */}
          {plusSections.length > 0 && (
            <>
              <Layout.Section>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text variant="headingLg" as="h3">
                    ⚡ Plus-Exclusive Sections
                  </Text>
                  {!hasPlusSubscription && (
                    <Badge tone="magic">Requires Plus Membership</Badge>
                  )}
                </div>
              </Layout.Section>

              <Layout.Section>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {plusSections.map((section) => (
                    <div key={section.id} style={{ position: "relative" }}>
                      {!hasPlusSubscription && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(255, 255, 255, 0.9)",
                            zIndex: 10,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "8px",
                            padding: "20px",
                            textAlign: "center",
                          }}
                        >
                          <span style={{ fontSize: "48px", marginBottom: "16px" }}>
                            🔒
                          </span>
                          <Text variant="headingMd" as="p">
                            Plus Members Only
                          </Text>
                          <Box paddingBlockStart="300">
                            <Button onClick={handleUpgrade}>
                              Upgrade to Plus
                            </Button>
                          </Box>
                        </div>
                      )}
                      <SectionCard
                        id={section.id}
                        name={section.name}
                        description={section.shortDescription}
                        price={section.price}
                        isFree={section.isFree}
                        isPro={section.isPro}
                        isPlus={section.isPlus}
                        isNew={section.isNew}
                        isTrending={section.isTrending}
                        previewImageUrl={section.previewImageUrl}
                        rating={section.rating}
                        reviewCount={section.reviewCount}
                        tags={section.tags}
                        isPurchased={section.isPurchased}
                        isFavorite={section.isFavorite}
                        onPreview={handlePreview}
                        onPurchase={handlePurchase}
                      />
                    </div>
                  ))}
                </div>
              </Layout.Section>
            </>
          )}

          {/* Conversion-Focused Sections */}
          {conversionSections.length > 0 && (
            <>
              <Layout.Section>
                <Box paddingBlockStart="800">
                  <Text variant="headingLg" as="h3">
                    🎯 Conversion-Focused Sections
                  </Text>
                  <Box paddingBlockStart="200">
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Boost your sales with these proven conversion-optimized sections
                    </Text>
                  </Box>
                </Box>
              </Layout.Section>

              <Layout.Section>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {conversionSections.map((section) => (
                    <SectionCard
                      key={section.id}
                      id={section.id}
                      name={section.name}
                      description={section.shortDescription}
                      price={section.price}
                      isFree={section.isFree}
                      isPro={section.isPro}
                      isPlus={section.isPlus}
                      isNew={section.isNew}
                      isTrending={section.isTrending}
                      previewImageUrl={section.previewImageUrl}
                      rating={section.rating}
                      reviewCount={section.reviewCount}
                      tags={section.tags}
                      isPurchased={section.isPurchased}
                      isFavorite={section.isFavorite}
                      onPreview={handlePreview}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </div>
              </Layout.Section>
            </>
          )}

          {/* Why Conversion Matters */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingLg" as="h3">
                  Why Conversion Optimization Matters
                </Text>
                <Box paddingBlockStart="300">
                  <List type="bullet">
                    <List.Item>
                      <strong>Increase Average Order Value (AOV)</strong> - Upsell and cross-sell blocks can boost order values by 20-30%
                    </List.Item>
                    <List.Item>
                      <strong>Reduce Cart Abandonment</strong> - Exit intent popups and urgency timers recover 10-15% of lost sales
                    </List.Item>
                    <List.Item>
                      <strong>Build Trust</strong> - Social proof and trust badges increase conversion rates by 15-25%
                    </List.Item>
                    <List.Item>
                      <strong>Create Urgency</strong> - Countdown timers and low stock alerts drive immediate action
                    </List.Item>
                    <List.Item>
                      <strong>Optimize Checkout</strong> - Sticky add-to-cart bars and quick views reduce friction
                    </List.Item>
                  </List>
                </Box>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Preview Modal */}
        <SectionPreviewModal
          isOpen={previewSection !== null}
          onClose={() => setPreviewSection(null)}
          section={previewSection}
          isPurchased={previewSection?.isPurchased}
          onPurchase={handlePurchase}
          onInstall={(id) => navigate(`/app/install/${id}`)}
        />
      </Page>
    </AppLayout>
  );
}
