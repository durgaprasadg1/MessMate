import { is } from "zod/locales"


const MenuComponent = ({ mess, isOwner }) => {
  return (
    <div >
        {mess.vegMenu?.length > 0 && (
            <div className="">
              {!isOwner ? <h2 className= "text-2xl font-semibold text-green-300 mb-3">
                
              </h2> : ""
}
              {mess.vegMenu.map((menu, i) => (
                <div
                  key={i}
                  className={isOwner?"mb-6 border rounded-xl p-4 bg-gray-600 border-green-100" : ""}
                >
                  <h3 className={isOwner?"text-lg font-medium text-white mb-2" : "text-lg font-medium text-green-800 mb-2"}>
                    {menu.name} — ₹{menu.price}
                  </h3>

                  <ul className={isOwner?"space-y-1  text-white" : "space-y-1 text-gray-700 "} >
                    {menu.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex justify-between items-center text-sm border-b pb-1"
                      >
                        <span>{item.name}</span>
                        <span>
                          ₹{item.price ?? "-"}{" "}
                          {item.isLimited && (
                            <span className="ml-2 text-xs text-red-600">
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

          {mess.nonVegMenu?.length > 0 && (
            <div className="mt-1">
              
              {
                isOwner ?  " ":  <h2 className= "text-2xl font-semibold text-red-300 mb-3">Non-Veg Menu</h2>
              }

 
              {mess.nonVegMenu.map((menu, i) => (
                <div
                  key={i}
                  className={isOwner?"mb-6 border rounded-xl p-4 bg-gray-600 " : "mb-6 border rounded-xl p-4 bg-red-600 border-red-100"}
                >
                  <h3 className={isOwner?"text-lg font-medium text-white mb-2" : "text-lg font-medium text-red-600 mb-2"}>
                    {menu.name} — ₹{menu.price}
                  </h3>

                  <ul className={isOwner?"space-y-1  text-white" : "space-y-1 text-gray-700 "} >
                    {menu.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex justify-between items-center text-sm border-b pb-1"
                      >
                        <span>{item.name}</span>
                        <span>
                          ₹{item.price ?? "-"}{" "}
                          {item.isLimited && (
                            <span className="ml-2 text-xs text-red-600">
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
  )
}

export default MenuComponent