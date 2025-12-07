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

      if (!res.ok) toast.error( "Failed");
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
  if (loading) return 
  <div className="min-h-screen flex items-center justify-center bg-gray-950">
  <Loading /></div>
  ;

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label labelName="Meal Time" />
            <select   
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            >
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>
          <div>
            <Label labelName="Menu Type" />
            <select
              value={menutype}
              onChange={(e) => setMenutype(e.target.value)}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            >
              {category === "veg" ? (
                <option value="vegMenu">Veg</option>
              ) : (
                <>
                  <option value="vegMenu">Veg</option>
                  <option value="nonVegMenu">Non Veg</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {dishes.map((dish, di) => (
            <div key={di} className="border rounded-md p-3">
              <div className="flex justify-between items-center">
                <div className="w-3/4">
                  <Label labelName="Dish Name" />
                  <input
                    value={dish.name}
                    onChange={(e) => updateDish(di, { name: e.target.value })}
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                    placeholder="e.g., South Thali"
                    required
                  />
                </div>
                <div className="w-1/4 pl-3">
                  <Label labelName="Price" />
                  <input
                    type="number"
                    value={dish.price}
                    onChange={(e) => updateDish(di, { price: e.target.value })}
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                    placeholder="₹"
                  />
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {dish.items.map((item, ii) => (
                  <div key={ii} className="flex gap-2 items-center">
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
                      className="flex-1 border rounded-md px-2 py-1"
                      placeholder="Item name"
                      required
                    />
                    <input
                      type="number"
                      value={item?.price}
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
                      className="w-28 border rounded-md px-2 py-1"
                      placeholder="Price"
                    />
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
                                        ? { ...it, isLimited: e.target.checked }
                                        : it
                                    ),
                                  }
                                : d
                            )
                          )
                        }
                      />{" "}
                      Limited
                    
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
                                      ? { ...it, limitCount: e.target.value }
                                      : it
                                  ),
                                }
                              : d
                          )
                        )
                      }
                      className="w-20 border rounded-md px-2 py-1"
                      placeholder="Limit"
                      style={{
                        display: item.isLimited ? "inline-block" : "none",
                      }}
                    />
                    <button
                      type="button"
                      className="text-red-600 ml-2"
                      onClick={() => removeItem(di, ii)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div>
                  <button
                    type="button"
                    className="text-sm text-blue-600"
                    onClick={() => addItem(di)}
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              <div className="text-right mt-3">
                <button
                  type="button"
                  className="text-sm text-red-600"
                  onClick={() => removeDish(di)}
                >
                  Remove Dish
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={replaceWholeMenu}
              onChange={(e) => setReplaceWholeMenu(e.target.checked)}
              className="mt-3"
            />
            <span className="text-sm text-slate-600">Replace entire menu</span>
          </label>
          <button
            type="button"
            className="px-4 py-2  text-gray-800  border-2 border-gray-800 p-1  rounded hover:bg-gray-800 hover:text-white transition duration-300 ml-auto"
            onClick={() => addDish()}
          >
            Add Dish
          </button>
          

          <button
            type="submit"
            disabled={loading}
                        className="px-4 py-2 bg-gray-800  text-gray-100 rounded  hover:bg-white transition-all duration-300 hover:text-gray-800 border-2 border-gray-800"

          >
            {loading ? "Saving..." : "Save Menu"}
          </button>
        </div>
      </form>
    </div>
  );
}
