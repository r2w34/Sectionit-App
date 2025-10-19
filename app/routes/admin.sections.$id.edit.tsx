import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Button,
  Text,
  Box,
  Banner,
} from "@shopify/polaris";
import { useState } from "react";
import { requireAdmin, logAdminActivity } from "../lib/admin-auth.server";
import { prisma } from "../lib/db.server";
import { AdminLayout } from "../components/layout/AdminLayout";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const admin = await requireAdmin(request);
  const { id } = params;

  if (!id) {
    throw new Response("Section ID required", { status: 400 });
  }

  const section = await prisma.section.findUnique({
    where: { id },
    include: {
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!section) {
    throw new Response("Section not found", { status: 404 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const allTags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  return json({
    admin: {
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    section: {
      ...section,
      tags: section.tags.map((st) => st.tag.id),
    },
    categories,
    allTags,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const admin = await requireAdmin(request);
  const { id } = params;

  if (!id) {
    return json({ error: "Section ID required" }, { status: 400 });
  }

  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "delete") {
    // Delete section
    await prisma.section.delete({
      where: { id },
    });

    await logAdminActivity(
      admin.id,
      "delete",
      "section",
      id,
      { name: formData.get("name") },
      request
    );

    return redirect("/admin/sections");
  }

  // Update section
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const shortDescription = formData.get("shortDescription") as string;
  const longDescription = formData.get("longDescription") as string;
  const categoryId = formData.get("categoryId") as string;
  const price = parseFloat(formData.get("price") as string);
  const previewImageUrl = formData.get("previewImageUrl") as string;
  const liquidContent = formData.get("liquidContent") as string;
  
  const isFree = formData.get("isFree") === "true";
  const isPro = formData.get("isPro") === "true";
  const isPlus = formData.get("isPlus") === "true";
  const isNew = formData.get("isNew") === "true";
  const isTrending = formData.get("isTrending") === "true";
  const isFeatured = formData.get("isFeatured") === "true";
  const isActive = formData.get("isActive") === "true";

  // Get selected tags
  const selectedTags = formData.getAll("tags") as string[];

  try {
    await prisma.section.update({
      where: { id },
      data: {
        name,
        slug,
        shortDescription,
        longDescription,
        categoryId,
        price: isFree ? 0 : price,
        previewImageUrl,
        liquidContent,
        isFree,
        isPro,
        isPlus,
        isNew,
        isTrending,
        isFeatured,
        isActive,
      },
    });

    // Update tags
    await prisma.sectionTag.deleteMany({
      where: { sectionId: id },
    });

    if (selectedTags.length > 0) {
      await prisma.sectionTag.createMany({
        data: selectedTags.map((tagId) => ({
          sectionId: id,
          tagId,
        })),
      });
    }

    await logAdminActivity(
      admin.id,
      "update",
      "section",
      id,
      { name, slug, price },
      request
    );

    return redirect("/admin/sections");
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};

export default function EditSection() {
  const { admin, section, categories, allTags } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  
  const [name, setName] = useState(section.name);
  const [slug, setSlug] = useState(section.slug);
  const [shortDescription, setShortDescription] = useState(section.shortDescription);
  const [longDescription, setLongDescription] = useState(section.longDescription || "");
  const [categoryId, setCategoryId] = useState(section.categoryId);
  const [price, setPrice] = useState(section.price.toString());
  const [previewImageUrl, setPreviewImageUrl] = useState(section.previewImageUrl);
  const [liquidContent, setLiquidContent] = useState(section.liquidContent || "");
  
  const [isFree, setIsFree] = useState(section.isFree);
  const [isPro, setIsPro] = useState(section.isPro);
  const [isPlus, setIsPlus] = useState(section.isPlus);
  const [isNew, setIsNew] = useState(section.isNew);
  const [isTrending, setIsTrending] = useState(section.isTrending);
  const [isFeatured, setIsFeatured] = useState(section.isFeatured);
  const [isActive, setIsActive] = useState(section.isActive);
  const [selectedTags, setSelectedTags] = useState<string[]>(section.tags);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <AdminLayout user={admin}>
      <Page
        title={`Edit Section: ${section.name}`}
        backAction={{ onAction: () => navigate("/admin/sections") }}
      >
        <Layout>
          <Layout.Section>
            <Form method="post">
              <Card>
                <Box padding="400">
                  <FormLayout>
                    <TextField
                      label="Section Name"
                      value={name}
                      onChange={setName}
                      name="name"
                      autoComplete="off"
                      requiredIndicator
                    />

                    <TextField
                      label="Slug"
                      value={slug}
                      onChange={setSlug}
                      name="slug"
                      autoComplete="off"
                      helpText="URL-friendly identifier (e.g., hero-banner)"
                      requiredIndicator
                    />

                    <TextField
                      label="Short Description"
                      value={shortDescription}
                      onChange={setShortDescription}
                      name="shortDescription"
                      autoComplete="off"
                      maxLength={200}
                      showCharacterCount
                      requiredIndicator
                    />

                    <TextField
                      label="Long Description"
                      value={longDescription}
                      onChange={setLongDescription}
                      name="longDescription"
                      multiline={4}
                      autoComplete="off"
                    />

                    <Select
                      label="Category"
                      options={categoryOptions}
                      value={categoryId}
                      onChange={setCategoryId}
                      name="categoryId"
                    />

                    <TextField
                      label="Price (USD)"
                      type="number"
                      value={price}
                      onChange={setPrice}
                      name="price"
                      prefix="$"
                      disabled={isFree}
                      requiredIndicator
                    />

                    <TextField
                      label="Preview Image URL"
                      value={previewImageUrl}
                      onChange={setPreviewImageUrl}
                      name="previewImageUrl"
                      autoComplete="off"
                      placeholder="https://example.com/preview.png"
                    />

                    <TextField
                      label="Liquid Code"
                      value={liquidContent}
                      onChange={setLiquidContent}
                      name="liquidContent"
                      multiline={10}
                      autoComplete="off"
                      helpText="The Liquid section code"
                    />
                  </FormLayout>
                </Box>
              </Card>

              {/* Feature Flags */}
              <Card>
                <Box padding="400">
                  <Text variant="headingMd" as="h3">
                    Section Flags
                  </Text>
                  <Box paddingBlockStart="400">
                    <FormLayout>
                      <Checkbox
                        label="Free Section"
                        checked={isFree}
                        onChange={setIsFree}
                        name="isFree"
                        helpText="Mark as free (price will be set to $0)"
                      />
                      
                      <Checkbox
                        label="Pro Section"
                        checked={isPro}
                        onChange={setIsPro}
                        name="isPro"
                        helpText="Premium quality section"
                      />

                      <Checkbox
                        label="Plus Exclusive"
                        checked={isPlus}
                        onChange={setIsPlus}
                        name="isPlus"
                        helpText="Only for Plus members"
                      />

                      <Checkbox
                        label="New"
                        checked={isNew}
                        onChange={setIsNew}
                        name="isNew"
                        helpText="Show 'New' badge"
                      />

                      <Checkbox
                        label="Trending"
                        checked={isTrending}
                        onChange={setIsTrending}
                        name="isTrending"
                        helpText="Show 'Trending' badge"
                      />

                      <Checkbox
                        label="Featured"
                        checked={isFeatured}
                        onChange={setIsFeatured}
                        name="isFeatured"
                        helpText="Feature on homepage"
                      />

                      <Checkbox
                        label="Active"
                        checked={isActive}
                        onChange={setIsActive}
                        name="isActive"
                        helpText="Visible to customers"
                      />
                    </FormLayout>
                  </Box>
                </Box>
              </Card>

              {/* Tags */}
              <Card>
                <Box padding="400">
                  <Text variant="headingMd" as="h3">
                    Tags
                  </Text>
                  <Box paddingBlockStart="400">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                      {allTags.map((tag) => (
                        <div key={tag.id}>
                          <Checkbox
                            label={tag.name}
                            checked={selectedTags.includes(tag.id)}
                            onChange={() => handleTagToggle(tag.id)}
                            name="tags"
                          />
                          <input
                            type="hidden"
                            name="tags"
                            value={selectedTags.includes(tag.id) ? tag.id : ""}
                          />
                        </div>
                      ))}
                    </div>
                  </Box>
                </Box>
              </Card>

              {/* Hidden fields for booleans */}
              <input type="hidden" name="isFree" value={isFree.toString()} />
              <input type="hidden" name="isPro" value={isPro.toString()} />
              <input type="hidden" name="isPlus" value={isPlus.toString()} />
              <input type="hidden" name="isNew" value={isNew.toString()} />
              <input type="hidden" name="isTrending" value={isTrending.toString()} />
              <input type="hidden" name="isFeatured" value={isFeatured.toString()} />
              <input type="hidden" name="isActive" value={isActive.toString()} />

              {/* Actions */}
              <Box paddingBlockStart="400">
                <div style={{ display: "flex", gap: "12px", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <Button submit variant="primary">
                      Save Changes
                    </Button>
                    <Button onClick={() => navigate("/admin/sections")}>
                      Cancel
                    </Button>
                  </div>
                  <Button
                    tone="critical"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Section
                  </Button>
                </div>
              </Box>
            </Form>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <Box paddingBlockStart="400">
                <Banner tone="critical">
                  <p>
                    <strong>Are you sure you want to delete this section?</strong>
                    <br />
                    This action cannot be undone.
                  </p>
                  <Box paddingBlockStart="300">
                    <Form method="post">
                      <input type="hidden" name="_action" value="delete" />
                      <input type="hidden" name="name" value={name} />
                      <div style={{ display: "flex", gap: "12px" }}>
                        <Button submit tone="critical">
                          Yes, Delete
                        </Button>
                        <Button onClick={() => setShowDeleteConfirm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </Form>
                  </Box>
                </Banner>
              </Box>
            )}
          </Layout.Section>
        </Layout>
      </Page>
    </AdminLayout>
  );
}
