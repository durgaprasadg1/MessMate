"use client";

const MenuComponent = ({ mess, isOwner }) => {
  const hasVeg = mess.vegMenu?.length > 0;
  const hasNonVeg = mess.nonVegMenu?.length > 0;

  // Split into two columns if both exist. Otherwise, full width.
  const gridClass = hasVeg && hasNonVeg ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "flex flex-col gap-6";

  const baseCard =
    "rounded-xl p-5 shadow-sm bg-white border border-emerald-100/60 text-emerald-900";

  return (
    <div className={`w-full ${gridClass}`}>

      {/* VEG MENU HALF */}
      {hasVeg && (
        <div className={`flex flex-col flex-1 ${!isOwner ? 'bg-green-50/50 rounded-2xl p-6 border border-green-100' : 'bg-green-50/40 rounded-2xl p-4 border border-green-100'}`}>
          {!isOwner && (
            <div className="text-xl font-bold text-green-700 mb-6 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-sm outline outline-1 outline-offset-1 outline-green-600"></div> 
              Vegetarian Menu
            </div>
          )}

          <div className="flex flex-col gap-5">
            {mess.vegMenu.map((menu, i) => (
              <div key={i} className={isOwner ? baseCard : `${baseCard} border-green-200/60`}>
                <h5 className="text-base font-extrabold mb-4 pb-2 border-b border-green-100 flex justify-between">
                  <span className="uppercase tracking-wide">{menu.name}</span>
                  <span className="text-green-600">₹{menu.price}</span>
                </h5>

                <ul className="text-slate-600 space-y-3">
                  {menu.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex justify-between items-start text-sm font-medium"
                    >
                      <span className="max-w-[70%]">{item.name}</span>
                      <div className="text-right shrink-0">
                        {item.price ? <span className="font-bold text-emerald-900">₹{item.price}</span> : ""}
                        {item.isLimited && item.limitCount !== null && item.limitCount !== undefined && item.limitCount !== 0 && (
                          <div className="text-[10px] font-bold uppercase text-orange-500 tracking-wider">
                            (Limit: {item.limitCount})
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NON-VEG MENU HALF */}
      {hasNonVeg && (
        <div className={`flex flex-col flex-1 ${!isOwner ? 'bg-rose-50/50 rounded-2xl p-6 border border-rose-100' : 'bg-rose-50/40 rounded-2xl p-4 border border-rose-100'}`}>
          {!isOwner && (
            <div className="text-xl font-bold text-rose-700 mb-6 flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-500 rounded-full outline outline-1 outline-offset-1 outline-rose-600"></div> 
              Non-Veg Menu
            </div>
          )}

          <div className="flex flex-col gap-5">
            {mess.nonVegMenu.map((menu, i) => (
              <div key={i} className={isOwner ? baseCard : `${baseCard} border-rose-200/60`}>
                <h5 className="text-base font-extrabold mb-4 pb-2 border-b border-rose-100 flex justify-between text-rose-900">
                  <span className="uppercase tracking-wide">{menu.name}</span>
                  <span className="text-rose-600">₹{menu.price}</span>
                </h5>

                <ul className="text-slate-600 space-y-3">
                  {menu.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex justify-between items-start text-sm font-medium border-b border-rose-50/50 pb-2 last:border-0"
                    >
                      <span className="max-w-[70%]">{item.name}</span>
                      <div className="text-right shrink-0">
                        {item.price ? <span className="font-bold text-slate-800">₹{item.price}</span> : ""}
                        {item.isLimited && item.limitCount !== null && item.limitCount !== undefined && item.limitCount !== 0 && (
                          <div className="text-[10px] font-bold uppercase text-orange-500 tracking-wider">
                            (Limit: {item.limitCount})
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuComponent;
