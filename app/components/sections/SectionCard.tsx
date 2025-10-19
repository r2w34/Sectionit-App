import { Card, Text, Badge, Button, ButtonGroup, Icon } from "@shopify/polaris";
import { HeartIcon, ViewIcon } from "@shopify/polaris-icons";
import { motion } from "framer-motion";
import { useState } from "react";

interface SectionCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  isFree: boolean;
  isPro: boolean;
  isPlus: boolean;
  isNew: boolean;
  isTrending: boolean;
  previewImageUrl: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  isFavorite?: boolean;
  isPurchased?: boolean;
  onPreview: (id: string) => void;
  onPurchase?: (id: string) => void;
  onInstall?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export function SectionCard({
  id,
  name,
  description,
  price,
  isFree,
  isPro,
  isPlus,
  isNew,
  isTrending,
  previewImageUrl,
  rating,
  reviewCount,
  tags,
  isFavorite = false,
  isPurchased = false,
  onPreview,
  onPurchase,
  onInstall,
  onToggleFavorite,
}: SectionCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const getBadge = () => {
    if (isTrending) return <Badge tone="warning">🔥 Hot</Badge>;
    if (isNew) return <Badge tone="info">⭐ New</Badge>;
    if (isPro) return <Badge tone="critical">💎 Pro</Badge>;
    if (isPlus) return <Badge tone="magic">⚡ Plus</Badge>;
    if (isFree) return <Badge tone="success">🎁 Free</Badge>;
    return null;
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "FREE" : `$${price}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ height: "100%" }}
    >
      <Card>
        <div style={{ position: "relative" }}>
          {/* Preview Image */}
          <div
            style={{
              position: "relative",
              paddingTop: "56.25%",
              overflow: "hidden",
              borderRadius: "8px 8px 0 0",
              backgroundColor: "#f6f6f7",
              cursor: "pointer",
            }}
            onClick={() => onPreview(id)}
          >
            <img
              src={previewImageUrl}
              alt={name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.3s, transform 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            />
            
            {/* Badge Overlay */}
            <div style={{ position: "absolute", top: 12, left: 12 }}>
              {getBadge()}
            </div>

            {/* Favorite Button */}
            {onToggleFavorite && (
              <div style={{ position: "absolute", top: 12, right: 12 }}>
                <Button
                  icon={HeartIcon}
                  variant="plain"
                  tone={isFavorite ? "critical" : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(id);
                  }}
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: "16px" }}>
            {/* Title */}
            <Text variant="headingMd" as="h3">
              {name}
            </Text>

            {/* Description */}
            <div style={{ marginTop: "8px" }}>
              <Text variant="bodyMd" as="p" tone="subdued">
                {description}
              </Text>
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "12px",
                }}
              >
                {tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "4px 8px",
                      background: "#f6f6f7",
                      borderRadius: "4px",
                      fontSize: "12px",
                      color: "#637381",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Price and Rating */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "16px",
              }}
            >
              <Text variant="headingMd" as="p">
                {formatPrice(price)}
              </Text>
              {reviewCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ color: "#FFC453" }}>⭐</span>
                  <Text variant="bodySm" as="span">
                    {rating.toFixed(1)} ({reviewCount})
                  </Text>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ marginTop: "16px" }}>
              {isPurchased ? (
                <ButtonGroup>
                  <Button onClick={() => onPreview(id)} icon={ViewIcon}>
                    Preview
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => onInstall && onInstall(id)}
                  >
                    Install to Theme
                  </Button>
                </ButtonGroup>
              ) : (
                <ButtonGroup>
                  <Button onClick={() => onPreview(id)} icon={ViewIcon}>
                    Preview
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => onPurchase && onPurchase(id)}
                  >
                    {isFree ? "Add to Cart" : `Buy ${formatPrice(price)}`}
                  </Button>
                </ButtonGroup>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
