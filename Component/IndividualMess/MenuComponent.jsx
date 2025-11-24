const MenuComponent = ({ mess, isOwner }) => {
  return (
    <div className="w-full px-3 sm:px-6 py-4">

      {/* VEG MENU */}
      {mess.vegMenu?.length > 0 && (
        <div className="mb-6">

          {/* Label */}
          {!isOwner && (
            <div className="text-xl sm:text-2xl font-semibold bg-green-50 text-green-700 p-2 rounded-lg mb-3">
              🥬 Veg Menu
            </div>
          )}

          {mess.vegMenu.map((menu, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 shadow-sm 
                ${isOwner ? "bg-gray-600 border border-green-100" : "bg-white border"} 
                mb-4`}
            >
              <h5
                className={`text-lg font-medium mb-3 
                  ${isOwner ? "text-white" : "text-green-800"}`}
              >
                {menu.name} — ₹{menu.price}
              </h5>

              <ul className={`${isOwner ? "text-white" : "text-gray-700"} space-y-2`}>
                {menu.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex justify-between items-center text-sm border-b pb-2"
                  >
                    <span>{item.name}</span>
                    <span>
                      ₹{item.price ?? "-"}{" "}
                      {item.isLimited && (
                        <span className="ml-1 text-xs text-red-600">
                          (Limit: {item.limitCount})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="my-4 border-t border-dashed border-gray-300"></div>

      {/* NON VEG MENU */}
      {mess.nonVegMenu?.length > 0 && (
        <div className="mt-4">

          {!isOwner && (
            <div className="text-xl sm:text-2xl font-semibold text-orange-700 bg-orange-100 p-2 rounded-lg mb-3">
              🍗 Non-Veg Menu
            </div>
          )}

          {mess.nonVegMenu.map((menu, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 shadow-sm 
                ${isOwner ? "bg-gray-600 border border-green-100" : "bg-white border"} 
                mb-4`}
            >
              <h5
                className={`text-lg font-medium mb-3 
                  ${isOwner ? "text-white" : "text-green-800"}`}
              >
                {menu.name} — ₹{menu.price}
              </h5>

              <ul className={`${isOwner ? "text-white" : "text-gray-700"} space-y-2`}>
                {menu.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex justify-between items-center text-sm border-b pb-2"
                  >
                    <span>{item.name}</span>
                    <span>
                      ₹{item.price ?? "-"}{" "}
                      {item.isLimited && (
                        <span className="ml-1 text-xs text-red-600">
                          (Limit: {item.limitCount})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default MenuComponent;
