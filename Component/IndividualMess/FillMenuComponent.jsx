"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import Loading from "@/Component/Others/Loading";
import Label from "../Helper/Label";
export default function MessMenuComponent({
  messId,
  initial = null,
  category = "both",
  mess = null,
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [dishes, setDishes] = useState(() => initial?.dishes || []);
  const [mealTime, setMealTime] = useState(initial?.mealTime || "lunch");
  const [menutype, setMenutype] = useState(
    initial?.menutype || (category === "veg" ? "vegMenu" : "vegMenu")
  );
  const [loading, setLoading] = useState(false);
  const [originalDishIds, setOriginalDishIds] = useState([]);
  const [replaceWholeMenu, setReplaceWholeMenu] = useState(false);

  useEffect(() => {
    if (!dishes.length) addDish();
  }, []);

  useEffect(() => {
    if (!mess) return;
    const source =
      menutype === "vegMenu" ? mess.vegMenu || [] : mess.nonVegMenu || [];
    if (source && source.length) {
      const norm = source.map((s) => ({
        name: s.name || "",
        price: s.price ?? "",
        items: s.items || [
          { name: "", price: "", isLimited: false, limitCount: "" },
        ],
      }));
      setDishes(norm);
    }
  }, [menutype, mess]);

  useEffect(() => {
    let mounted = true;
    async function fetchMenuDoc() {
      try {
        const res = await fetch(
          `/api/mess/${messId}/menu?menutype=${menutype}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        if (data && data.dishes) {
          const norm = data.dishes.map((s) => ({
            _id: s._id,
            name: s.name || "",
            price: s.price ?? "",
            items: s.items || [
              { name: "", price: "", isLimited: false, limitCount: "" },
            ],
          }));
          setDishes(norm);
          setMealTime(data.mealTime || mealTime);
          setOriginalDishIds(
            norm.map((d) => d._id && d._id.toString()).filter(Boolean)
          );
        }
      } catch (e) {
        console.warn("Could not fetch menu doc", e);
      }
    }
    fetchMenuDoc();
    return () => {
      mounted = false;
    };
  }, [menutype, messId]);

  function addDish(prefill) {
    setDishes((prev) => {
      const next = [...prev];
      next.push({
        name: prefill?.name || "",
        price: prefill?.price ?? "",
        items: prefill?.items || [
          { name: "", price: "", isLimited: false, limitCount: "" },
        ],
      });
      return next;
    });
  }

  function removeDish(idx) {
    setDishes((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateDish(idx, patch) {
    setDishes((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, ...patch } : d))
    );
  }

  function addItem(dishIdx, prefill) {
    setDishes((prev) =>
      prev.map((d, i) =>
        i === dishIdx
          ? {
              ...d,
              items: [
                ...d.items,
                prefill || {
                  name: "",
                  price: "",
                  isLimited: false,
                  limitCount: "",
                },
              ],
            }
          : d
      )
    );
  }

  function removeItem(dishIdx, itemIdx) {
    setDishes((prev) =>
      prev.map((d, i) =>
        i === dishIdx
          ? { ...d, items: d.items.filter((_, j) => j !== itemIdx) }
          : d
      )
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const currentIds = dishes
        .map((d) => (d._id ? d._id.toString() : null))
        .filter(Boolean);
      const deletedDishIds = originalDishIds.filter(
        (id) => !currentIds.includes(id)
      );

      const payload = {
        mealTime,
        menutype,
        dishes,
        replace: replaceWholeMenu,
        deletedDishIds,
      };
      const res = await fetch(`/api/mess/${messId}/menu`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) toast.error("Failed");
      toast.success("Menu saved");
      router.refresh();
      router.push(`/owner/${session?.user?.id}/mess-details`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save menu");
    } finally {
      setLoading(false);
    }
  }
  if (loading) return;
  <div className="min-h-screen flex items-center justify-center bg-gray-950">
    <Loading />
  </div>;

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-sm">
      {category !== "veg" && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 sm:gap-3 p-2 bg-gray-800 rounded-lg">
            <button
              type="button"
              onClick={() => setMenutype("vegMenu")}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded font-semibold transition-all duration-200 ${
                menutype === "vegMenu"
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              🥗 Veg Menu
            </button>
            <button
              type="button"
              onClick={() => setMenutype("nonVegMenu")}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded font-semibold transition-all duration-200 ${
                menutype === "nonVegMenu"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              🍗 Non-Veg Menu
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <label htmlFor="mealTime" className="block text-sm font-medium text-white"  >Meal Time</label>
            <select
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              className="mt-2 block w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="lunch">🌞 Lunch</option>
              <option value="dinner">🌙 Dinner</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {dishes.length === 0 && (
            <div className="text-center py-8 bg-gray-800 rounded-lg border border-dashed border-gray-600">
              <p className="text-gray-400 mb-3">No dishes added yet</p>
              <button
                type="button"
                onClick={() => addDish()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Add Your First Dish
              </button>
            </div>
          )}

          {dishes.map((dish, di) => (
            <div
              key={di}
              className="border border-gray-700 bg-gray-800 rounded-lg p-4 sm:p-5 shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                <div className="flex-1">
                  <label htmlFor="dishName" className="block text-sm font-medium text-white"  >Dish Name</label>
                  <input
                    value={dish.name}
                    onChange={(e) => updateDish(di, { name: e.target.value })}
                    className="mt-2 block w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., South Indian Thali"
                    required
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label htmlFor="price" className="block text-sm font-medium text-white"  >Price (₹)</label>
                  <input
                    type="number"
                    value={dish.price ?? ""}
                    onChange={(e) => updateDish(di, { price: e.target.value })}
                    className="mt-2 block w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white"  >Menu Items</label>
                  <button
                    type="button"
                    className="text-xs sm:text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    onClick={() => addItem(di)}
                  >
                    + Add Item
                  </button>
                </div>

                {dish.items.map((item, ii) => (
                  <div
                    key={ii}
                    className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-gray-700 p-2 rounded border border-gray-600"
                  >
                    <input
                      value={item.name}
                      onChange={(e) =>
                        setDishes((prev) =>
                          prev.map((d, i) =>
                            i === di
                              ? {
                                  ...d,
                                  items: d.items.map((it, idx) =>
                                    idx === ii
                                      ? { ...it, name: e.target.value }
                                      : it
                                  ),
                                }
                              : d
                          )
                        )
                      }
                      className="flex-1 min-w-0 border border-gray-500 bg-gray-800 text-white rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Item name (e.g., Rice)"
                      required
                    />
                    <input
                      type="number"
                      value={item?.price ?? ""}
                      onChange={(e) =>
                        setDishes((prev) =>
                          prev.map((d, i) =>
                            i === di
                              ? {
                                  ...d,
                                  items: d.items.map((it, idx) =>
                                    idx === ii
                                      ? { ...it, price: e.target.value }
                                      : it
                                  ),
                                }
                              : d
                          )
                        )
                      }
                      className="w-full sm:w-24 border border-gray-500 bg-gray-800 text-white rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Price"
                    />

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-300 whitespace-nowrap cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!item.isLimited}
                          onChange={(e) =>
                            setDishes((prev) =>
                              prev.map((d, i) =>
                                i === di
                                  ? {
                                      ...d,
                                      items: d.items.map((it, idx) =>
                                        idx === ii
                                          ? {
                                              ...it,
                                              isLimited: e.target.checked,
                                            }
                                          : it
                                      ),
                                    }
                                  : d
                              )
                            )
                          }
                          className="w-4 h-4 rounded border-gray-500 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                        />
                        {"        "}Limited
                      </label>

                      {item.isLimited && (
                        <input
                          type="number"
                          value={item.limitCount ?? ""}
                          onChange={(e) =>
                            setDishes((prev) =>
                              prev.map((d, i) =>
                                i === di
                                  ? {
                                      ...d,
                                      items: d.items.map((it, idx) =>
                                        idx === ii
                                          ? {
                                              ...it,
                                              limitCount: e.target.value,
                                            }
                                          : it
                                      ),
                                    }
                                  : d
                              )
                            )
                          }
                          className="w-16 border border-gray-500 bg-gray-800 text-white rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Qty"
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      className="text-xs sm:text-sm px-2 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition whitespace-nowrap w-full sm:w-auto"
                      onClick={() => removeItem(di, ii)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-right mt-4">
                <button
                  type="button"
                  className="text-sm px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  onClick={() => removeDish(di)}
                >
                  🗑️ Remove Dish
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-gray-800 p-4 rounded-lg border border-gray-700">
          <label className="inline-flex items-center gap-2 text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={replaceWholeMenu}
              onChange={(e) => setReplaceWholeMenu(e.target.checked)}
              className="w-4 h-4 rounded  border-gray-500 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer mt-2"
            />
            <span className="text-sm ">
              {"           "}Replace entire {menutype === "vegMenu" ? "Veg" : "Non-Veg"} menu
            </span>
          </label>

          <div className="flex gap-2 sm:ml-auto">
            <button
              type="button"
              className="flex-1 sm:flex-none px-4 py-2.5 text-white bg-blue-600 hover:bg-blue-700 border-2 border-blue-600 rounded transition duration-300 font-medium"
              onClick={() => addDish()}
            >
              ➕ Add Dish
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded transition-all duration-300 border-2 border-green-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Saving..."
                : `💾 Save ${menutype === "vegMenu" ? "Veg" : "Non-Veg"} Menu`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
