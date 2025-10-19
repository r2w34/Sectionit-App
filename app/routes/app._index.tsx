import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  Box,
} from "@shopify/polaris";
import { authenticate } from "../lib/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  return json({
    shop: session.shop,
  });
};

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <Page title="Section Store">
      <Layout>
        <Layout.Section>
          <Card>
            <Box padding="400">
              <div style={{ marginBottom: "20px" }}>
                <Text as="h2" variant="headingLg">
                  Welcome to Section Store! 🎉
                </Text>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <Text variant="bodyMd" as="p">
                  Browse and install premium Shopify theme sections for your store: {shop}
                </Text>
              </div>
              <div style={{ marginTop: "20px" }}>
                <Button variant="primary" onClick={() => navigate("/app/explore")}>
                  Browse Sections
                </Button>
              </div>
            </Box>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Box padding="400">
              <Text as="h3" variant="headingMd">
                Quick Start
              </Text>
              <div style={{ marginTop: "12px" }}>
                <Text as="p" variant="bodyMd">
                  • Explore our collection of sections
                </Text>
                <Text as="p" variant="bodyMd">
                  • Purchase sections for your store
                </Text>
                <Text as="p" variant="bodyMd">
                  • Install directly to your theme
                </Text>
              </div>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
