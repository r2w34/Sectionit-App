import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Text, Box } from "@shopify/polaris";
import { requireAdmin } from "../lib/admin-auth.server";
import { prisma } from "../lib/db.server";
import { AdminLayout } from "../components/layout/AdminLayout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const admin = await requireAdmin(request);

  // Get dashboard statistics
  const [
    totalSections,
    activeSections,
    totalCustomers,
    totalOrders,
    totalRevenue,
    ordersToday,
    revenueToday,
    recentOrders,
    topSections,
  ] = await Promise.all([
    // Total sections
    prisma.section.count(),
    
    // Active sections
    prisma.section.count({ where: { isActive: true } }),
    
    // Total customers (shops)
    prisma.shop.count(),
    
    // Total orders (purchases)
    prisma.purchase.count({ where: { status: "completed" } }),
    
    // Total revenue
    prisma.purchase.aggregate({
      where: { status: "completed" },
      _sum: { price: true },
    }),
    
    // Orders today
    prisma.purchase.count({
      where: {
        status: "completed",
        purchasedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    
    // Revenue today
    prisma.purchase.aggregate({
      where: {
        status: "completed",
        purchasedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _sum: { price: true },
    }),
    
    // Recent orders
    prisma.purchase.findMany({
      where: { status: "completed" },
      include: {
        section: true,
        shop: true,
      },
      orderBy: { purchasedAt: "desc" },
      take: 10,
    }),
    
    // Top sections
    prisma.section.findMany({
      where: { isActive: true },
      orderBy: { purchaseCount: "desc" },
      take: 5,
    }),
  ]);

  return json({
    admin: {
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    stats: {
      totalSections,
      activeSections,
      totalCustomers,
      totalOrders,
      totalRevenue: totalRevenue._sum.price || 0,
      ordersToday,
      revenueToday: revenueToday._sum.price || 0,
    },
    recentOrders,
    topSections,
  });
};

export default function AdminDashboard() {
  const { admin, stats, recentOrders, topSections } = useLoaderData<typeof loader>();

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      subtitle: `$${stats.revenueToday.toFixed(2)} today`,
      color: "#008060",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      subtitle: `${stats.ordersToday} today`,
      color: "#5C6AC4",
    },
    {
      title: "Active Sections",
      value: stats.activeSections.toString(),
      subtitle: `${stats.totalSections} total`,
      color: "#47C1BF",
    },
    {
      title: "Customers",
      value: stats.totalCustomers.toString(),
      subtitle: "Active stores",
      color: "#FFC453",
    },
  ];

  return (
    <AdminLayout user={admin}>
      <Page title="Dashboard">
        <Layout>
          {/* Stats Cards */}
          <Layout.Section>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              {statCards.map((stat) => (
                <Card key={stat.title}>
                  <Box padding="400">
                    <div
                      style={{
                        borderLeft: `4px solid ${stat.color}`,
                        paddingLeft: "16px",
                      }}
                    >
                      <Text variant="bodyMd" as="p" tone="subdued">
                        {stat.title}
                      </Text>
                      <Text variant="heading2xl" as="h2">
                        {stat.value}
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        {stat.subtitle}
                      </Text>
                    </div>
                  </Box>
                </Card>
              ))}
            </div>
          </Layout.Section>

          {/* Top Sections */}
          <Layout.Section oneHalf>
            <Card>
              <Box padding="400">
                <Text variant="headingLg" as="h3">
                  Top Selling Sections
                </Text>
                <Box paddingBlockStart="400">
                  {topSections.length === 0 ? (
                    <Text variant="bodyMd" as="p" tone="subdued">
                      No data yet
                    </Text>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {topSections.map((section, index) => (
                        <div
                          key={section.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px",
                            background: "#f6f6f7",
                            borderRadius: "8px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                background: "#008060",
                                color: "white",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                              }}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <Text variant="bodyMd" as="p">
                                {section.name}
                              </Text>
                              <Text variant="bodySm" as="p" tone="subdued">
                                {section.purchaseCount} sales
                              </Text>
                            </div>
                          </div>
                          <Text variant="bodyMd" as="p">
                            ${section.price.toFixed(2)}
                          </Text>
                        </div>
                      ))}
                    </div>
                  )}
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          {/* Recent Orders */}
          <Layout.Section oneHalf>
            <Card>
              <Box padding="400">
                <Text variant="headingLg" as="h3">
                  Recent Orders
                </Text>
                <Box paddingBlockStart="400">
                  {recentOrders.length === 0 ? (
                    <Text variant="bodyMd" as="p" tone="subdued">
                      No orders yet
                    </Text>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {recentOrders.map((order) => (
                        <div
                          key={order.id}
                          style={{
                            padding: "12px",
                            border: "1px solid #e1e3e5",
                            borderRadius: "8px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                              <Text variant="bodyMd" as="p">
                                {order.section.name}
                              </Text>
                              <Text variant="bodySm" as="p" tone="subdued">
                                {order.shop.shopDomain}
                              </Text>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <Text variant="bodyMd" as="p">
                                ${order.price.toFixed(2)}
                              </Text>
                              <Text variant="bodySm" as="p" tone="subdued">
                                {new Date(order.purchasedAt).toLocaleDateString()}
                              </Text>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Box>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AdminLayout>
  );
}
