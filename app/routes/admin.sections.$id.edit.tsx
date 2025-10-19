import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs, unstable_parseMultipartFormData, unstable_createMemoryUploadHandler } from "@remix-run/node";
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
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

  let formData: FormData;
  let previewImageUrl = "";
  
  // Check content type to decide how to parse
  const contentType = request.headers.get("content-type") || "";
  
  if (contentType.includes("multipart/form-data")) {
    try {
      // Handle file upload
      const uploadHandler = unstable_createMemoryUploadHandler({
        maxPartSize: 5_000_000, // 5MB
      });
      
      formData = await unstable_parseMultipartFormData(request, uploadHandler);
      
      // Handle image upload
      const imageFile = formData.get("image") as File | null;
      
      if (imageFile && imageFile.size > 0) {
        try {
          // Create uploads directory if it doesn't exist
          const uploadsDir = join(process.cwd(), "public", "uploads", "sections");
          await mkdir(uploadsDir, { recursive: true });
          
          // Get slug for filename or use timestamp
          const slug = formData.get("slug") as string;
          const timestamp = Date.now();
          const filename = `${slug || timestamp}-${imageFile.name}`;
          const filepath = join(uploadsDir, filename);
          
          // Save file
          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          await writeFile(filepath, buffer);
          
          // Set the URL
          previewImageUrl = `/uploads/sections/${filename}`;
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      }
      
      // Get the manually entered URL if no file was uploaded
      if (!previewImageUrl) {
        previewImageUrl = (formData.get("previewImageUrl") as string) || "";
      }
    } catch (error) {
      console.error("Error parsing multipart form:", error);
      return json({ error: "Error uploading file" }, { status: 500 });
    }
  } else {
    // Regular form submission without file
    formData = await request.formData();
    previewImageUrl = (formData.get("previewImageUrl") as string) || "";
  }

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
  const longDescription = formData.get("longDescription") as string || "";
  const categoryId = formData.get("categoryId") as string;
  const priceStr = formData.get("price") as string;
  const price = priceStr ? parseFloat(priceStr) : 0;
  const liquidContent = formData.get("liquidContent") as string || "";
  
  // Validate required fields
  if (!name || !slug || !shortDescription || !categoryId) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }
  
  if (isNaN(price) || price < 0) {
    return json({ error: "Invalid price value" }, { status: 400 });
  }
  
  const isFree = formData.get("isFree") === "on" || formData.get("isFree") === "true";
  const isPro = formData.get("isPro") === "on" || formData.get("isPro") === "true";
  const isPlus = formData.get("isPlus") === "on" || formData.get("isPlus") === "true";
  const isNew = formData.get("isNew") === "on" || formData.get("isNew") === "true";
  const isTrending = formData.get("isTrending") === "on" || formData.get("isTrending") === "true";
  const isFeatured = formData.get("isFeatured") === "on" || formData.get("isFeatured") === "true";
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";

  // Get selected tags
  const selectedTags = formData.getAll("tags").filter(t => t) as string[];
  
  // Get existing section to preserve previewImageUrl if not changed
  const existingSection = await prisma.section.findUnique({
    where: { id },
    select: { previewImageUrl: true },
  });
  
  // Use new image URL if provided, otherwise keep existing
  const finalPreviewImageUrl = previewImageUrl || existingSection?.previewImageUrl || "";

  try {
    console.log("=== SECTION UPDATE DEBUG ===");
    console.log("Section ID:", id);
    console.log("Data to update:", {
      name,
      slug,
      shortDescription,
      longDescription,
      categoryId,
      price: isFree ? 0 : price,
      finalPreviewImageUrl,
      liquidContent: liquidContent?.substring(0, 50),
      isFree,
      isPro,
      isPlus,
      isNew,
      isTrending,
      isFeatured,
      isActive,
    });
    
    await prisma.section.update({
      where: { id },
      data: {
        name,
        slug,
        shortDescription,
        longDescription,
        categoryId,
        price: isFree ? 0 : price,
        previewImageUrl: finalPreviewImageUrl,
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

    console.log("Section updated successfully");

    // Update tags
    await prisma.sectionTag.deleteMany({
      where: { sectionId: id },
    });

    console.log("Old tags deleted, creating new tags:", selectedTags);

    if (selectedTags.length > 0) {
      await prisma.sectionTag.createMany({
        data: selectedTags.map((tagId) => ({
          sectionId: id,
          tagId,
        })),
      });
    }

    console.log("Tags updated successfully");

    await logAdminActivity(
      admin.id,
      "update",
      "section",
      id,
      { name, slug, price },
      request
    );

    console.log("Admin activity logged, redirecting...");

    return redirect("/admin/sections?success=updated");
  } catch (error: any) {
    console.error("=== ERROR UPDATING SECTION ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return json({ error: error.message, details: error.toString() }, { status: 500 });
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  
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
            <Form method="post" encType="multipart/form-data">
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

                    {/* Image Upload */}
                    <Box>
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Preview Image
                      </Text>
                      <Box paddingBlockStart="200">
                        {section.previewImageUrl && !filePreview && (
                          <Box paddingBlockEnd="200">
                            <Text variant="bodySm" as="p" tone="subdued">
                              Current image:
                            </Text>
                            <Box paddingBlockStart="100">
                              <img
                                src={section.previewImageUrl}
                                alt="Current preview"
                                style={{
                                  maxWidth: "300px",
                                  maxHeight: "200px",
                                  borderRadius: "8px",
                                  border: "1px solid #ddd",
                                }}
                              />
                            </Box>
                          </Box>
                        )}
                        <input
                          type="file"
                          name="image"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadedFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFilePreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          style={{
                            display: "block",
                            marginBottom: "12px",
                            padding: "8px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            width: "100%",
                          }}
                        />
                        {filePreview && (
                          <Box paddingBlockStart="200">
                            <Text variant="bodySm" as="p" tone="success">
                              New image preview:
                            </Text>
                            <Box paddingBlockStart="100">
                              <img
                                src={filePreview}
                                alt="New preview"
                                style={{
                                  maxWidth: "300px",
                                  maxHeight: "200px",
                                  borderRadius: "8px",
                                  border: "2px solid #008060",
                                }}
                              />
                            </Box>
                          </Box>
                        )}
                        <input
                          type="hidden"
                          name="previewImageUrl"
                          value={previewImageUrl}
                        />
                      </Box>
                      <Box paddingBlockStart="200">
                        <Text variant="bodySm" as="p" tone="subdued">
                          Or enter image URL manually:
                        </Text>
                        <Box paddingBlockStart="100">
                          <TextField
                            label=""
                            value={previewImageUrl}
                            onChange={setPreviewImageUrl}
                            autoComplete="off"
                            placeholder="https://example.com/preview.png"
                          />
                        </Box>
                      </Box>
                    </Box>

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
