import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create Categories
  console.log("Creating categories...");
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Hero Sections",
        slug: "hero",
        description: "Eye-catching hero banners and headers",
        order: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: "Product Sections",
        slug: "product",
        description: "Showcase your products beautifully",
        order: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: "Testimonials & Reviews",
        slug: "testimonials",
        description: "Build trust with social proof",
        order: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: "FAQ & Help",
        slug: "faq",
        description: "Answer customer questions",
        order: 4,
      },
    }),
    prisma.category.create({
      data: {
        name: "Content & Features",
        slug: "content",
        description: "Rich content sections",
        order: 5,
      },
    }),
    prisma.category.create({
      data: {
        name: "Gallery & Media",
        slug: "gallery",
        description: "Image and video galleries",
        order: 6,
      },
    }),
    prisma.category.create({
      data: {
        name: "Footer & Navigation",
        slug: "footer",
        description: "Footers and navigation sections",
        order: 7,
      },
    }),
    prisma.category.create({
      data: {
        name: "Conversion & Urgency",
        slug: "conversion",
        description: "Boost sales with urgency elements",
        order: 8,
      },
    }),
  ]);

  // Create Tags
  console.log("Creating tags...");
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: "Bestseller", slug: "bestseller" } }),
    prisma.tag.create({ data: { name: "Mobile-First", slug: "mobile-first" } }),
    prisma.tag.create({ data: { name: "Video", slug: "video" } }),
    prisma.tag.create({ data: { name: "Animated", slug: "animated" } }),
    prisma.tag.create({ data: { name: "Minimal", slug: "minimal" } }),
    prisma.tag.create({ data: { name: "Bold", slug: "bold" } }),
    prisma.tag.create({ data: { name: "Trust", slug: "trust" } }),
    prisma.tag.create({ data: { name: "Upsell", slug: "upsell" } }),
    prisma.tag.create({ data: { name: "Countdown", slug: "countdown" } }),
    prisma.tag.create({ data: { name: "Social Proof", slug: "social-proof" } }),
  ]);

  // Create Sample Sections
  console.log("Creating sections...");
  const sections = [
    // Hero Sections
    {
      name: "Video Hero Banner",
      slug: "video-hero-banner",
      shortDescription: "Full-width hero section with autoplay video background",
      longDescription:
        "Create an immersive first impression with this stunning video hero banner. Features autoplay video background, overlay text, and customizable CTA buttons.",
      categoryId: categories[0].id,
      price: 49,
      isFree: false,
      isPro: true,
      isPlus: false,
      isNew: true,
      isTrending: true,
      isFeatured: true,
      isActive: true,
      rating: 4.9,
      reviewCount: 127,
      purchaseCount: 342,
      installCount: 289,
      previewImageUrl: "/previews/video-hero.png",
      liquidContent: "{% comment %} Liquid code here {% endcomment %}",
    },
    {
      name: "Minimal Hero",
      slug: "minimal-hero",
      shortDescription: "Clean and simple hero with focus on typography",
      longDescription:
        "A minimalist hero section that puts your message front and center with beautiful typography and subtle animations.",
      categoryId: categories[0].id,
      price: 29,
      isFree: false,
      isPro: false,
      isPlus: false,
      isNew: false,
      isTrending: true,
      isFeatured: false,
      isActive: true,
      rating: 4.7,
      reviewCount: 89,
      purchaseCount: 256,
      installCount: 212,
      previewImageUrl: "/previews/minimal-hero.png",
      liquidContent: "{% comment %} Liquid code here {% endcomment %}",
    },

    // Product Sections
    {
      name: "Featured Collection Grid",
      slug: "featured-collection-grid",
      shortDescription: "Display products in a beautiful responsive grid",
      longDescription:
        "Showcase your products with this responsive grid layout. Includes hover effects, quick view, and customizable columns.",
      categoryId: categories[1].id,
      price: 19,
      isFree: false,
      isPro: false,
      isPlus: false,
      isNew: false,
      isTrending: false,
      isFeatured: true,
      isActive: true,
      rating: 4.8,
      reviewCount: 203,
      purchaseCount: 478,
      installCount: 401,
      previewImageUrl: "/previews/collection-grid.png",
      liquidContent: "{% comment %} Liquid code here {% endcomment %}",
    },
    {
      name: "Product Carousel Slider",
      slug: "product-carousel",
      shortDescription: "Swipeable product carousel with touch support",
      longDescription:
        "Modern product slider with smooth animations, touch/swipe support, and navigation arrows. Perfect for featured products.",
      categoryId: categories[1].id,
      price: 34,
      isFree: false,
      isPro: true,
      isPlus: false,
      isNew: true,
      isTrending: true,
      isFeatured: false,
      isActive: true,
      rating: 4.9,
      reviewCount: 156,
      purchaseCount: 312,
      installCount: 267,
      previewImageUrl: "/previews/product-carousel.png",
      liquidContent: "{% comment %} Liquid code here {% endcomment %}",
    },

    // Testimonials
    {
      name: "Customer Testimonials Grid",
      slug: "testimonials-grid",
      shortDescription: "Display customer reviews in a beautiful grid layout",
      longDescription:
        "Build trust with this testimonials section featuring star ratings, customer photos, and verified badges.",
      categoryId: categories[2].id,
      price: 29,
      isFree: false,
      isPro: false,
      isPlus: false,
      isNew: false,
      isTrending: false,
      isFeatured: false,
      isActive: true,
      rating: 4.6,
      reviewCount: 142,
      purchaseCount: 289,
      installCount: 245,
      previewImageUrl: "/previews/testimonials.png",
      liquidContent: "{% comment %} Liquid code here {% endcomment %}",
    },

    // FAQ
    {
      name: "Accordion FAQ Section",
      slug: "accordion-faq",
      shortDescription: "Expandable FAQ with smooth animations",
      longDescription:
        "Help customers find answers quickly with this accordion-style FAQ section. Features smooth animations and search functionality.",
      categoryId: categories[3].id,
      price: 0,
      isFree: true,
      isPro: false,
      isPlus: false,
      isNew: false,
      isTrending: true,
      isFeatured: false,
      isActive: true,
      rating: 4.5,
      reviewCount: 98,
      purchaseCount: 523,
      installCount: 467,
      previewImageUrl: "/previews/faq.png",
      liquidContent: "{% comment %} Liquid code here {% endcomment %}",
    },

    // Content
    {
      name: "Icon Features Grid",
      slug: "icon-features",
      shortDescription: "Highlight key features with icons and text",
      longDescription:
        "Perfect for showcasing your store's benefits. Includes customizable icons, headings, and descriptions.",
      categoryId: categories[4].id,
      price: 0,
      isFree: true,
      isPro: false,
      isPlus: false,
      isNew: false,
      isTrending: false,
      isFeatured: false,
      isActive: true,
      rating: 4.4,
      reviewCount: 76,
      purchaseCount: 412,
      installCount: 389,
      previewImageUrl: "/previews/icon-features.png",
      liquidContent: "{% comment %} Liquid code here {% endcomment %}",
    },

    // Gallery
    {
      name: "Instagram Feed",
      slug: "instagram-feed",
      shortDescription: "Display your Instagram posts in a grid",
      longDescription:
        "Connect your Instagram and display your latest posts. Features automatic updates and clickable posts.",
      categoryId: categories[5].id,
      price: 15,
      isFree: false,
      isPro: false,
      isPlus: false,
      isNew: false,
      isTrending: true,
      isFeatured: false,
      isActive: true,
      rating: 4.3,
      reviewCount: 134,
      purchaseCount: 298,
      installCount: 256,
      previewImageUrl: "/previews/instagram-feed.png",
      liquidContent: "{% comment %} Liquid code here {% endcomment %}",
    },

    // Conversion (Plus-only)
    {
      name: "Exit Intent Popup",
      slug: "exit-intent-popup",
      shortDescription: "Capture abandoning visitors with exit intent",
      longDescription:
        "Reduce cart abandonment with this smart exit-intent popup. Triggers when users are about to leave and offers discounts or captures emails.",
      categoryId: categories[7].id,
      price: 39,
      isFree: false,
      isPro: true,
      isPlus: true,
      isNew: true,
      isTrending: true,
      isFeatured: true,
      isActive: true,
      rating: 4.8,
      reviewCount: 67,
      purchaseCount: 145,
      installCount: 123,
      previewImageUrl: "/previews/exit-intent.png",
      liquidContent: "{% comment %} Liquid code here {% endcomment %}",
    },
    {
      name: "Countdown Timer",
      slug: "countdown-timer",
      shortDescription: "Create urgency with customizable countdown timers",
      longDescription:
        "Drive conversions with urgency. Features multiple timer styles, custom end dates, and automatic hiding when expired.",
      categoryId: categories[7].id,
      price: 19,
      isFree: false,
      isPro: false,
      isPlus: false,
      isNew: false,
      isTrending: true,
      isFeatured: false,
      isActive: true,
      rating: 4.7,
      reviewCount: 189,
      purchaseCount: 387,
      installCount: 334,
      previewImageUrl: "/previews/countdown.png",
      liquidContent: "{% comment %} Liquid code here {% endcomment %}",
    },
  ];

  const createdSections = await Promise.all(
    sections.map((section) => prisma.section.create({ data: section }))
  );

  // Create Section-Tag relationships
  console.log("Creating section-tag relationships...");
  await prisma.sectionTag.createMany({
    data: [
      { sectionId: createdSections[0].id, tagId: tags[2].id }, // Video Hero - Video
      { sectionId: createdSections[0].id, tagId: tags[3].id }, // Video Hero - Animated
      { sectionId: createdSections[0].id, tagId: tags[0].id }, // Video Hero - Bestseller
      { sectionId: createdSections[1].id, tagId: tags[4].id }, // Minimal Hero - Minimal
      { sectionId: createdSections[2].id, tagId: tags[0].id }, // Collection Grid - Bestseller
      { sectionId: createdSections[3].id, tagId: tags[3].id }, // Carousel - Animated
      { sectionId: createdSections[4].id, tagId: tags[6].id }, // Testimonials - Trust
      { sectionId: createdSections[4].id, tagId: tags[9].id }, // Testimonials - Social Proof
      { sectionId: createdSections[8].id, tagId: tags[7].id }, // Exit Intent - Upsell
      { sectionId: createdSections[9].id, tagId: tags[8].id }, // Countdown - Countdown
    ],
  });

  // Create Bundles
  console.log("Creating bundles...");
  const bundle1 = await prisma.bundle.create({
    data: {
      name: "Complete Homepage Bundle",
      slug: "complete-homepage",
      description:
        "Everything you need for a stunning homepage: hero, products, testimonials, and FAQ",
      regularPrice: 117,
      bundlePrice: 89,
      discountPercent: 24,
      isFeatured: true,
      isActive: true,
      order: 1,
    },
  });

  await prisma.bundleItem.createMany({
    data: [
      { bundleId: bundle1.id, sectionId: createdSections[0].id, order: 1 },
      { bundleId: bundle1.id, sectionId: createdSections[2].id, order: 2 },
      { bundleId: bundle1.id, sectionId: createdSections[4].id, order: 3 },
      { bundleId: bundle1.id, sectionId: createdSections[5].id, order: 4 },
    ],
  });

  // Create Admin User
  console.log("Creating admin user...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.adminUser.create({
    data: {
      email: "admin@sectionstore.com",
      passwordHash: hashedPassword,
      name: "Admin User",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("\n📊 Created:");
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${tags.length} tags`);
  console.log(`  - ${createdSections.length} sections`);
  console.log(`  - 1 bundle`);
  console.log(`  - 1 admin user`);
  console.log("\n🔐 Admin Login:");
  console.log("  Email: admin@sectionstore.com");
  console.log("  Password: admin123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
