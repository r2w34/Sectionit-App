import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, Text, Button, Banner, Box } from "@shopify/polaris";
import { authenticate } from "../lib/shopify.server";
import { AppLayout } from "../components/layout/AppLayout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const sectionId = url.searchParams.get("section_id");
  const reason = url.searchParams.get("reason") || "cancelled";

  return json({
    sectionId,
    reason,
    shopDomain: session.shop,
  });
};

export default function BillingCancel() {
  const { sectionId, reason } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const getMessage = () => {
    switch (reason) {
      case "declined":
        return {
          title: "Payment Declined",
          message: "Your payment was declined. Please check your payment method and try again.",
        };
      case "failed":
        return {
          title: "Payment Failed",
          message: "There was an error processing your payment. Please try again.",
        };
      case "cancelled":
      default:
        return {
          title: "Purchase Cancelled",
          message: "You cancelled the purchase. No charges have been made.",
        };
    }
  };

  const { title, message } = getMessage();

  return (
    <AppLayout>
      <Page title={title}>
        <Layout>
          <Layout.Section>
            <Banner tone="warning">
              <p>{message}</p>
            </Banner>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingMd" as="h3">
                  What would you like to do?
                </Text>

                <Box paddingBlockStart="400">
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {sectionId && (
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/app/purchase/${sectionId}`)}
                      >
                        Try Again
                      </Button>
                    )}
                    <Button onClick={() => navigate("/app/explore")}>
                      Continue Browsing
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
                  Having Issues?
                </Text>
                <Box paddingBlockStart="300">
                  <Text variant="bodyMd" as="p">
                    If you're experiencing payment issues:
                  </Text>
                  <Box paddingBlockStart="200">
                    <ul style={{ paddingLeft: "20px" }}>
                      <li>Verify your payment method is active</li>
                      <li>Check your Shopify billing settings</li>
                      <li>Contact your bank if the issue persists</li>
                      <li>Reach out to our support team for assistance</li>
                    </ul>
                  </Box>
                </Box>
                <Box paddingBlockStart="400">
                  <Button onClick={() => navigate("/app/help")}>
                    Contact Support
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
