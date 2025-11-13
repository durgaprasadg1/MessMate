import Link from 'next/link'
import { useState } from 'react';
const Botton = ({text, link, mess, functionAfterClick}) => {
  let [loading, setLoading ] = useState(false);

  const handleClick = () =>{
    setLoading(true);
    functionAfterClick();
    setLoading(false);

  }
  return (
   <Link href={link} className="mt-6 block">
      <button className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-black transition" onClick={handleClick} disabled={loading}> 
        {text}
      </button>
    </Link>
  )
}

export default Botton