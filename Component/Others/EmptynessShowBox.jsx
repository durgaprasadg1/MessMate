import { useRouter } from "next/navigation";
const EmptynessShowBox = ({heading, link, linkmsg}) => {
  const router = useRouter();
  return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-full flex items-center justify-center py-8">
            <div className="p-6 bg-white max-w-md w-full rounded-2xl shadow-md border border-gray-100 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {heading}
              </h3>
              {link === "" || linkmsg === "" ? null :
              <p className="text-sm text-gray-500">
                 <br /> <button className="hover:underline" onClick={() => router.push(link)}>{linkmsg}</button> 
              </p>
        }          
            </div>
          </div>
        </div>
  )
}

export default EmptynessShowBox