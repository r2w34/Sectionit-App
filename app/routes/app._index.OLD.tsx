import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, Text, EmptyState, Tabs, TextField, Icon } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import { authenticate } from "../lib/shopify.server";
import { prisma } from "../lib/db.server";
import { AppLayout } from "../components/layout/AppLayout";
import { SectionCard } from "../components/sections/SectionCard";
import { SectionPreviewModal } from "../components/sections/SectionPreviewModal";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Get shop from database
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    include: {
      purchases: {
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
      },
      installations: {
        where: { isActive: true },
        include: {
          section: true,
        },
      },
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
      },
    },
  });

  // Get purchased sections
  const purchasedSections = shop?.purchases.map((p) => ({
    ...p.section,
    tags: p.section.tags.map((st) => st.tag.name),
    categoryName: p.section.category.name,
    purchasedAt: p.purchasedAt,
  })) || [];

  // Get installed sections
  const installedSections = shop?.installations.map((i) => ({
    sectionId: i.sectionId,
    themeName: i.themeName,
    installedAt: i.installedAt,
  })) || [];

  // Get favorite sections
  const favoriteSections = shop?.favorites.map((f) => ({
    ...f.section,
    tags: f.section.tags.map((st) => st.tag.name),
    categoryName: f.section.category.name,
  })) || [];

  return json({
    purchasedSections,
    installedSections,
    favoriteSections,
    shopDomain,
  });
};

export default function AppIndex() {
  const { purchasedSections, installedSections, favoriteSections } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [previewSection, setPreviewSection] = useState<any>(null);

  const tabs = [
    {
      id: "all",
      content: `All Sections (${purchasedSections.length})`,
    },
    {
      id: "installed",
      content: `Installed (${installedSections.length})`,
    },
    {
      id: "favorites",
      content: `Favorites (${favoriteSections.length})`,
    },
  ];

  const handleTabChange = (selectedTabIndex: number) => {
    setSelectedTab(selectedTabIndex);
  };

  const handlePreview = (id: string) => {
    const section = purchasedSections.find((s) => s.id === id);
    setPreviewSection(section || null);
  };

  const handleInstall = (id: string) => {
    // Navigate to install flow
    navigate(`/app/install/${id}`);
  };

  const filteredSections = purchasedSections.filter((section) => {
    if (searchValue) {
      return (
        section.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        section.shortDescription.toLowerCase().includes(searchValue.toLowerCase()) ||
        section.tags.some((tag: string) => tag.toLowerCase().includes(searchValue.toLowerCase()))
      );
    }
    return true;
  });

  const getSectionsForTab = () => {
    switch (selectedTab) {
      case 1: // Installed
        return filteredSections.filter((s) =>
          installedSections.some((i) => i.sectionId === s.id)
        );
      case 2: // Favorites
        return favoriteSections.filter((s) =>
          searchValue
            ? s.name.toLowerCase().includes(searchValue.toLowerCase())
            : true
        );
      default: // All
        return filteredSections;
    }
  };

  const sectionsToDisplay = getSectionsForTab();

  return (
    <AppLayout>
      <Page
        title="My Sections"
        primaryAction={{
          content: "Browse More Sections",
          onAction: () => navigate("/app/explore"),
        }}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} />

              <div style={{ padding: "16px" }}>
                <TextField
                  label=""
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder="Search your sections..."
                  prefix={<Icon source={SearchIcon} />}
                  clearButton
                  onClearButtonClick={() => setSearchValue("")}
                  autoComplete="off"
                />
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section>
            {sectionsToDisplay.length === 0 ? (
              <Card>
                <EmptyState
                  heading={
                    purchasedSections.length === 0
                      ? "No sections yet"
                      : "No sections found"
                  }
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  {purchasedSections.length === 0 ? (
                    <>
                      <Text variant="bodyMd" as="p">
                        Browse our section library to find the perfect sections for your store.
                      </Text>
                      <div style={{ marginTop: "16px" }}>
                        <button
                          onClick={() => navigate("/app/explore")}
                          style={{
                            padding: "8px 16px",
                            background: "#008060",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          Explore Sections
                        </button>
                      </div>
                    </>
                  ) : (
                    <Text variant="bodyMd" as="p">
                      Try adjusting your search or filters.
                    </Text>
                  )}
                </EmptyState>
              </Card>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "20px",
                }}
              >
                {sectionsToDisplay.map((section) => (
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
                    isPurchased={true}
                    isFavorite={favoriteSections.some((f) => f.id === section.id)}
                    onPreview={handlePreview}
                    onInstall={handleInstall}
                  />
                ))}
              </div>
            )}
          </Layout.Section>
        </Layout>

        {/* Preview Modal */}
        <SectionPreviewModal
          isOpen={previewSection !== null}
          onClose={() => setPreviewSection(null)}
          section={previewSection}
          isPurchased={true}
          onPurchase={() => {}}
          onInstall={handleInstall}
        />
      </Page>
    </AppLayout>
  );
}
