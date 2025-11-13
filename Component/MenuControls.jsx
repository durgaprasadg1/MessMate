export default function MenuControls({
  mealTime,
  setMealTime,
  menutype,
  setMenutype,
  category,
}) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium">Meal Time</label>
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
        <label className="block text-sm font-medium">Menu Type</label>
        <select
          value={menutype}
          onChange={(e) => setMenutype(e.target.value)}
          className="mt-1 block w-full border rounded-md px-3 py-2"
        >
          <option value="vegMenu">Veg</option>
          {category !== "veg" && <option value="nonVegMenu">Non Veg</option>}
        </select>
      </div>
    </div>
  );
}
