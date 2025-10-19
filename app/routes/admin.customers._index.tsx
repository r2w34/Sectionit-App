import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Badge,
  Button,
  TextField,
  Select,
  Icon,
  Text,
  Box,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import { requireAdmin } from "../lib/admin-auth.server";
import { prisma } from "../lib/db.server";
import { AdminLayout } from "../components/layout/AdminLayout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const admin = await requireAdmin(request);

  // Get all shops with their purchase and subscription info
  const shops = await prisma.shop.findMany({
    include: {
      purchases: {
        where: { status: "completed" },
      },
      subscriptions: {
        where: { status: { in: ["active", "trial"] } },
      },
      _count: {
        select: {
          purchases: {
            where: { status: "completed" },
          },
          installations: {
            where: { isActive: true },
          },
          favorites: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate total spent for each shop
  const shopsWithStats = shops.map((shop) => {
    const totalSpent = shop.purchases.reduce((sum, p) => sum + Number(p.price), 0);
    const hasActiveSubscription = shop.subscriptions.length > 0;
    const subscriptionStatus = shop.subscriptions[0]?.status || null;

    return {
      id: shop.id,
      shopDomain: shop.shopDomain,
      email: shop.email,
      createdAt: shop.createdAt.toISOString(),
      totalSpent,
      hasActiveSubscription,
      subscriptionStatus,
      purchaseCount: shop._count.purchases,
      installationCount: shop._count.installations,
      favoriteCount: shop._count.favorites,
    };
  });

  return json({
    admin: {
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    shops: shopsWithStats,
  });
};

export default function AdminCustomers() {
  const { admin, shops } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const subscriptionOptions = [
    { label: "All Customers", value: "all" },
    { label: "Plus Members", value: "plus" },
    { label: "Free Plan", value: "free" },
  ];

  const sortOptions = [
    { label: "Newest First", value: "newest" },
    { label: "Highest Spent", value: "spending" },
    { label: "Most Purchases", value: "purchases" },
  ];

  // Filter shops
  const filteredShops = shops.filter((shop) => {
    if (searchValue) {
      const matchesSearch = shop.shopDomain
        .toLowerCase()
        .includes(searchValue.toLowerCase());
      if (!matchesSearch) return false;
    }

    if (subscriptionFilter === "plus" && !shop.hasActiveSubscription) return false;
    if (subscriptionFilter === "free" && shop.hasActiveSubscription) return false;

    return true;
  });

  // Sort shops
  const sortedShops = [...filteredShops].sort((a, b) => {
    switch (sortBy) {
      case "spending":
        return b.totalSpent - a.totalSpent;
      case "purchases":
        return b.purchaseCount - a.purchaseCount;
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Calculate statistics
  const totalCustomers = shops.length;
  const plusMembers = shops.filter((s) => s.hasActiveSubscription).length;
  const totalRevenue = shops.reduce((sum, s) => sum + s.totalSpent, 0);
  const avgSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  // Prepare table rows
  const rows = sortedShops.map((shop) => [
    // Store Domain
    <div>
      <div style={{ fontWeight: "500" }}>{shop.shopDomain}</div>
      <div style={{ fontSize: "12px", color: "#637381" }}>
        Member since {new Date(shop.createdAt).toLocaleDateString()}
      </div>
    </div>,

    // Status
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {shop.isActive ? (
        <Badge tone="success">Active</Badge>
      ) : (
        <Badge tone="critical">Inactive</Badge>
      )}
      {shop.hasActiveSubscription && (
        <Badge tone="magic">
          Plus {shop.subscriptionStatus === "trial" ? "(Trial)" : ""}
        </Badge>
      )}
    </div>,

    // Purchases
    <div>
      <div style={{ fontWeight: "500" }}>{shop.purchaseCount}</div>
      <div style={{ fontSize: "12px", color: "#637381" }}>
        {shop.installationCount} installed
      </div>
    </div>,

    // Total Spent
    <div style={{ fontWeight: "500", color: "#008060" }}>
      ${shop.totalSpent.toFixed(2)}
    </div>,

    // Engagement
    <div style={{ fontSize: "12px" }}>
      <div>{shop.favoriteCount} favorites</div>
      <div style={{ color: "#637381" }}>
        Last active: {new Date(shop.updatedAt).toLocaleDateString()}
      </div>
    </div>,

    // Actions
    <div style={{ display: "flex", gap: "8px" }}>
      <Button
        size="slim"
        onClick={() => navigate(`/admin/customers/${shop.id}`)}
      >
        View Details
      </Button>
    </div>,
  ]);

  return (
    <AdminLayout user={admin}>
      <Page title="Customers">
        <Layout>
          {/* Statistics */}
          <Layout.Section>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <Card>
                <Box padding="400">
                  <div style={{ textAlign: "center" }}>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Total Customers
                    </Text>
                    <Text variant="heading2xl" as="h2">
                      {totalCustomers}
                    </Text>
                  </div>
                </Box>
              </Card>

              <Card>
                <Box padding="400">
                  <div style={{ textAlign: "center" }}>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Plus Members
                    </Text>
                    <Text variant="heading2xl" as="h2">
                      {plusMembers}
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      {totalCustomers > 0
                        ? ((plusMembers / totalCustomers) * 100).toFixed(0)
                        : 0}
                      % conversion
                    </Text>
                  </div>
                </Box>
              </Card>

              <Card>
                <Box padding="400">
                  <div style={{ textAlign: "center" }}>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Total Revenue
                    </Text>
                    <Text variant="heading2xl" as="h2">
                      ${totalRevenue.toFixed(2)}
                    </Text>
                  </div>
                </Box>
              </Card>

              <Card>
                <Box padding="400">
                  <div style={{ textAlign: "center" }}>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Avg. Spent
                    </Text>
                    <Text variant="heading2xl" as="h2">
                      ${avgSpent.toFixed(2)}
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      per customer
                    </Text>
                  </div>
                </Box>
              </Card>
            </div>
          </Layout.Section>

          {/* Filters */}
          <Layout.Section>
            <Card>
              <div style={{ padding: "16px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <TextField
                    label=""
                    value={searchValue}
                    onChange={setSearchValue}
                    placeholder="Search by store domain..."
                    prefix={<Icon source={SearchIcon} />}
                    clearButton
                    onClearButtonClick={() => setSearchValue("")}
                    autoComplete="off"
                  />
                  <Select
                    label=""
                    options={subscriptionOptions}
                    value={subscriptionFilter}
                    onChange={setSubscriptionFilter}
                  />
                  <Select
                    label=""
                    options={sortOptions}
                    value={sortBy}
                    onChange={setSortBy}
                  />
                </div>
              </div>
            </Card>
          </Layout.Section>

          {/* Customers Table */}
          <Layout.Section>
            <Card>
              {sortedShops.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                    👥
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "500",
                      marginBottom: "8px",
                    }}
                  >
                    No customers found
                  </div>
                  <div style={{ color: "#637381" }}>
                    {searchValue || subscriptionFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Customers will appear here once they install the app"}
                  </div>
                </div>
              ) : (
                <DataTable
                  columnContentTypes={[
                    "text",
                    "text",
                    "numeric",
                    "numeric",
                    "text",
                    "text",
                  ]}
                  headings={[
                    "Store",
                    "Status",
                    "Purchases",
                    "Total Spent",
                    "Engagement",
                    "Actions",
                  ]}
                  rows={rows}
                />
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AdminLayout>
  );
}
