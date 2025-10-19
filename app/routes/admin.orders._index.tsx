import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Badge,
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

  // Get all purchases
  const purchases = await prisma.purchase.findMany({
    include: {
      section: true,
      shop: true,
    },
    orderBy: { purchasedAt: "desc" },
  });

  // Get time-based statistics
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const weekStart = new Date(now.setDate(now.getDate() - 7));
  const monthStart = new Date(now.setDate(now.getDate() - 30));

  const [todayOrders, weekOrders, monthOrders, todayRevenue, weekRevenue, monthRevenue] =
    await Promise.all([
      // Today's orders
      prisma.purchase.count({
        where: {
          status: "completed",
          purchasedAt: { gte: todayStart },
        },
      }),

      // This week's orders
      prisma.purchase.count({
        where: {
          status: "completed",
          purchasedAt: { gte: weekStart },
        },
      }),

      // This month's orders
      prisma.purchase.count({
        where: {
          status: "completed",
          purchasedAt: { gte: monthStart },
        },
      }),

      // Today's revenue
      prisma.purchase.aggregate({
        where: {
          status: "completed",
          purchasedAt: { gte: todayStart },
        },
        _sum: { price: true },
      }),

      // This week's revenue
      prisma.purchase.aggregate({
        where: {
          status: "completed",
          purchasedAt: { gte: weekStart },
        },
        _sum: { price: true },
      }),

      // This month's revenue
      prisma.purchase.aggregate({
        where: {
          status: "completed",
          purchasedAt: { gte: monthStart },
        },
        _sum: { price: true },
      }),
    ]);

  return json({
    admin: {
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    purchases,
    stats: {
      todayOrders,
      weekOrders,
      monthOrders,
      todayRevenue: todayRevenue._sum.price || 0,
      weekRevenue: weekRevenue._sum.price || 0,
      monthRevenue: monthRevenue._sum.price || 0,
    },
  });
};

export default function AdminOrders() {
  const { admin, purchases, stats } = useLoaderData<typeof loader>();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  const statusOptions = [
    { label: "All Orders", value: "all" },
    { label: "Completed", value: "completed" },
    { label: "Pending", value: "pending" },
    { label: "Failed", value: "failed" },
  ];

  const timeOptions = [
    { label: "All Time", value: "all" },
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
  ];

  // Filter purchases
  const filteredPurchases = purchases.filter((purchase) => {
    if (searchValue) {
      const matchesSearch =
        purchase.shop.shopDomain.toLowerCase().includes(searchValue.toLowerCase()) ||
        purchase.section.name.toLowerCase().includes(searchValue.toLowerCase());
      if (!matchesSearch) return false;
    }

    if (statusFilter !== "all" && purchase.status !== statusFilter) {
      return false;
    }

    if (timeFilter !== "all") {
      const purchaseDate = new Date(purchase.purchasedAt);
      const now = new Date();

      if (timeFilter === "today") {
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        if (purchaseDate < todayStart) return false;
      } else if (timeFilter === "week") {
        const weekStart = new Date(now.setDate(now.getDate() - 7));
        if (purchaseDate < weekStart) return false;
      } else if (timeFilter === "month") {
        const monthStart = new Date(now.setDate(now.getDate() - 30));
        if (purchaseDate < monthStart) return false;
      }
    }

    return true;
  });

  // Calculate filtered totals
  const filteredTotal = filteredPurchases.reduce((sum, p) => sum + p.price, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge tone="success">Completed</Badge>;
      case "pending":
        return <Badge tone="warning">Pending</Badge>;
      case "failed":
        return <Badge tone="critical">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Prepare table rows
  const rows = filteredPurchases.map((purchase) => [
    // Order ID
    <div>
      <div style={{ fontWeight: "500", fontSize: "12px", fontFamily: "monospace" }}>
        {purchase.id.substring(0, 8)}
      </div>
    </div>,

    // Date
    <div style={{ fontSize: "14px" }}>
      {new Date(purchase.purchasedAt).toLocaleString()}
    </div>,

    // Customer
    <div>
      <div style={{ fontWeight: "500" }}>{purchase.shop.shopDomain}</div>
    </div>,

    // Section
    <div>
      <div style={{ fontWeight: "500" }}>{purchase.section.name}</div>
      <div style={{ fontSize: "12px", color: "#637381" }}>
        {purchase.section.isFree ? "FREE" : `$${purchase.section.price}`}
      </div>
    </div>,

    // Amount
    <div style={{ fontWeight: "500", color: "#008060" }}>
      {purchase.price === 0 ? "FREE" : `$${purchase.price.toFixed(2)}`}
    </div>,

    // Status
    getStatusBadge(purchase.status),

    // Charge ID
    <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#637381" }}>
      {purchase.chargeId?.substring(0, 16)}...
    </div>,
  ]);

  return (
    <AdminLayout user={admin}>
      <Page title="Orders">
        <Layout>
          {/* Time-based Statistics */}
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
                  <div>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Today
                    </Text>
                    <Text variant="heading2xl" as="h2">
                      {stats.todayOrders}
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      ${stats.todayRevenue.toFixed(2)}
                    </Text>
                  </div>
                </Box>
              </Card>

              <Card>
                <Box padding="400">
                  <div>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      This Week
                    </Text>
                    <Text variant="heading2xl" as="h2">
                      {stats.weekOrders}
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      ${stats.weekRevenue.toFixed(2)}
                    </Text>
                  </div>
                </Box>
              </Card>

              <Card>
                <Box padding="400">
                  <div>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      This Month
                    </Text>
                    <Text variant="heading2xl" as="h2">
                      {stats.monthOrders}
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      ${stats.monthRevenue.toFixed(2)}
                    </Text>
                  </div>
                </Box>
              </Card>

              <Card>
                <Box padding="400">
                  <div>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      All Time
                    </Text>
                    <Text variant="heading2xl" as="h2">
                      {purchases.length}
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      ${purchases
                        .reduce((sum, p) => sum + p.price, 0)
                        .toFixed(2)}
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
                    placeholder="Search orders..."
                    prefix={<Icon source={SearchIcon} />}
                    clearButton
                    onClearButtonClick={() => setSearchValue("")}
                    autoComplete="off"
                  />
                  <Select
                    label=""
                    options={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                  />
                  <Select
                    label=""
                    options={timeOptions}
                    value={timeFilter}
                    onChange={setTimeFilter}
                  />
                </div>
              </div>
            </Card>
          </Layout.Section>

          {/* Filtered Stats */}
          {(searchValue || statusFilter !== "all" || timeFilter !== "all") && (
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text variant="bodyMd" as="p">
                      Showing {filteredPurchases.length} orders
                    </Text>
                    <Text variant="headingMd" as="p">
                      Total: ${filteredTotal.toFixed(2)}
                    </Text>
                  </div>
                </Box>
              </Card>
            </Layout.Section>
          )}

          {/* Orders Table */}
          <Layout.Section>
            <Card>
              {filteredPurchases.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                    📦
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "500",
                      marginBottom: "8px",
                    }}
                  >
                    No orders found
                  </div>
                  <div style={{ color: "#637381" }}>
                    {searchValue || statusFilter !== "all" || timeFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Orders will appear here once customers start purchasing"}
                  </div>
                </div>
              ) : (
                <DataTable
                  columnContentTypes={[
                    "text",
                    "text",
                    "text",
                    "text",
                    "numeric",
                    "text",
                    "text",
                  ]}
                  headings={[
                    "Order ID",
                    "Date",
                    "Customer",
                    "Section",
                    "Amount",
                    "Status",
                    "Charge ID",
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
