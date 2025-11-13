export default function ItemRow({ item, di, ii, removeItem, updateItem }) {
  return (
    <div className="flex gap-2 items-center">
      <input
        value={item.name}
        onChange={(e) => updateItem(di, ii, { name: e.target.value })}
        className="flex-1 border rounded-md px-2 py-1"
        placeholder="Item name"
        required
      />

      <input
        type="number"
        value={item.price}
        onChange={(e) => updateItem(di, ii, { price: e.target.value })}
        className="w-28 border rounded-md px-2 py-1"
        placeholder="Price"
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!item.isLimited}
          onChange={(e) => updateItem(di, ii, { isLimited: e.target.checked })}
        />{" "}
        Limited
      </label>

      {item.isLimited && (
        <input
          type="number"
          value={item.limitCount}
          onChange={(e) => updateItem(di, ii, { limitCount: e.target.value })}
          className="w-20 border rounded-md px-2 py-1"
          placeholder="Limit"
        />
      )}

      <button
        type="button"
        className="text-red-600 ml-2"
        onClick={() => removeItem(di, ii)}
      >
        Remove
      </button>
    </div>
  );
}
