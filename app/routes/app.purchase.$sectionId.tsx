import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, Form } from "@remix-run/react";
import { Page, Layout, Card, Text, Button, Banner, Box, List } from "@shopify/polaris";
import { authenticate } from "../lib/shopify.server";
import { prisma } from "../lib/db.server";
import { AppLayout } from "../components/layout/AppLayout";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { sectionId } = params;

  if (!sectionId) {
    throw new Response("Section ID required", { status: 400 });
  }

  // Get section details
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!section || !section.isActive) {
    throw new Response("Section not found", { status: 404 });
  }

  // Check if already purchased
  const existingPurchase = await prisma.purchase.findUnique({
    where: {
      shopId_sectionId: {
        shopId: session.shop,
        sectionId: sectionId,
      },
    },
  });

  return json({
    section: {
      ...section,
      tags: section.tags.map((st) => st.tag.name),
      categoryName: section.category.name,
    },
    alreadyPurchased: !!existingPurchase,
    shopDomain: session.shop,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const { sectionId } = params;

  if (!sectionId) {
    return json({ error: "Section ID required" }, { status: 400 });
  }

  // Get section
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });

  if (!section) {
    return json({ error: "Section not found" }, { status: 404 });
  }

  // Check if free section
  if (section.isFree) {
    // Create purchase record without charge
    await prisma.purchase.create({
      data: {
        shop: {
          connect: { shopDomain: session.shop },
        },
        section: {
          connect: { id: sectionId },
        },
        price: 0,
        chargeId: `free-${Date.now()}`,
        status: "completed",
      },
    });

    // Update section stats
    await prisma.section.update({
      where: { id: sectionId },
      data: {
        purchaseCount: {
          increment: 1,
        },
      },
    });

    return redirect("/app?purchased=" + sectionId);
  }

  // Create billing charge
  try {
    const charge = await billing.request({
      chargeName: `${section.name} Section`,
      amount: section.price,
      currencyCode: "USD",
      test: process.env.NODE_ENV !== "production",
    });

    // Store pending purchase
    await prisma.purchase.create({
      data: {
        shop: {
          connect: { shopDomain: session.shop },
        },
        section: {
          connect: { id: sectionId },
        },
        price: section.price,
        chargeId: charge.id,
        status: "pending",
      },
    });

    // Redirect to Shopify approval page
    return redirect(charge.confirmationUrl);
  } catch (error) {
    console.error("Billing error:", error);
    return json(
      { error: "Failed to create charge. Please try again." },
      { status: 500 }
    );
  }
};

export default function PurchaseSection() {
  const { section, alreadyPurchased } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  if (alreadyPurchased) {
    return (
      <AppLayout>
        <Page
          title="Already Purchased"
          backAction={{ onAction: () => navigate("/app") }}
        >
          <Layout>
            <Layout.Section>
              <Banner tone="success">
                <p>
                  You already own this section! Go to "My Sections" to install it.
                </p>
              </Banner>
              <Box paddingBlockStart="400">
                <Button onClick={() => navigate("/app")}>
                  Go to My Sections
                </Button>
              </Box>
            </Layout.Section>
          </Layout>
        </Page>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Page
        title="Purchase Section"
        backAction={{ onAction: () => navigate("/app/explore") }}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="400">
                {/* Section Info */}
                <div style={{ display: "flex", gap: "24px" }}>
                  <div
                    style={{
                      width: "200px",
                      height: "150px",
                      background: "#f6f6f7",
                      borderRadius: "8px",
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
                  <div style={{ flex: 1 }}>
                    <Text variant="headingXl" as="h2">
                      {section.name}
                    </Text>
                    <Box paddingBlockStart="200">
                      <Text variant="bodyLg" as="p">
                        {section.shortDescription}
                      </Text>
                    </Box>
                    <Box paddingBlockStart="200">
                      <Text variant="bodySm" as="p" tone="subdued">
                        Category: {section.categoryName}
                      </Text>
                    </Box>
                  </div>
                </div>

                {/* Description */}
                {section.longDescription && (
                  <Box paddingBlockStart="400">
                    <Text variant="headingMd" as="h3">
                      Description
                    </Text>
                    <Box paddingBlockStart="200">
                      <Text variant="bodyMd" as="p">
                        {section.longDescription}
                      </Text>
                    </Box>
                  </Box>
                )}

                {/* What's Included */}
                <Box paddingBlockStart="400">
                  <Text variant="headingMd" as="h3">
                    What's Included
                  </Text>
                  <Box paddingBlockStart="200">
                    <List>
                      <List.Item>
                        Complete Liquid section file ready to install
                      </List.Item>
                      <List.Item>
                        Customizable settings in theme editor
                      </List.Item>
                      <List.Item>Free updates and improvements</List.Item>
                      <List.Item>Compatible with all Shopify 2.0 themes</List.Item>
                      <List.Item>Full documentation and setup guide</List.Item>
                      <List.Item>30-day money-back guarantee</List.Item>
                    </List>
                  </Box>
                </Box>

                {/* Rating */}
                {section.reviewCount > 0 && (
                  <Box paddingBlockStart="400">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "24px" }}>⭐</span>
                      <Text variant="headingLg" as="p">
                        {section.rating.toFixed(1)}
                      </Text>
                      <Text variant="bodyMd" as="span" tone="subdued">
                        ({section.reviewCount} reviews)
                      </Text>
                    </div>
                  </Box>
                )}
              </Box>
            </Card>
          </Layout.Section>

          {/* Purchase Card */}
          <Layout.Section secondary>
            <Card>
              <Box padding="400">
                <Text variant="headingLg" as="h2">
                  Order Summary
                </Text>
                <Box paddingBlockStart="400">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <Text variant="bodyMd" as="span">
                      {section.name}
                    </Text>
                    <Text variant="bodyMd" as="span">
                      ${section.price.toFixed(2)}
                    </Text>
                  </div>
                  <Box
                    paddingBlockStart="300"
                    borderBlockStartWidth="025"
                    borderColor="border"
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text variant="headingMd" as="p">
                        Total
                      </Text>
                      <Text variant="headingLg" as="p">
                        {section.isFree ? "FREE" : `$${section.price.toFixed(2)}`}
                      </Text>
                    </div>
                  </Box>
                </Box>

                <Box paddingBlockStart="400">
                  <Form method="post">
                    <Button
                      submit
                      variant="primary"
                      size="large"
                      fullWidth
                    >
                      {section.isFree
                        ? "Get This Section"
                        : `Purchase for $${section.price.toFixed(2)}`}
                    </Button>
                  </Form>
                </Box>

                <Box paddingBlockStart="300">
                  <Text variant="bodySm" as="p" tone="subdued" alignment="center">
                    One-time payment. No recurring fees.
                  </Text>
                </Box>

                {!section.isFree && (
                  <Box paddingBlockStart="400">
                    <Banner tone="info">
                      <p>
                        <strong>30-Day Money-Back Guarantee</strong>
                        <br />
                        Not satisfied? Get a full refund within 30 days.
                      </p>
                    </Banner>
                  </Box>
                )}
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppLayout>
  );
}
