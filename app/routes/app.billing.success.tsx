import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, Text, Button, Banner, Box } from "@shopify/polaris";
import { useEffect } from "react";
import { authenticate } from "../lib/shopify.server";
import { prisma } from "../lib/db.server";
import { AppLayout } from "../components/layout/AppLayout";
import { useToast } from "../components/common/Toast";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const chargeId = url.searchParams.get("charge_id");

  if (!chargeId) {
    return redirect("/app");
  }

  // Find the purchase with this charge ID
  const purchase = await prisma.purchase.findFirst({
    where: {
      chargeId: chargeId,
      shop: { shopDomain: session.shop },
    },
    include: {
      section: true,
    },
  });

  if (!purchase) {
    return redirect("/app");
  }

  // Update purchase status to completed
  if (purchase.status === "pending") {
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { status: "completed" },
    });

    // Update section purchase count
    await prisma.section.update({
      where: { id: purchase.sectionId },
      data: {
        purchaseCount: {
          increment: 1,
        },
      },
    });
  }

  return json({
    purchase: {
      ...purchase,
      section: {
        id: purchase.section.id,
        name: purchase.section.name,
        price: purchase.section.price,
        previewImageUrl: purchase.section.previewImageUrl,
      },
    },
    shopDomain: session.shop,
  });
};

export default function BillingSuccess() {
  const { purchase } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    showToast(`Successfully purchased ${purchase.section.name}!`, { error: false });
  }, []);

  return (
    <AppLayout>
      <Page title="Purchase Successful!">
        <Layout>
          <Layout.Section>
            <Banner tone="success">
              <p>
                <strong>Payment Successful!</strong> Your purchase has been completed.
              </p>
            </Banner>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="400">
                <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                  <div
                    style={{
                      width: "150px",
                      height: "112px",
                      background: "#f6f6f7",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={purchase.section.previewImageUrl}
                      alt={purchase.section.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <Text variant="headingLg" as="h2">
                      {purchase.section.name}
                    </Text>
                    <Box paddingBlockStart="200">
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Purchase ID: {purchase.id.substring(0, 8)}
                      </Text>
                    </Box>
                    <Box paddingBlockStart="200">
                      <Text variant="headingMd" as="p">
                        ${purchase.price.toFixed(2)}
                      </Text>
                    </Box>
                  </div>
                </div>
              </Box>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingMd" as="h3">
                  What's Next?
                </Text>
                <Box paddingBlockStart="300">
                  <ol style={{ paddingLeft: "20px" }}>
                    <li style={{ marginBottom: "8px" }}>
                      Install the section to your theme
                    </li>
                    <li style={{ marginBottom: "8px" }}>
                      Customize it in your theme editor
                    </li>
                    <li style={{ marginBottom: "8px" }}>
                      Publish your changes when ready
                    </li>
                  </ol>
                </Box>

                <Box paddingBlockStart="400">
                  <div style={{ display: "flex", gap: "12px" }}>
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/app/install/${purchase.section.id}`)}
                    >
                      Install to Theme
                    </Button>
                    <Button onClick={() => navigate("/app")}>
                      Go to My Sections
                    </Button>
                  </div>
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingMd" as="h3">
                  Need Help?
                </Text>
                <Box paddingBlockStart="300">
                  <Text variant="bodyMd" as="p">
                    Check out our Help Center for installation guides and tutorials.
                    If you need assistance, our support team is here to help!
                  </Text>
                </Box>
                <Box paddingBlockStart="400">
                  <Button onClick={() => navigate("/app/help")}>
                    Visit Help Center
                  </Button>
                </Box>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppLayout>
  );
}
