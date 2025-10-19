import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Tabs,
  TextField,
  Icon,
  Button,
  ButtonGroup,
  Select,
} from "@shopify/polaris";
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

  // Get URL params for filtering
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const priceRange = url.searchParams.get("price");
  const search = url.searchParams.get("search");

  // Get all active sections
  const sections = await prisma.section.findMany({
    where: {
      isActive: true,
      ...(category && category !== "all" ? { categoryId: category } : {}),
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
      { isTrending: "desc" },
      { purchaseCount: "desc" },
    ],
  });

  // Get categories for filter
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  // Get tags for filter
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  // Get user's purchases and favorites
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
  const transformedSections = sections.map((s) => ({
    ...s,
    tags: s.tags.map((st) => st.tag.name),
    categoryName: s.category.name,
    isPurchased: purchasedSectionIds.includes(s.id),
    isFavorite: favoriteSectionIds.includes(s.id),
  }));

  return json({
    sections: transformedSections,
    categories,
    tags,
    shopDomain,
  });
};

export default function ExploreSections() {
  const { sections, categories, tags } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedPriceRange, setSelectedPriceRange] = useState(searchParams.get("price") || "all");
  const [sortBy, setSortBy] = useState("popular");
  const [previewSection, setPreviewSection] = useState<any>(null);

  const tabs = [
    { id: "popular", content: "Popular" },
    { id: "trending", content: "Trending" },
    { id: "newest", content: "Newest" },
    { id: "free", content: "Free" },
    { id: "all", content: "All Sections" },
  ];

  const categoryOptions = [
    { label: "All Categories", value: "all" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const priceOptions = [
    { label: "All Prices", value: "all" },
    { label: "Free", value: "free" },
    { label: "$1 - $19", value: "1-19" },
    { label: "$20 - $39", value: "20-39" },
    { label: "$40+", value: "40+" },
  ];

  const sortOptions = [
    { label: "Most Popular", value: "popular" },
    { label: "Highest Rated", value: "rating" },
    { label: "Newest First", value: "newest" },
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
  ];

  // Quick filter tags (popular categories)
  const quickFilters = [
    { label: "Hero", icon: "🎯" },
    { label: "Testimonials", icon: "💬" },
    { label: "FAQ", icon: "❓" },
    { label: "Products", icon: "🛍️" },
    { label: "Videos", icon: "🎥" },
    { label: "Sliders", icon: "🎠" },
    { label: "Reviews", icon: "⭐" },
    { label: "Trust", icon: "🛡️" },
  ];

  const handleTabChange = (selectedTabIndex: number) => {
    setSelectedTab(selectedTabIndex);
  };

  const handlePreview = (id: string) => {
    const section = sections.find((s) => s.id === id);
    setPreviewSection(section || null);
  };

  const handlePurchase = (id: string) => {
    navigate(`/app/purchase/${id}`);
  };

  const handleToggleFavorite = async (id: string) => {
    // TODO: Implement favorite toggle via API
    console.log("Toggle favorite:", id);
  };

  // Filter sections based on tab
  const filterByTab = (sections: any[]) => {
    const tabId = tabs[selectedTab].id;
    switch (tabId) {
      case "popular":
        return sections.sort((a, b) => b.purchaseCount - a.purchaseCount);
      case "trending":
        return sections.filter((s) => s.isTrending);
      case "newest":
        return sections.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "free":
        return sections.filter((s) => s.isFree);
      default:
        return sections;
    }
  };

  // Filter sections based on search and filters
  const filteredSections = filterByTab(sections).filter((section) => {
    // Search filter
    if (searchValue) {
      const matchesSearch =
        section.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        section.shortDescription.toLowerCase().includes(searchValue.toLowerCase()) ||
        section.tags.some((tag: string) =>
          tag.toLowerCase().includes(searchValue.toLowerCase())
        );
      if (!matchesSearch) return false;
    }

    // Category filter
    if (selectedCategory !== "all" && section.categoryId !== selectedCategory) {
      return false;
    }

    // Price filter
    if (selectedPriceRange !== "all") {
      if (selectedPriceRange === "free" && !section.isFree) return false;
      if (selectedPriceRange === "1-19" && (section.price < 1 || section.price > 19))
        return false;
      if (selectedPriceRange === "20-39" && (section.price < 20 || section.price > 39))
        return false;
      if (selectedPriceRange === "40+" && section.price < 40) return false;
    }

    return true;
  });

  // Sort sections
  const sortedSections = [...filteredSections].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.purchaseCount - a.purchaseCount;
      case "rating":
        return b.rating - a.rating;
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      default:
        return 0;
    }
  });

  return (
    <AppLayout>
      <Page title="Explore Sections">
        <Layout>
          {/* Filters */}
          <Layout.Section>
            <Card>
              <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} />

              <div style={{ padding: "16px" }}>
                {/* Search */}
                <TextField
                  label=""
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder="Search sections..."
                  prefix={<Icon source={SearchIcon} />}
                  clearButton
                  onClearButtonClick={() => setSearchValue("")}
                  autoComplete="off"
                />

                {/* Quick Filters */}
                <div style={{ marginTop: "16px" }}>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Quick Filters
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "8px",
                    }}
                  >
                    {quickFilters.map((filter) => (
                      <button
                        key={filter.label}
                        onClick={() => setSearchValue(filter.label)}
                        style={{
                          padding: "8px 12px",
                          background: "#f6f6f7",
                          border: "1px solid #e1e3e5",
                          borderRadius: "8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "14px",
                        }}
                      >
                        <span>{filter.icon}</span>
                        <span>{filter.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Filters */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                    marginTop: "16px",
                  }}
                >
                  <Select
                    label="Category"
                    options={categoryOptions}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                  />
                  <Select
                    label="Price Range"
                    options={priceOptions}
                    value={selectedPriceRange}
                    onChange={setSelectedPriceRange}
                  />
                  <Select
                    label="Sort By"
                    options={sortOptions}
                    value={sortBy}
                    onChange={setSortBy}
                  />
                </div>
              </div>
            </Card>
          </Layout.Section>

          {/* Results Count */}
          <Layout.Section>
            <div style={{ marginBottom: "16px" }}>
              <Text variant="bodyMd" as="p">
                Showing {sortedSections.length} of {sections.length} sections
              </Text>
            </div>
          </Layout.Section>

          {/* Sections Grid */}
          <Layout.Section>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {sortedSections.map((section) => (
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
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
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
