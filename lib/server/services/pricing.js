import { menuRepository } from "../repositories/messes.js";

/** Price is ALWAYS computed on the server from the stored menu - never from the client. */
export async function computePricePerPlate(mess, menutype, selectedDish) {
  let menuArray = (menutype === "vegMenu" ? mess.veg_menu : mess.non_veg_menu) || [];
  const refId = menutype === "vegMenu" ? mess.veg_menu_ref_id : mess.non_veg_menu_ref_id;
  if (refId) {
    const menuDoc = await menuRepository.getById(refId).catch(() => null);
    if (Array.isArray(menuDoc?.dishes)) menuArray = menuDoc.dishes;
  }

  let pricePerPlate = 0;
  let dishName = null;
  const hasSelection = selectedDish !== undefined && selectedDish !== null && selectedDish !== "";
  if (hasSelection) {
    const dish = menuArray[Number(selectedDish)];
    if (dish && typeof dish === "object") {
      if (Number(dish.price) > 0) pricePerPlate = Number(dish.price);
      else if (Array.isArray(dish.items) && dish.items.length) {
        pricePerPlate = dish.items.reduce((s, it) => s + (Number(it?.price) || 0), 0);
      }
      if (String(dish.name || "").trim()) dishName = String(dish.name).trim();
      else if (Array.isArray(dish.items)) {
        const names = dish.items.map((it) => String(it?.name || "").trim()).filter(Boolean);
        if (names.length) dishName = names.join(" + ");
      }
    }
  }

  if (!pricePerPlate) {
    pricePerPlate = mess.category === "veg" || menutype === "vegMenu" ? mess.veg_price || 0 : mess.non_veg_price || 0;
  }
  if (!dishName && hasSelection) dishName = String(selectedDish);
  return { pricePerPlate: Number(pricePerPlate) || 0, dishName };
}

