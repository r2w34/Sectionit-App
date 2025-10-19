import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, Form } from "@remix-run/react";
import { Page, Layout, Card, DataTable, Button, Text, Badge, Box, Banner } from "@shopify/polaris";
import { requireAdmin } from "../lib/admin-auth.server";
import { prisma } from "../lib/db.server";
import { AdminLayout } from "../components/layout/AdminLayout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const admin = await requireAdmin(request);

  const bundles = await prisma.bundle.findMany({
    include: {
      items: {
        include: {
          section: true,
        },
      },
      _count: {
        select: {
          purchases: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return json({
    admin: {
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    bundles: bundles.map((bundle) => ({
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      price: bundle.price,
      discount: bundle.discount,
      isFeatured: bundle.isFeatured,
      isActive: bundle.isActive,
      itemCount: bundle.items.length,
      purchaseCount: bundle._count.purchases,
      createdAt: bundle.createdAt,
    })),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get("_action");
  const bundleId = formData.get("bundleId") as string;

  if (action === "toggle-active" && bundleId) {
    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
    });

    if (bundle) {
      await prisma.bundle.update({
        where: { id: bundleId },
        data: { isActive: !bundle.isActive },
      });
    }
  }

  if (action === "toggle-featured" && bundleId) {
    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
    });

    if (bundle) {
      await prisma.bundle.update({
        where: { id: bundleId },
        data: { isFeatured: !bundle.isFeatured },
      });
    }
  }

  if (action === "delete" && bundleId) {
    await prisma.bundle.delete({
      where: { id: bundleId },
    });
  }

  return json({ success: true });
};

export default function AdminBundles() {
  const { admin, bundles } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const rows = bundles.map((bundle) => [
    bundle.name,
    bundle.itemCount + " sections",
    "$" + bundle.price.toFixed(2),
    bundle.discount + "%",
    <Badge key={bundle.id} tone={bundle.isActive ? "success" : undefined}>
      {bundle.isActive ? "Active" : "Inactive"}
    </Badge>,
    <Badge key={`featured-${bundle.id}`} tone={bundle.isFeatured ? "info" : undefined}>
      {bundle.isFeatured ? "Featured" : "Normal"}
    </Badge>,
    bundle.purchaseCount + " sales",
    <div key={`actions-${bundle.id}`} style={{ display: "flex", gap: "8px" }}>
      <Form method="post">
        <input type="hidden" name="bundleId" value={bundle.id} />
        <input type="hidden" name="_action" value="toggle-active" />
        <Button submit size="slim">
          {bundle.isActive ? "Deactivate" : "Activate"}
        </Button>
      </Form>
      <Form method="post">
        <input type="hidden" name="bundleId" value={bundle.id} />
        <input type="hidden" name="_action" value="toggle-featured" />
        <Button submit size="slim">
          {bundle.isFeatured ? "Unfeature" : "Feature"}
        </Button>
      </Form>
      <Form
        method="post"
        onSubmit={(e) => {
          if (!confirm("Are you sure you want to delete this bundle?")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="bundleId" value={bundle.id} />
        <input type="hidden" name="_action" value="delete" />
        <Button submit size="slim" tone="critical">
          Delete
        </Button>
      </Form>
    </div>,
  ]);

  return (
    <AdminLayout user={admin}>
      <Page
        title="Bundles"
        primaryAction={{
          content: "Create Bundle",
          onAction: () => navigate("/admin/bundles/new"),
        }}
      >
        <Layout>
          <Layout.Section>
            <Banner tone="info">
              <p>
                Bundles allow you to group multiple sections together at a discounted price.
                Featured bundles appear on the merchant's bundle page.
              </p>
            </Banner>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <DataTable
                columnContentTypes={["text", "text", "numeric", "numeric", "text", "text", "numeric", "text"]}
                headings={["Name", "Items", "Price", "Discount", "Status", "Featured", "Sales", "Actions"]}
                rows={rows}
              />

              {bundles.length === 0 && (
                <Box padding="400">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    No bundles yet. Create your first bundle to offer discounted section packages.
                  </Text>
                </Box>
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AdminLayout>
  );
}
