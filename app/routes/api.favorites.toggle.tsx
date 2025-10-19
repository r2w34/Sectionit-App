import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../lib/shopify.server";
import { prisma } from "../lib/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const sectionId = formData.get("sectionId") as string;

  if (!sectionId) {
    return json({ error: "Section ID is required" }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    return json({ error: "Shop not found" }, { status: 404 });
  }

  // Check if already favorited
  const existing = await prisma.favorite.findFirst({
    where: {
      shopId: shop.id,
      sectionId,
    },
  });

  if (existing) {
    // Remove from favorites
    await prisma.favorite.delete({
      where: { id: existing.id },
    });

    return json({ isFavorite: false, message: "Removed from favorites" });
  } else {
    // Add to favorites
    await prisma.favorite.create({
      data: {
        shopId: shop.id,
        sectionId,
      },
    });

    return json({ isFavorite: true, message: "Added to favorites" });
  }
};
