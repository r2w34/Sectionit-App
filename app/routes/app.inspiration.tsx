import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  Box,
  Button,
  Tabs,
} from "@shopify/polaris";
import { useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";

export const loader = async () => {
  // In production, this would fetch from database
  const examples = [
    {
      id: "modern-ecommerce",
      title: "Modern E-commerce Homepage",
      description: "A complete homepage design with hero, featured products, testimonials, and more",
      category: "Homepage",
      thumbnail: "/placeholders/example-1.png",
      sections: [
        { name: "Hero Banner", price: 39 },
        { name: "Announcement Bar", price: 9 },
        { name: "Featured Collection", price: 19 },
        { name: "Testimonials", price: 29 },
        { name: "Instagram Feed", price: 15 },
        { name: "FAQ Section", price: 0 },
      ],
      totalValue: 111,
      bundlePrice: 89,
    },
    {
      id: "product-showcase",
      title: "Product Page Enhancement",
      description: "Boost conversions with advanced product page sections",
      category: "Product",
      thumbnail: "/placeholders/example-2.png",
      sections: [
        { name: "Product Videos", price: 29 },
        { name: "Product Tabs", price: 24 },
        { name: "Size Chart", price: 9 },
        { name: "Reviews Grid", price: 24 },
        { name: "Upsell Block", price: 29 },
      ],
      totalValue: 115,
      bundlePrice: 92,
    },
    {
      id: "trust-builder",
      title: "Trust & Social Proof",
      description: "Build credibility with social proof and trust elements",
      category: "Trust",
      thumbnail: "/placeholders/example-3.png",
      sections: [
        { name: "Testimonials", price: 29 },
        { name: "Trust Badges", price: 0 },
        { name: "Social Proof Popup", price: 24 },
        { name: "Customer Logos", price: 19 },
        { name: "Reviews Grid", price: 24 },
      ],
      totalValue: 96,
      bundlePrice: 77,
    },
    {
      id: "fashion-store",
      title: "Fashion Store Layout",
      description: "Stylish sections perfect for fashion and apparel stores",
      category: "Fashion",
      thumbnail: "/placeholders/example-4.png",
      sections: [
        { name: "Video Hero", price: 49 },
        { name: "Image Gallery", price: 19 },
        { name: "Collection Tabs", price: 34 },
        { name: "Instagram Feed", price: 15 },
        { name: "Lookbook", price: 39 },
      ],
      totalValue: 156,
      bundlePrice: 125,
    },
    {
      id: "conversion-optimized",
      title: "Conversion-Optimized Store",
      description: "Maximize sales with conversion-focused sections",
      category: "Conversion",
      thumbnail: "/placeholders/example-5.png",
      sections: [
        { name: "Exit Intent Popup", price: 0 },
        { name: "Countdown Timer", price: 19 },
        { name: "Free Shipping Bar", price: 19 },
        { name: "Sticky Add to Cart", price: 15 },
        { name: "Cart Upsell", price: 39 },
        { name: "Quick View", price: 34 },
      ],
      totalValue: 126,
      bundlePrice: 101,
    },
    {
      id: "minimal-clean",
      title: "Minimal & Clean Design",
      description: "Less is more with this minimalist approach",
      category: "Minimal",
      thumbnail: "/placeholders/example-6.png",
      sections: [
        { name: "Minimal Hero", price: 29 },
        { name: "Featured Collection", price: 19 },
        { name: "Simple Footer", price: 0 },
        { name: "Icon Features", price: 0 },
      ],
      totalValue: 48,
      bundlePrice: 38,
    },
  ];

  return json({ examples });
};

export default function Inspiration() {
  const { examples } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { id: "all", content: "All Examples" },
    { id: "homepage", content: "Homepage" },
    { id: "product", content: "Product" },
    { id: "conversion", content: "Conversion" },
  ];

  const filterExamples = () => {
    const tabId = tabs[selectedTab].id;
    if (tabId === "all") return examples;
    return examples.filter((ex) => ex.category.toLowerCase() === tabId);
  };

  const filteredExamples = filterExamples();

  const handleGetBundle = (exampleId: string) => {
    // In production, would create custom bundle or navigate to bundle page
    navigate("/app/bundles");
  };

  return (
    <AppLayout>
      <Page title="Section Inspiration">
        <Layout>
          {/* Intro */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="bodyLg" as="p">
                  Get inspired by real examples of section combinations. Each example shows how multiple sections work together to create beautiful, high-converting pages.
                </Text>
              </Box>
            </Card>
          </Layout.Section>

          {/* Tabs */}
          <Layout.Section>
            <Card>
              <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
            </Card>
          </Layout.Section>

          {/* Examples Grid */}
          <Layout.Section>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
                gap: "24px",
              }}
            >
              {filteredExamples.map((example) => {
                const savings = example.totalValue - example.bundlePrice;
                const savingsPercent = Math.round((savings / example.totalValue) * 100);

                return (
                  <Card key={example.id}>
                    <Box padding="0">
                      {/* Thumbnail */}
                      <div
                        style={{
                          position: "relative",
                          paddingTop: "60%",
                          background: "#f6f6f7",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "48px",
                          }}
                        >
                          📐
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                          }}
                        >
                          <Badge tone="info">{example.category}</Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <Box padding="400">
                        <Text variant="headingMd" as="h3">
                          {example.title}
                        </Text>
                        <Box paddingBlockStart="200">
                          <Text variant="bodyMd" as="p" tone="subdued">
                            {example.description}
                          </Text>
                        </Box>

                        {/* Sections List */}
                        <Box paddingBlockStart="400">
                          <Text variant="headingSm" as="h4">
                            {example.sections.length} Sections Included:
                          </Text>
                          <Box paddingBlockStart="200">
                            <ul
                              style={{
                                margin: 0,
                                paddingLeft: "20px",
                                fontSize: "14px",
                              }}
                            >
                              {example.sections.map((section, idx) => (
                                <li key={idx} style={{ marginBottom: "4px" }}>
                                  {section.name} {section.price > 0 ? `($${section.price})` : "(FREE)"}
                                </li>
                              ))}
                            </ul>
                          </Box>
                        </Box>

                        {/* Pricing */}
                        <Box
                          paddingBlockStart="400"
                          borderBlockStartWidth="025"
                          borderColor="border"
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <Text variant="bodySm" as="p" tone="subdued">
                                Total value:{" "}
                                <span
                                  style={{
                                    textDecoration: "line-through",
                                  }}
                                >
                                  ${example.totalValue}
                                </span>
                              </Text>
                              <Text variant="headingLg" as="p">
                                ${example.bundlePrice}
                              </Text>
                            </div>
                            <Badge tone="success">Save {savingsPercent}%</Badge>
                          </div>
                        </Box>

                        {/* Action */}
                        <Box paddingBlockStart="400">
                          <div style={{ display: "flex", gap: "8px" }}>
                            <Button
                              variant="primary"
                              onClick={() => handleGetBundle(example.id)}
                            >
                              Get This Bundle
                            </Button>
                            <Button>View Details</Button>
                          </div>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                );
              })}
            </div>
          </Layout.Section>

          {/* CTA */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <div style={{ textAlign: "center" }}>
                  <Text variant="headingLg" as="h2">
                    Need Help Choosing?
                  </Text>
                  <Box paddingBlockStart="300">
                    <Text variant="bodyMd" as="p">
                      Our team can help you select the perfect sections for your store and customize them to match your brand.
                    </Text>
                  </Box>
                  <Box paddingBlockStart="400">
                    <Button variant="primary" size="large">
                      Contact Us
                    </Button>
                  </Box>
                </div>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppLayout>
  );
}
