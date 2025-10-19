import { type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../lib/shopify.server";
import { prisma } from "../lib/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin } = await authenticate.webhook(request);

  if (!shop || !topic) {
    return new Response("Missing required parameters", { status: 400 });
  }

  console.log(`Received webhook: ${topic} for shop: ${shop}`);

  try {
    switch (topic) {
      case "APP_UNINSTALLED":
        await handleAppUninstalled(shop);
        break;

      case "CUSTOMERS_DATA_REQUEST":
        await handleCustomersDataRequest(shop);
        break;

      case "CUSTOMERS_REDACT":
        await handleCustomersRedact(shop);
        break;

      case "SHOP_REDACT":
        await handleShopRedact(shop);
        break;

      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error: any) {
    console.error(`Error processing webhook ${topic}:`, error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
};

/**
 * Handle APP_UNINSTALLED webhook
 * Mark shop as inactive when app is uninstalled
 */
async function handleAppUninstalled(shopDomain: string) {
  console.log(`Processing APP_UNINSTALLED for: ${shopDomain}`);

  await prisma.shop.update({
    where: { shopDomain },
    data: {
      isActive: false,
      uninstalledAt: new Date(),
    },
  });

  // Cancel any active subscriptions
  await prisma.subscription.updateMany({
    where: {
      shop: { shopDomain },
      status: { in: ["active", "trial"] },
    },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });

  console.log(`App uninstalled for: ${shopDomain}`);
}

/**
 * Handle CUSTOMERS_DATA_REQUEST webhook (GDPR)
 * Merchant requests customer data - compile and send
 */
async function handleCustomersDataRequest(shopDomain: string) {
  console.log(`Processing CUSTOMERS_DATA_REQUEST for: ${shopDomain}`);

  // Get all data for this shop
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    include: {
      purchases: {
        include: {
          section: true,
        },
      },
      installations: true,
      favorites: {
        include: {
          section: true,
        },
      },
      bundlePurchases: {
        include: {
          bundle: true,
        },
      },
      subscriptions: true,
    },
  });

  if (!shop) {
    console.log(`Shop not found: ${shopDomain}`);
    return;
  }

  // Compile customer data
  const customerData = {
    shop: {
      shopDomain: shop.shopDomain,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    },
    purchases: shop.purchases.map((p) => ({
      id: p.id,
      sectionName: p.section.name,
      price: p.price,
      purchasedAt: p.purchasedAt,
      status: p.status,
    })),
    installations: shop.installations.map((i) => ({
      id: i.id,
      sectionId: i.sectionId,
      themeName: i.themeName,
      installedAt: i.installedAt,
    })),
    favorites: shop.favorites.map((f) => ({
      sectionName: f.section.name,
      createdAt: f.createdAt,
    })),
    bundlePurchases: shop.bundlePurchases.map((bp) => ({
      bundleName: bp.bundle.name,
      price: bp.price,
      purchasedAt: bp.purchasedAt,
    })),
    subscriptions: shop.subscriptions.map((s) => ({
      planName: s.planName,
      price: s.price,
      status: s.status,
      startedAt: s.startedAt,
      endsAt: s.endsAt,
    })),
  };

  // TODO: Send this data to the shop owner's email
  // For production, you would:
  // 1. Generate a PDF or JSON file with this data
  // 2. Upload to secure storage (S3)
  // 3. Email download link to shop owner
  // 4. Auto-delete file after 30 days

  console.log(`Customer data compiled for: ${shopDomain}`);
  console.log(JSON.stringify(customerData, null, 2));

  // Log the request
  await prisma.shop.update({
    where: { shopDomain },
    data: {
      updatedAt: new Date(),
    },
  });
}

/**
 * Handle CUSTOMERS_REDACT webhook (GDPR)
 * Redact customer data 48 hours after request
 */
async function handleCustomersRedact(shopDomain: string) {
  console.log(`Processing CUSTOMERS_REDACT for: ${shopDomain}`);

  // Note: This is called 48 hours after the merchant uninstalls the app
  // We should anonymize personal data but keep statistical data

  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  if (!shop) {
    console.log(`Shop not found: ${shopDomain}`);
    return;
  }

  // Anonymize shop data (keep for statistics but remove identifying info)
  await prisma.shop.update({
    where: { shopDomain },
    data: {
      shopDomain: `redacted-${shop.id}`,
      accessToken: "",
      scopes: "",
      isActive: false,
    },
  });

  console.log(`Customer data redacted for: ${shopDomain}`);
}

/**
 * Handle SHOP_REDACT webhook (GDPR)
 * Shop owner requests complete data deletion
 */
async function handleShopRedact(shopDomain: string) {
  console.log(`Processing SHOP_REDACT for: ${shopDomain}`);

  // This is called when a shop closes permanently
  // We need to delete all data associated with this shop

  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  if (!shop) {
    console.log(`Shop not found: ${shopDomain}`);
    return;
  }

  // Delete all related data
  await prisma.$transaction([
    // Delete favorites
    prisma.favorite.deleteMany({
      where: { shopId: shop.id },
    }),

    // Delete installations
    prisma.installation.deleteMany({
      where: { shopId: shop.id },
    }),

    // Delete feature requests
    prisma.featureRequest.deleteMany({
      where: { shopDomain },
    }),

    // Delete support tickets
    prisma.supportTicket.deleteMany({
      where: { shopId: shop.id },
    }),

    // Delete bundle purchases
    prisma.bundlePurchase.deleteMany({
      where: { shopId: shop.id },
    }),

    // Delete subscriptions
    prisma.subscription.deleteMany({
      where: { shopId: shop.id },
    }),

    // Note: Keep purchases for accounting/tax purposes
    // but anonymize them
    prisma.purchase.updateMany({
      where: { shopId: shop.id },
      data: {
        // Keep the purchase record but remove shop association
        shopId: "",
      },
    }),

    // Delete the shop
    prisma.shop.delete({
      where: { shopDomain },
    }),
  ]);

  console.log(`Shop data completely deleted for: ${shopDomain}`);
}
