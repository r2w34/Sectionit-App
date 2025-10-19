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
} from "@shopify/polaris";
import { SearchIcon, PlusIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import { requireAdmin } from "../lib/admin-auth.server";
import { prisma } from "../lib/db.server";
import { AdminLayout } from "../components/layout/AdminLayout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const admin = await requireAdmin(request);

  // Get all sections with relationships
  const sections = await prisma.section.findMany({
    include: {
      category: true,
      _count: {
        select: {
          purchases: true,
          installations: true,
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get categories
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return json({
    admin: {
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    sections,
    categories,
  });
};

export default function AdminSections() {
  const { admin, sections, categories } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const categoryOptions = [
    { label: "All Categories", value: "all" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const statusOptions = [
    { label: "All Status", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Featured", value: "featured" },
  ];

  // Filter sections
  const filteredSections = sections.filter((section) => {
    if (searchValue) {
      const matchesSearch =
        section.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        section.slug.toLowerCase().includes(searchValue.toLowerCase());
      if (!matchesSearch) return false;
    }

    if (categoryFilter !== "all" && section.categoryId !== categoryFilter) {
      return false;
    }

    if (statusFilter === "active" && !section.isActive) return false;
    if (statusFilter === "inactive" && section.isActive) return false;
    if (statusFilter === "featured" && !section.isFeatured) return false;

    return true;
  });

  // Prepare table rows
  const rows = filteredSections.map((section) => [
    // Preview
    <div style={{ width: "60px", height: "45px", background: "#f6f6f7", borderRadius: "4px", overflow: "hidden" }}>
      <img
        src={section.previewImageUrl}
        alt={section.name}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>,
    
    // Name & Category
    <div>
      <div style={{ fontWeight: "500" }}>{section.name}</div>
      <div style={{ fontSize: "12px", color: "#637381" }}>{section.category.name}</div>
    </div>,
    
    // Price
    <div style={{ fontWeight: "500" }}>
      {section.isFree ? "FREE" : `$${section.price.toFixed(2)}`}
    </div>,
    
    // Stats
    <div style={{ fontSize: "12px" }}>
      <div>{section._count.purchases} sales</div>
      <div style={{ color: "#637381" }}>{section._count.installations} installs</div>
    </div>,
    
    // Rating
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <span>⭐</span>
      <span>{section.rating.toFixed(1)}</span>
      <span style={{ color: "#637381", fontSize: "12px" }}>
        ({section._count.reviews})
      </span>
    </div>,
    
    // Status
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {section.isActive ? (
        <Badge tone="success">Active</Badge>
      ) : (
        <Badge tone="critical">Inactive</Badge>
      )}
      {section.isFeatured && <Badge tone="info">Featured</Badge>}
      {section.isNew && <Badge>New</Badge>}
      {section.isTrending && <Badge tone="warning">Trending</Badge>}
    </div>,
    
    // Actions
    <div style={{ display: "flex", gap: "8px" }}>
      <Button
        size="slim"
        onClick={() => navigate(`/admin/sections/${section.id}`)}
      >
        Edit
      </Button>
      <Button
        size="slim"
        tone="critical"
        onClick={() => {
          if (confirm(`Delete "${section.name}"?`)) {
            // TODO: Implement delete
          }
        }}
      >
        Delete
      </Button>
    </div>,
  ]);

  return (
    <AdminLayout user={admin}>
      <Page
        title="Sections"
        primaryAction={{
          content: "Add Section",
          icon: PlusIcon,
          onAction: () => navigate("/admin/sections/new"),
        }}
      >
        <Layout>
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
                    placeholder="Search sections..."
                    prefix={<Icon source={SearchIcon} />}
                    clearButton
                    onClearButtonClick={() => setSearchValue("")}
                    autoComplete="off"
                  />
                  <Select
                    label=""
                    options={categoryOptions}
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                  />
                  <Select
                    label=""
                    options={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                  />
                </div>
              </div>
            </Card>
          </Layout.Section>

          {/* Statistics */}
          <Layout.Section>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "16px",
              }}
            >
              <Card>
                <div style={{ padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    {sections.length}
                  </div>
                  <div style={{ fontSize: "14px", color: "#637381" }}>
                    Total Sections
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    {sections.filter((s) => s.isActive).length}
                  </div>
                  <div style={{ fontSize: "14px", color: "#637381" }}>
                    Active
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    {sections.filter((s) => s.isFeatured).length}
                  </div>
                  <div style={{ fontSize: "14px", color: "#637381" }}>
                    Featured
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    {sections.filter((s) => s.isFree).length}
                  </div>
                  <div style={{ fontSize: "14px", color: "#637381" }}>Free</div>
                </div>
              </Card>
            </div>
          </Layout.Section>

          {/* Sections Table */}
          <Layout.Section>
            <Card>
              {filteredSections.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
                  <div style={{ fontSize: "18px", fontWeight: "500", marginBottom: "8px" }}>
                    No sections found
                  </div>
                  <div style={{ color: "#637381", marginBottom: "24px" }}>
                    {searchValue || categoryFilter !== "all" || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Add your first section to get started"}
                  </div>
                  {!searchValue && categoryFilter === "all" && statusFilter === "all" && (
                    <Button
                      variant="primary"
                      onClick={() => navigate("/admin/sections/new")}
                    >
                      Add Section
                    </Button>
                  )}
                </div>
              ) : (
                <DataTable
                  columnContentTypes={[
                    "text",
                    "text",
                    "text",
                    "text",
                    "text",
                    "text",
                    "text",
                  ]}
                  headings={[
                    "Preview",
                    "Name",
                    "Price",
                    "Stats",
                    "Rating",
                    "Status",
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
