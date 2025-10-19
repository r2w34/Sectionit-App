import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Tabs,
  Badge,
  Box,
  Button,
  TextField,
  Select,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../lib/shopify.server";
import { prisma } from "../lib/db.server";
import { AppLayout } from "../components/layout/AppLayout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Get feature requests
  const featureRequests = await prisma.featureRequest.findMany({
    orderBy: [
      { votes: "desc" },
      { createdAt: "desc" },
    ],
  });

  return json({
    featureRequests,
    shopDomain,
  });
};

export default function Roadmap() {
  const { featureRequests, shopDomain } = useLoaderData<typeof loader>();
  const [selectedTab, setSelectedTab] = useState(0);
  const [showSuggestForm, setShowSuggestForm] = useState(false);

  const tabs = [
    { id: "planned", content: "Planned" },
    { id: "in-progress", content: "In Progress" },
    { id: "completed", content: "Completed" },
    { id: "suggestions", content: "Suggestions" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planned":
        return <Badge tone="info">Planned</Badge>;
      case "in-progress":
        return <Badge tone="warning">In Progress</Badge>;
      case "completed":
        return <Badge tone="success">Completed</Badge>;
      case "suggested":
        return <Badge>Suggested</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filterRequestsByTab = () => {
    const tabId = tabs[selectedTab].id;
    return featureRequests.filter((req) => {
      if (tabId === "suggestions") return req.status === "suggested";
      return req.status === tabId;
    });
  };

  const filteredRequests = filterRequestsByTab();

  return (
    <AppLayout>
      <Page
        title="Roadmap & Suggestions"
        primaryAction={{
          content: "+ Suggest New Idea",
          onAction: () => setShowSuggestForm(!showSuggestForm),
        }}
      >
        <Layout>
          {/* Info Banner */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="bodyMd" as="p">
                  Have an idea for a new section or feature? Share it with us! Upvote ideas you'd like to see implemented. The most popular suggestions get prioritized.
                </Text>
              </Box>
            </Card>
          </Layout.Section>

          {/* Suggest Form */}
          {showSuggestForm && (
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <Text variant="headingLg" as="h2">
                    Suggest New Idea
                  </Text>
                  <Box paddingBlockStart="400">
                    <Form method="post">
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <TextField
                          label="Title"
                          name="title"
                          placeholder="Brief description of your idea"
                          autoComplete="off"
                        />
                        <TextField
                          label="Description"
                          name="description"
                          placeholder="Provide details about your suggestion"
                          multiline={4}
                          autoComplete="off"
                        />
                        <Select
                          label="Category"
                          name="category"
                          options={[
                            { label: "New Section", value: "section" },
                            { label: "App Feature", value: "feature" },
                            { label: "Improvement", value: "improvement" },
                            { label: "Bug Fix", value: "bug" },
                          ]}
                        />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <Button submit variant="primary">
                            Submit Idea
                          </Button>
                          <Button onClick={() => setShowSuggestForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </Form>
                  </Box>
                </Box>
              </Card>
            </Layout.Section>
          )}

          {/* Tabs */}
          <Layout.Section>
            <Card>
              <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
            </Card>
          </Layout.Section>

          {/* Feature Requests List */}
          <Layout.Section>
            {filteredRequests.length === 0 ? (
              <Card>
                <Box padding="400">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    No items in this category yet.
                  </Text>
                </Box>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {filteredRequests.map((request) => (
                  <Card key={request.id}>
                    <Box padding="400">
                      <div style={{ display: "flex", gap: "16px" }}>
                        {/* Votes */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            minWidth: "60px",
                          }}
                        >
                          <Button variant="plain" onClick={() => {}}>
                            ⬆
                          </Button>
                          <Text variant="headingMd" as="p">
                            {request.votes}
                          </Text>
                          <Text variant="bodySm" as="p" tone="subdued">
                            votes
                          </Text>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <Text variant="headingMd" as="h3">
                                {request.title}
                              </Text>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                          <Box paddingBlockStart="200">
                            <Text variant="bodyMd" as="p">
                              {request.description}
                            </Text>
                          </Box>
                          <Box paddingBlockStart="200">
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <Badge>{request.category}</Badge>
                              <Text variant="bodySm" as="span" tone="subdued">
                                Suggested by {request.shopDomain}
                              </Text>
                            </div>
                          </Box>
                        </div>
                      </div>
                    </Box>
                  </Card>
                ))}
              </div>
            )}
          </Layout.Section>
        </Layout>
      </Page>
    </AppLayout>
  );
}
