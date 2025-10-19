import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Text, Box } from "@shopify/polaris";
import { requireAdmin } from "../lib/admin-auth.server";
import { prisma } from "../lib/db.server";
import { AdminLayout } from "../components/layout/AdminLayout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const admin = await requireAdmin(request);

  // Get analytics data
  const [
    totalRevenue,
    totalOrders,
    totalCustomers,
    revenueByMonth,
    topSections,
    revenueByCategory,
  ] = await Promise.all([
    // Total revenue
    prisma.purchase.aggregate({
      where: { status: "completed" },
      _sum: { price: true },
    }),
    
    // Total orders
    prisma.purchase.count({ where: { status: "completed" } }),
    
    // Total customers
    prisma.shop.count(),
    
    // Revenue by month (last 6 months)
    prisma.purchase.groupBy({
      by: ["purchasedAt"],
      where: {
        status: "completed",
        purchasedAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        },
      },
      _sum: { price: true },
    }),
    
    // Top selling sections
    prisma.section.findMany({
      take: 10,
      orderBy: { purchaseCount: "desc" },
      select: {
        name: true,
        purchaseCount: true,
        price: true,
      },
    }),
    
    // Revenue by category
    prisma.category.findMany({
      include: {
        sections: {
          select: {
            purchases: {
              where: { status: "completed" },
              select: { price: true },
            },
          },
        },
      },
    }),
  ]);

  return json({
    admin: {
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    analytics: {
      totalRevenue: Number(totalRevenue._sum.price) || 0,
      totalOrders,
      totalCustomers,
      topSections: topSections.map(s => ({
        name: s.name,
        purchaseCount: s.purchaseCount,
        price: Number(s.price) || 0,
      })),
      revenueByCategory: revenueByCategory.map((cat) => ({
        name: cat.name,
        revenue: cat.sections.reduce(
          (sum, section) =>
            sum + section.purchases.reduce((s, p) => s + Number(p.price), 0),
          0
        ),
      })),
    },
  });
};

export default function AdminAnalytics() {
  const { admin, analytics } = useLoaderData<typeof loader>();

  return (
    <AdminLayout user={admin}>
      <Page title="Analytics">
        <Layout>
          <Layout.Section>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
              <Card>
                <Box padding="400">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Total Revenue
                  </Text>
                  <Text variant="heading2xl" as="h2">
                    ${analytics.totalRevenue.toFixed(2)}
                  </Text>
                </Box>
              </Card>

              <Card>
                <Box padding="400">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Total Orders
                  </Text>
                  <Text variant="heading2xl" as="h2">
                    {analytics.totalOrders}
                  </Text>
                </Box>
              </Card>

              <Card>
                <Box padding="400">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Total Customers
                  </Text>
                  <Text variant="heading2xl" as="h2">
                    {analytics.totalCustomers}
                  </Text>
                </Box>
              </Card>
            </div>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingMd" as="h3">
                  Top Selling Sections
                </Text>
                <Box paddingBlockStart="400">
                  {analytics.topSections.map((section, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "12px 0",
                        borderBottom: index < analytics.topSections.length - 1 ? "1px solid #e1e3e5" : "none",
                      }}
                    >
                      <div>
                        <Text variant="bodyMd" as="p" fontWeight="semibold">
                          {section.name}
                        </Text>
                        <Text variant="bodySm" as="p" tone="subdued">
                          {section.purchaseCount} sales
                        </Text>
                      </div>
                      <Text variant="bodyMd" as="p">
                        ${section.price.toFixed(2)}
                      </Text>
                    </div>
                  ))}

                  {analytics.topSections.length === 0 && (
                    <Text variant="bodyMd" as="p" tone="subdued">
                      No sales data yet
                    </Text>
                  )}
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingMd" as="h3">
                  Revenue by Category
                </Text>
                <Box paddingBlockStart="400">
                  {analytics.revenueByCategory.length > 0 ? (
                    <>
                      {analytics.revenueByCategory.map((category, index) => {
                        const maxRevenue = Math.max(...analytics.revenueByCategory.map(c => c.revenue));
                        const percentage = maxRevenue > 0 ? (category.revenue / maxRevenue) * 100 : 0;
                        
                        return (
                          <div key={index} style={{ marginBottom: "16px" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "8px",
                              }}
                            >
                              <Text variant="bodyMd" as="p">
                                {category.name}
                              </Text>
                              <Text variant="bodyMd" as="p" fontWeight="semibold">
                                ${category.revenue.toFixed(2)}
                              </Text>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                height: "8px",
                                backgroundColor: "#e1e3e5",
                                borderRadius: "4px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${percentage}%`,
                                  height: "100%",
                                  backgroundColor: "#008060",
                                  transition: "width 0.3s ease",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <Text variant="bodyMd" as="p" tone="subdued">
                      No revenue data yet
                    </Text>
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
