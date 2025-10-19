import { Modal, Text, Button, ButtonGroup, Badge, Box } from "@shopify/polaris";

interface SectionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: {
    id: string;
    name: string;
    description: string;
    longDescription?: string;
    price: number;
    isFree: boolean;
    isPro: boolean;
    isPlus: boolean;
    previewImageUrl: string;
    fullPreviewUrl?: string;
    demoUrl?: string;
    rating: number;
    reviewCount: number;
    tags: string[];
    features?: string[];
  } | null;
  isPurchased?: boolean;
  onPurchase: (id: string) => void;
  onInstall?: (id: string) => void;
}

export function SectionPreviewModal({
  isOpen,
  onClose,
  section,
  isPurchased = false,
  onPurchase,
  onInstall,
}: SectionPreviewModalProps) {
  if (!section) return null;

  const formatPrice = (price: number) => {
    return price === 0 ? "FREE" : `$${price}`;
  };

  const getBadge = () => {
    if (section.isPro) return <Badge tone="critical">💎 Pro</Badge>;
    if (section.isPlus) return <Badge tone="magic">⚡ Plus</Badge>;
    if (section.isFree) return <Badge tone="success">🎁 Free</Badge>;
    return null;
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={section.name}
      large
      primaryAction={
        isPurchased
          ? {
              content: "Install to Theme",
              onAction: () => onInstall && onInstall(section.id),
            }
          : {
              content: section.isFree
                ? "Add to Cart"
                : `Buy ${formatPrice(section.price)}`,
              onAction: () => onPurchase(section.id),
            }
      }
      secondaryActions={[
        {
          content: "View Demo",
          onAction: () => {
            if (section.demoUrl) {
              window.open(section.demoUrl, "_blank");
            }
          },
          disabled: !section.demoUrl,
        },
      ]}
    >
      <Modal.Section>
        {/* Badge */}
        {getBadge()}

        {/* Preview Image */}
        <Box paddingBlockStart="400">
          <img
            src={section.fullPreviewUrl || section.previewImageUrl}
            alt={section.name}
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #e1e3e5",
            }}
          />
        </Box>

        {/* Description */}
        <Box paddingBlockStart="400">
          <Text variant="headingMd" as="h3">
            Description
          </Text>
          <Box paddingBlockStart="200">
            <Text variant="bodyMd" as="p">
              {section.longDescription || section.description}
            </Text>
          </Box>
        </Box>

        {/* Features */}
        {section.features && section.features.length > 0 && (
          <Box paddingBlockStart="400">
            <Text variant="headingMd" as="h3">
              Features
            </Text>
            <Box paddingBlockStart="200">
              <ul style={{ paddingLeft: "20px" }}>
                {section.features.map((feature, index) => (
                  <li key={index}>
                    <Text variant="bodyMd" as="span">
                      {feature}
                    </Text>
                  </li>
                ))}
              </ul>
            </Box>
          </Box>
        )}

        {/* Tags */}
        {section.tags && section.tags.length > 0 && (
          <Box paddingBlockStart="400">
            <Text variant="headingMd" as="h3">
              Tags
            </Text>
            <Box paddingBlockStart="200">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {section.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "4px 12px",
                      background: "#f6f6f7",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#637381",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </Box>
          </Box>
        )}

        {/* Rating */}
        {section.reviewCount > 0 && (
          <Box paddingBlockStart="400">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "24px" }}>⭐</span>
              <Text variant="headingLg" as="p">
                {section.rating.toFixed(1)}
              </Text>
              <Text variant="bodyMd" as="span" tone="subdued">
                ({section.reviewCount} reviews)
              </Text>
            </div>
          </Box>
        )}

        {/* Price */}
        <Box paddingBlockStart="400">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              background: "#f6f6f7",
              borderRadius: "8px",
            }}
          >
            <Text variant="headingLg" as="p">
              Price
            </Text>
            <Text variant="headingXl" as="p">
              {formatPrice(section.price)}
            </Text>
          </div>
        </Box>
      </Modal.Section>
    </Modal>
  );
}
