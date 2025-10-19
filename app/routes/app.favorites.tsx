import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useSubmit } from "@remix-run/react";
import { Page, Layout, Card, EmptyState, Text, Box, Button, Badge } from "@shopify/polaris";
import { authenticate } from "../lib/shopify.server";
import { prisma } from "../lib/db.server";
import { AppLayout } from "../components/layout/AppLayout";
import { SectionCard } from "../components/sections/SectionCard";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
    include: {
      favorites: {
        include: {
          section: {
            include: {
              category: true,
              tags: {
                include: {
                  tag: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return json({
    favorites: shop?.favorites.map((f) => ({
      id: f.section.id,
      name: f.section.name,
      description: f.section.description,
      price: Number(f.section.price),
      category: f.section.category.name,
      tags: f.section.tags.map((t) => t.tag.name),
      demoUrl: f.section.demoUrl,
      thumbnailUrl: f.section.thumbnailUrl,
      isFree: f.section.isFree,
      isPro: f.section.isPro,
      addedAt: new Date(f.createdAt).toLocaleDateString(),
    })) || [],
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const sectionId = formData.get("sectionId") as string;
  const action = formData.get("_action") as string;

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    return json({ error: "Shop not found" });
  }

  if (action === "remove") {
    await prisma.favorite.deleteMany({
      where: {
        shopId: shop.id,
        sectionId,
      },
    });
  }

  return json({ success: true });
};

export default function Favorites() {
  const { favorites } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const removeFavorite = (sectionId: string) => {
    const formData = new FormData();
    formData.append("sectionId", sectionId);
    formData.append("_action", "remove");
    submit(formData, { method: "post" });
  };

  return (
    <AppLayout>
      <Page title="My Favorites">
        <Layout>
          {favorites.length === 0 ? (
            <Layout.Section>
              <Card>
                <EmptyState
                  heading="No favorites yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Save sections you like to quickly access them later.</p>
                  <Button url="/app/explore">Browse Sections</Button>
                </EmptyState>
              </Card>
            </Layout.Section>
          ) : (
            <>
              <Layout.Section>
                <Card>
                  <Box padding="400">
                    <Text variant="bodyMd" as="p">
                      You have {favorites.length} favorite {favorites.length === 1 ? "section" : "sections"}
                    </Text>
                  </Box>
                </Card>
              </Layout.Section>

              <Layout.Section>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {favorites.map((section) => (
                    <Card key={section.id}>
                      <Box padding="400">
                        <div style={{ marginBottom: "12px" }}>
                          {section.thumbnailUrl && (
                            <img
                              src={section.thumbnailUrl}
                              alt={section.name}
                              style={{
                                width: "100%",
                                height: "180px",
                                objectFit: "cover",
                                borderRadius: "8px",
                              }}
                            />
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                          {section.isFree && <Badge tone="success">Free</Badge>}
                          {section.isPro && <Badge tone="info">Pro</Badge>}
                        </div>

                        <Text variant="headingMd" as="h3">
                          {section.name}
                        </Text>

                        <Box paddingBlockStart="200">
                          <Text variant="bodySm" as="p" tone="subdued">
                            {section.category}
                          </Text>
                        </Box>

                        <Box paddingBlockStart="200">
                          <Text variant="bodyMd" as="p">
                            {section.description}
                          </Text>
                        </Box>

                        <Box paddingBlockStart="200">
                          <Text variant="bodyMd" as="p" fontWeight="semibold">
                            ${section.price.toFixed(2)}
                          </Text>
                        </Box>

                        <Box paddingBlockStart="200">
                          <Text variant="bodySm" as="p" tone="subdued">
                            Added {section.addedAt}
                          </Text>
                        </Box>

                        <Box paddingBlockStart="400">
                          <div style={{ display: "flex", gap: "8px" }}>
                            <Button url={`/app/section/${section.id}`}>View Details</Button>
                            <Button onClick={() => removeFavorite(section.id)} tone="critical">
                              Remove
                            </Button>
                          </div>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </div>
              </Layout.Section>
            </>
          )}
        </Layout>
      </Page>
    </AppLayout>
  );
}
