import { Page, Layout, Card, Text, TextField, Icon, Box, Button, Collapsible } from "@shopify/polaris";
import { SearchIcon, EmailIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";

export default function HelpCenter() {
  const [searchValue, setSearchValue] = useState("");
  const [expandedFAQs, setExpandedFAQs] = useState<string[]>([]);

  const quickLinks = [
    { title: "Getting Started", icon: "🚀", url: "#getting-started" },
    { title: "Installation Guide", icon: "📦", url: "#installation" },
    { title: "Video Tutorials", icon: "🎥", url: "#videos" },
    { title: "Contact Support", icon: "💬", url: "#contact" },
  ];

  const faqs = [
    {
      id: "faq-1",
      question: "How do I purchase a section?",
      answer: "Browse sections on the Explore page, click on the section you want, then click 'Buy Now'. You'll be redirected to approve the purchase through Shopify's secure billing system. Once approved, the section will appear in your 'My Sections' page.",
    },
    {
      id: "faq-2",
      question: "Can I use sections on multiple themes?",
      answer: "Yes! Once you purchase a section, you can install it on any theme in your store. You can also re-install it if you switch themes in the future.",
    },
    {
      id: "faq-3",
      question: "What if a section breaks my theme?",
      answer: "All our sections are thoroughly tested and compatible with Shopify 2.0 themes. If you experience any issues, contact our support team within 30 days for a full refund or free assistance to fix the problem.",
    },
    {
      id: "faq-4",
      question: "How do I get a refund?",
      answer: "We offer a 30-day money-back guarantee. Contact our support team at support@sectionstore.com with your order details, and we'll process your refund within 2-3 business days.",
    },
    {
      id: "faq-5",
      question: "Are sections compatible with my theme?",
      answer: "Our sections are built to work with all Shopify 2.0 themes (Dawn, Refresh, Sense, etc.). If you're using an older theme, some sections may require minor adjustments. Contact support for compatibility assistance.",
    },
    {
      id: "faq-6",
      question: "How do updates work?",
      answer: "When we release updates to sections you've purchased, you'll receive a notification. You can re-download and install the updated version from your 'My Sections' page at any time, free of charge.",
    },
    {
      id: "faq-7",
      question: "What's included in Plus membership?",
      answer: "Plus membership ($10-15/month) includes: access to all Plus-exclusive sections, priority support (< 2hr response), early access to new sections (2 weeks early), monthly new releases, 1 custom section request per month, and beta feature testing.",
    },
    {
      id: "faq-8",
      question: "Can I cancel my Plus subscription?",
      answer: "Yes, you can cancel your Plus subscription at any time. You'll continue to have access until the end of your current billing period. Sections you installed while subscribed will remain in your theme.",
    },
    {
      id: "faq-9",
      question: "How do bundles work?",
      answer: "Bundles are collections of sections sold at a discount. Pre-made bundles offer specific section combinations, while custom bundles let you choose any sections and automatically apply discounts: 15% off for 3-5 sections, 25% off for 6-9, 35% off for 10-15, and 40% off for 16+.",
    },
    {
      id: "faq-10",
      question: "Can I request a custom section?",
      answer: "Plus members can request 1 custom section per month. For non-Plus members, custom section development is available as a separate service. Contact our team for pricing and timeline.",
    },
  ];

  const videoTutorials = [
    {
      title: "Installing Your First Section",
      duration: "3:45",
      thumbnail: "/placeholders/video-1.png",
    },
    {
      title: "Customizing Section Settings",
      duration: "5:12",
      thumbnail: "/placeholders/video-2.png",
    },
    {
      title: "Creating Custom Bundles",
      duration: "2:30",
      thumbnail: "/placeholders/video-3.png",
    },
    {
      title: "Theme Migration Guide",
      duration: "4:20",
      thumbnail: "/placeholders/video-4.png",
    },
  ];

  const toggleFAQ = (id: string) => {
    if (expandedFAQs.includes(id)) {
      setExpandedFAQs(expandedFAQs.filter((faqId) => faqId !== id));
    } else {
      setExpandedFAQs([...expandedFAQs, id]);
    }
  };

  const filteredFAQs = searchValue
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchValue.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchValue.toLowerCase())
      )
    : faqs;

  return (
    <AppLayout>
      <Page title="Help Center">
        <Layout>
          {/* Search */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingLg" as="h2">
                  How can we help you?
                </Text>
                <Box paddingBlockStart="300">
                  <TextField
                    label=""
                    value={searchValue}
                    onChange={setSearchValue}
                    placeholder="Search help articles..."
                    prefix={<Icon source={SearchIcon} />}
                    clearButton
                    onClearButtonClick={() => setSearchValue("")}
                    autoComplete="off"
                  />
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          {/* Quick Links */}
          <Layout.Section>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              {quickLinks.map((link) => (
                <Card key={link.url}>
                  <Box padding="400">
                    <a
                      href={link.url}
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        display: "block",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "48px", marginBottom: "8px" }}>
                          {link.icon}
                        </div>
                        <Text variant="headingMd" as="h3">
                          {link.title}
                        </Text>
                      </div>
                    </a>
                  </Box>
                </Card>
              ))}
            </div>
          </Layout.Section>

          {/* Getting Started */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <div id="getting-started">
                  <Text variant="headingLg" as="h2">
                    🚀 Getting Started
                  </Text>
                  <Box paddingBlockStart="300">
                    <div style={{ marginBottom: "16px" }}>
                      <Text variant="headingMd" as="h3">
                        1. Browse Sections
                      </Text>
                      <Box paddingBlockStart="200">
                        <Text variant="bodyMd" as="p">
                          Visit the Explore Sections page to browse our catalog of 127+ sections. Use filters to find sections by category, price, or tags.
                        </Text>
                      </Box>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <Text variant="headingMd" as="h3">
                        2. Preview & Purchase
                      </Text>
                      <Box paddingBlockStart="200">
                        <Text variant="bodyMd" as="p">
                          Click on any section to preview it. When you're ready, click "Buy Now" and approve the purchase through Shopify's billing system.
                        </Text>
                      </Box>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <Text variant="headingMd" as="h3">
                        3. Install to Theme
                      </Text>
                      <Box paddingBlockStart="200">
                        <Text variant="bodyMd" as="p">
                          After purchase, go to "My Sections", select the section, choose your theme, and click "Install". The section will be added to your theme instantly.
                        </Text>
                      </Box>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <Text variant="headingMd" as="h3">
                        4. Customize in Theme Editor
                      </Text>
                      <Box paddingBlockStart="200">
                        <Text variant="bodyMd" as="p">
                          Open your Shopify theme editor, add the section to any page, and customize its settings to match your brand.
                        </Text>
                      </Box>
                    </div>
                  </Box>
                </div>
              </Box>
            </Card>
          </Layout.Section>

          {/* FAQs */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text variant="headingLg" as="h2">
                  ❓ Frequently Asked Questions
                </Text>
                <Box paddingBlockStart="300">
                  {filteredFAQs.length === 0 ? (
                    <Text variant="bodyMd" as="p" tone="subdued">
                      No FAQs found matching your search.
                    </Text>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {filteredFAQs.map((faq) => {
                        const isExpanded = expandedFAQs.includes(faq.id);
                        return (
                          <div
                            key={faq.id}
                            style={{
                              border: "1px solid #e1e3e5",
                              borderRadius: "8px",
                              padding: "16px",
                            }}
                          >
                            <div
                              onClick={() => toggleFAQ(faq.id)}
                              style={{
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Text variant="headingMd" as="h3">
                                {faq.question}
                              </Text>
                              <span style={{ fontSize: "20px" }}>
                                {isExpanded ? "▼" : "▶"}
                              </span>
                            </div>
                            <Collapsible
                              open={isExpanded}
                              id={faq.id}
                              transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
                            >
                              <Box paddingBlockStart="300">
                                <Text variant="bodyMd" as="p">
                                  {faq.answer}
                                </Text>
                              </Box>
                            </Collapsible>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          {/* Video Tutorials */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <div id="videos">
                  <Text variant="headingLg" as="h2">
                    🎥 Video Tutorials
                  </Text>
                  <Box paddingBlockStart="300">
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      {videoTutorials.map((video) => (
                        <div
                          key={video.title}
                          style={{
                            border: "1px solid #e1e3e5",
                            borderRadius: "8px",
                            overflow: "hidden",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              paddingTop: "56.25%",
                              background: "#f6f6f7",
                              position: "relative",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                fontSize: "48px",
                              }}
                            >
                              ▶️
                            </div>
                          </div>
                          <div style={{ padding: "12px" }}>
                            <Text variant="headingMd" as="h4">
                              {video.title}
                            </Text>
                            <Box paddingBlockStart="100">
                              <Text variant="bodySm" as="p" tone="subdued">
                                {video.duration}
                              </Text>
                            </Box>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Box>
                </div>
              </Box>
            </Card>
          </Layout.Section>

          {/* Contact Support */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <div id="contact">
                  <Text variant="headingLg" as="h2">
                    💬 Contact Support
                  </Text>
                  <Box paddingBlockStart="300">
                    <div
                      style={{
                        background: "#f6f6f7",
                        padding: "24px",
                        borderRadius: "8px",
                        textAlign: "center",
                      }}
                    >
                      <Icon source={EmailIcon} />
                      <Box paddingBlockStart="300">
                        <Text variant="headingMd" as="h3">
                          Email: support@sectionstore.com
                        </Text>
                      </Box>
                      <Box paddingBlockStart="200">
                        <Text variant="bodyMd" as="p" tone="subdued">
                          Response time: Within 24 hours
                        </Text>
                        <Text variant="bodySm" as="p" tone="subdued">
                          (Plus members: Within 2 hours)
                        </Text>
                      </Box>
                      <Box paddingBlockStart="400">
                        <Button variant="primary">Submit Support Ticket</Button>
                      </Box>
                    </div>
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
