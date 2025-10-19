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
  DropZone,
  Thumbnail,
  Banner,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { requireAdmin, logAdminActivity } from "../lib/admin-auth.server";
import { prisma } from "../lib/db.server";
import { AdminLayout } from "../components/layout/AdminLayout";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const admin = await requireAdmin(request);

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
    categories,
    allTags,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const admin = await requireAdmin(request);
  
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

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const shortDescription = formData.get("shortDescription") as string;
  const longDescription = formData.get("longDescription") as string;
  const categoryId = formData.get("categoryId") as string;
  const price = parseFloat(formData.get("price") as string);
  const liquidContent = formData.get("liquidContent") as string;

  const isFree = formData.get("isFree") === "true";
  const isPro = formData.get("isPro") === "true";
  const isPlus = formData.get("isPlus") === "true";
  const isNew = formData.get("isNew") === "true";
  const isTrending = formData.get("isTrending") === "true";
  const isFeatured = formData.get("isFeatured") === "true";
  const isActive = formData.get("isActive") === "true";

  const selectedTags = formData.getAll("tags") as string[];

  try {
    const section = await prisma.section.create({
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
        rating: 0,
        reviewCount: 0,
        purchaseCount: 0,
        installCount: 0,
      },
    });

    // Add tags
    if (selectedTags.length > 0) {
      await prisma.sectionTag.createMany({
        data: selectedTags.map((tagId) => ({
          sectionId: section.id,
          tagId,
        })),
      });
    }

    await logAdminActivity(
      admin.id,
      "create",
      "section",
      section.id,
      { name, slug, price },
      request
    );

    return redirect("/admin/sections?success=created");
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};

export default function NewSection() {
  const { admin, categories, allTags } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [price, setPrice] = useState("29");
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [liquidContent, setLiquidContent] = useState("");

  const [isFree, setIsFree] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isPlus, setIsPlus] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [isTrending, setIsTrending] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

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
        title="Create New Section"
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
                      onChange={handleNameChange}
                      name="name"
                      autoComplete="off"
                      placeholder="e.g., Hero Banner"
                      requiredIndicator
                    />

                    <TextField
                      label="Slug"
                      value={slug}
                      onChange={setSlug}
                      name="slug"
                      autoComplete="off"
                      helpText="URL-friendly identifier (auto-generated from name)"
                      requiredIndicator
                    />

                    <TextField
                      label="Short Description"
                      value={shortDescription}
                      onChange={setShortDescription}
                      name="shortDescription"
                      autoComplete="off"
                      placeholder="Brief description for card display"
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
                      placeholder="Detailed description for preview modal"
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
                            <img
                              src={filePreview}
                              alt="Preview"
                              style={{
                                maxWidth: "300px",
                                maxHeight: "200px",
                                borderRadius: "8px",
                                border: "1px solid #ddd",
                              }}
                            />
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
                      placeholder="Paste your Liquid section code here"
                      helpText="The complete Liquid section code"
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
                <div style={{ display: "flex", gap: "12px" }}>
                  <Button submit variant="primary">
                    Create Section
                  </Button>
                  <Button onClick={() => navigate("/admin/sections")}>
                    Cancel
                  </Button>
                </div>
              </Box>
            </Form>
          </Layout.Section>
        </Layout>
      </Page>
    </AdminLayout>
  );
}
