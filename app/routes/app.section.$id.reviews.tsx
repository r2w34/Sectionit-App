import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { Page, Layout, Card, FormLayout, TextField, Button, Rating, Text, Box, Banner, Divider } from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../lib/shopify.server";
import { prisma } from "../lib/db.server";
import { AppLayout } from "../components/layout/AppLayout";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const sectionId = params.id!;

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      reviews: {
        include: {
          shop: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!section) {
    throw new Response("Section not found", { status: 404 });
  }

  // Check if user has purchased this section
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
    include: {
      purchases: {
        where: {
          sectionId,
          status: "completed",
        },
      },
      reviews: {
        where: { sectionId },
      },
    },
  });

  const hasPurchased = shop?.purchases && shop.purchases.length > 0;
  const hasReviewed = shop?.reviews && shop.reviews.length > 0;

  return json({
    section: {
      id: section.id,
      name: section.name,
      averageRating: Number(section.averageRating) || 0,
      reviewCount: section.reviewCount,
    },
    reviews: section.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment || "",
      shopDomain: r.shop.shopDomain,
      createdAt: new Date(r.createdAt).toLocaleDateString(),
    })),
    hasPurchased,
    hasReviewed,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const sectionId = params.id!;
  const formData = await request.formData();

  const rating = parseInt(formData.get("rating") as string);
  const comment = formData.get("comment") as string;

  if (!rating || rating < 1 || rating > 5) {
    return json({ error: "Please provide a rating between 1 and 5 stars" });
  }

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    return json({ error: "Shop not found" });
  }

  try {
    // Create the review
    await prisma.review.create({
      data: {
        sectionId,
        shopId: shop.id,
        rating,
        comment: comment || null,
      },
    });

    // Update section average rating and count
    const allReviews = await prisma.review.findMany({
      where: { sectionId },
    });

    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.section.update({
      where: { id: sectionId },
      data: {
        averageRating,
        reviewCount: allReviews.length,
      },
    });

    return json({ success: true });
  } catch (error) {
    return json({ error: "Failed to submit review. Please try again." });
  }
};

export default function SectionReviews() {
  const { section, reviews, hasPurchased, hasReviewed } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  return (
    <AppLayout>
      <Page title={`${section.name} - Reviews`} backAction={{ url: `/app/section/${section.id}` }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="400">
                <div style={{ textAlign: "center" }}>
                  <Text variant="heading2xl" as="h2">
                    {section.averageRating.toFixed(1)}
                  </Text>
                  <div style={{ fontSize: "24px", color: "#FFC107" }}>
                    {renderStars(Math.round(section.averageRating))}
                  </div>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Based on {section.reviewCount} {section.reviewCount === 1 ? "review" : "reviews"}
                  </Text>
                </div>
              </Box>
            </Card>
          </Layout.Section>

          {hasPurchased && !hasReviewed && (
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <Text variant="headingMd" as="h3">
                    Write a Review
                  </Text>
                  <Box paddingBlockStart="400">
                    {actionData?.success && (
                      <Banner tone="success" onDismiss={() => {}}>
                        Thank you for your review!
                      </Banner>
                    )}
                    {actionData?.error && (
                      <Banner tone="critical">
                        {actionData.error}
                      </Banner>
                    )}
                    <Form method="post">
                      <FormLayout>
                        <div>
                          <Text variant="bodyMd" as="p">
                            Rating *
                          </Text>
                          <div
                            style={{
                              fontSize: "32px",
                              cursor: "pointer",
                              userSelect: "none",
                              marginTop: "8px",
                            }}
                          >
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                onClick={() => setRating(star)}
                                style={{ color: star <= rating ? "#FFC107" : "#E0E0E0" }}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <input type="hidden" name="rating" value={rating} />
                        </div>

                        <TextField
                          label="Your Review (Optional)"
                          value={comment}
                          onChange={setComment}
                          name="comment"
                          multiline={4}
                          placeholder="Share your experience with this section..."
                          autoComplete="off"
                        />

                        <Button submit variant="primary" disabled={rating === 0}>
                          Submit Review
                        </Button>
                      </FormLayout>
                    </Form>
                  </Box>
                </Box>
              </Card>
            </Layout.Section>
          )}

          {!hasPurchased && (
            <Layout.Section>
              <Banner tone="info">
                <p>Purchase this section to leave a review</p>
              </Banner>
            </Layout.Section>
          )}

          {hasReviewed && (
            <Layout.Section>
              <Banner tone="success">
                <p>Thank you for your review!</p>
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingMd" as="h3">
                  Customer Reviews ({reviews.length})
                </Text>
                <Box paddingBlockStart="400">
                  {reviews.length === 0 ? (
                    <Text variant="bodyMd" as="p" tone="subdued">
                      No reviews yet. Be the first to review!
                    </Text>
                  ) : (
                    reviews.map((review, index) => (
                      <div key={review.id}>
                        {index > 0 && <Divider />}
                        <Box paddingBlockStart={index > 0 ? "400" : "0"} paddingBlockEnd="400">
                          <div style={{ fontSize: "16px", color: "#FFC107" }}>
                            {renderStars(review.rating)}
                          </div>
                          {review.comment && (
                            <Box paddingBlockStart="200">
                              <Text variant="bodyMd" as="p">
                                {review.comment}
                              </Text>
                            </Box>
                          )}
                          <Box paddingBlockStart="200">
                            <Text variant="bodySm" as="p" tone="subdued">
                              {review.shopDomain} • {review.createdAt}
                            </Text>
                          </Box>
                        </Box>
                      </div>
                    ))
                  )}
                </Box>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppLayout>
  );
}
