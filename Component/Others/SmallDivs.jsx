import { useRouter } from "next/navigation";
const SmallDivs = ({desc, count, link}) => {
  const router = useRouter();
  return (
    <div className="p-4 bg-white rounded-lg shadow hover:shadow-md hover:cursor-pointer transition flex flex-col items-center justify-center " onClick={()=> router.push(link)}>
            <p className="text-sm text-gray-500">{desc}</p>
            <p className="text-2xl font-bold mt-2">{count}</p>
    </div>
  )
}

export default SmallDivs