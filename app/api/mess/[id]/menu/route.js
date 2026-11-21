import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound, badRequest } from "@/lib/server/errors/httpErrors";
import { menuSchema } from "@/lib/server/validation/schemas";
import { messRepository, menuRepository } from "@/lib/server/repositories/messes";
import { requireMessOwner } from "@/lib/server/auth/guards";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";

const clampMoney = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < 100000 ? n : null;
};

function cleanDishes(dishes) {
  return dishes
    .map((dish) => ({
      _id: dish?._id || dish?.id || undefined,
      name: String(dish?.name || "").trim().slice(0, 120),
      price: clampMoney(dish?.price),
      items: (Array.isArray(dish?.items) ? dish.items : [])
        .filter((it) => String(it?.name || "").trim())
        .slice(0, 50)
        .map((it) => ({
          name: String(it.name).trim().slice(0, 120),
          price: clampMoney(it.price),
          isLimited: Boolean(it.isLimited),
          limitCount: Number(it.limitCount) || null,
        })),
    }))
    .filter((d) => d.name || d.items.length > 0);
}

export const POST = createRoute({ name: "mess.menu.save", auth: "owner", uuid: ["id"], body: menuSchema }, async ({ params, session, body }) => {
  const mess = await requireMessOwner(session, params.id);
  const full = await messRepository.getForBooking(mess.id);
  if (!full) throw notFound("Mess not found");

  const { menutype, mealTime, price } = body;
  const dishes = cleanDishes(body.dishes);
  const numericPrice = price ? clampMoney(price) : null;
  if (price && numericPrice === null) throw badRequest("Invalid price");

  const menuDoc = await menuRepository.upsertForMess(mess.id, menutype, {
    mess_id: mess.id,
    menutype,
    meal_time: mealTime || "",
    dishes,
  });

  const update =
    menutype === "vegMenu"
      ? { veg_price: numericPrice ?? full.veg_price, veg_menu_ref_id: menuDoc.id, veg_menu: dishes }
      : { non_veg_price: numericPrice ?? full.non_veg_price, non_veg_menu_ref_id: menuDoc.id, non_veg_menu: dishes };
  if (mealTime) update.meal_time = mealTime;
  await messRepository.updateMenuColumns(mess.id, update);

  await deleteCacheKeys([cacheKeys.mess(mess.id), cacheKeys.messList()]);
  return json({ message: "Menu added successfully!" });
});

export const GET = createRoute({ name: "mess.menu.get", auth: "public", cache: "public", uuid: ["id"] }, async ({ params, request }) => {
  const menutype = new URL(request.url).searchParams.get("menutype");
  if (menutype && !["vegMenu", "nonVegMenu"].includes(menutype)) throw badRequest("Invalid menu type");

  if (menutype) {
    const menu = await menuRepository.getByMess(params.id, menutype);
    if (!menu) throw notFound("Menu not found");
    return json(menu);
  }
  return json(await menuRepository.getByMess(params.id));
});
