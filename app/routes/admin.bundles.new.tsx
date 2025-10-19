import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Box,
  Text,
  ResourceList,
  ResourceItem,
  Checkbox,
} from "@shopify/polaris";
import { useState } from "react";
import { requireAdmin } from "../lib/admin-auth.server";
import { prisma } from "../lib/db.server";
import { AdminLayout } from "../components/layout/AdminLayout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const admin = await requireAdmin(request);

  // Get all active sections for bundle creation
  const sections = await prisma.section.findMany({
    where: { isActive: true },
    include: {
      category: true,
    },
    orderBy: { name: "asc" },
  });

  return json({
    admin: {
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    sections: sections.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category.name,
      price: Number(s.price),
    })),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const admin = await requireAdmin(request);
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const discount = parseFloat(formData.get("discount") as string);
  const isFeatured = formData.get("isFeatured") === "on";
  const selectedSections = formData.getAll("sections") as string[];

  if (!name || !price || selectedSections.length === 0) {
    return json({
      error: "Please fill in all required fields and select at least one section",
    });
  }

  try {
    // Create the bundle
    const bundle = await prisma.bundle.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description: description || "",
        price,
        discount: discount || 0,
        isFeatured,
        isActive: true,
        items: {
          create: selectedSections.map((sectionId, index) => ({
            sectionId,
            order: index,
          })),
        },
      },
    });

    return redirect("/admin/bundles");
  } catch (error) {
    return json({ error: "Failed to create bundle. Please try again." });
  }
};

export default function NewBundle() {
  const { admin, sections } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("20");
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const calculateBundlePrice = () => {
    const totalPrice = sections
      .filter((s) => selectedSections.includes(s.id))
      .reduce((sum, s) => sum + s.price, 0);
    return totalPrice;
  };

  const suggestPrice = () => {
    const totalPrice = calculateBundlePrice();
    const discountedPrice = totalPrice * (1 - parseFloat(discount || "0") / 100);
    setPrice(discountedPrice.toFixed(2));
  };

  return (
    <AdminLayout user={admin}>
      <Page
        title="Create Bundle"
        backAction={{ onAction: () => navigate("/admin/bundles") }}
        primaryAction={{
          content: "Save Bundle",
          onAction: () => document.getElementById("bundle-form")?.requestSubmit(),
        }}
      >
        <Layout>
          {actionData?.error && (
            <Layout.Section>
              <Banner tone="critical">
                <p>{actionData.error}</p>
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            <Form method="post" id="bundle-form">
              <FormLayout>
                <Card>
                  <Box padding="400">
                    <FormLayout>
                      <TextField
                        label="Bundle Name"
                        value={name}
                        onChange={setName}
                        name="name"
                        placeholder="e.g., Starter Bundle"
                        autoComplete="off"
                        requiredIndicator
                      />

                      <TextField
                        label="Description"
                        value={description}
                        onChange={setDescription}
                        name="description"
                        multiline={3}
                        placeholder="Describe what's included in this bundle"
                        autoComplete="off"
                      />

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <TextField
                          label="Bundle Price"
                          type="number"
                          value={price}
                          onChange={setPrice}
                          name="price"
                          prefix="$"
                          helpText={`Total value: $${calculateBundlePrice().toFixed(2)}`}
                          autoComplete="off"
                          requiredIndicator
                        />

                        <TextField
                          label="Discount (%)"
                          type="number"
                          value={discount}
                          onChange={(value) => {
                            setDiscount(value);
                            if (selectedSections.length > 0) {
                              suggestPrice();
                            }
                          }}
                          name="discount"
                          suffix="%"
                          helpText="Discount off total value"
                          autoComplete="off"
                        />
                      </div>

                      <Button onClick={suggestPrice}>Calculate Discounted Price</Button>

                      <Checkbox
                        label="Feature this bundle"
                        checked={isFeatured}
                        onChange={setIsFeatured}
                        name="isFeatured"
                        helpText="Featured bundles appear prominently on the bundle page"
                      />
                    </FormLayout>
                  </Box>
                </Card>

                <Card>
                  <Box padding="400">
                    <Text variant="headingMd" as="h3">
                      Select Sections ({selectedSections.length} selected)
                    </Text>
                    <Box paddingBlockStart="400">
                      <ResourceList
                        resourceName={{ singular: "section", plural: "sections" }}
                        items={sections}
                        renderItem={(section) => {
                          const { id, name, category, price } = section;
                          const isSelected = selectedSections.includes(id);

                          return (
                            <ResourceItem id={id} onClick={() => toggleSection(id)}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Checkbox
                                  label=""
                                  checked={isSelected}
                                  onChange={() => toggleSection(id)}
                                  name="sections"
                                  value={id}
                                />
                                <div style={{ flex: 1 }}>
                                  <Text variant="bodyMd" as="h3" fontWeight="semibold">
                                    {name}
                                  </Text>
                                  <Text variant="bodySm" as="p" tone="subdued">
                                    {category}
                                  </Text>
                                </div>
                                <Text variant="bodyMd" as="p">
                                  ${price.toFixed(2)}
                                </Text>
                              </div>
                            </ResourceItem>
                          );
                        }}
                      />

                      {sections.length === 0 && (
                        <Box padding="400">
                          <Text variant="bodyMd" as="p" tone="subdued">
                            No sections available. Create sections first before creating bundles.
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Card>
              </FormLayout>
            </Form>
          </Layout.Section>
        </Layout>
      </Page>
    </AdminLayout>
  );
}
