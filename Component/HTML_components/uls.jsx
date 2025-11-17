import { useContext } from 'react'
import { tableContext } from '@/hooks/tableContext'
import { useRouter } from 'next/navigation'

const ULs = () => {
    const router = useRouter();
    const handleClick = () => {
        router.push('/admin/pending-verification');
      }
    const { pendingMesses} = useContext(tableContext)  || {};
  return (
    <div>
        <ul className="text-sm text-gray-700 space-y-2">
              {pendingMesses.map((m) => (
                <li key={m._id} className="flex items-center justify-between">
                  <span>{m.name}</span>
                  <button
                    onClick={() =>
                      handleClick()
                    }
                    className="px-3 py-1 bg-yellow-500 text-white rounded-md"
                  >
                    Review
                  </button>
                </li>
              ))}

              {pendingMesses.length === 0 && (
                ""
              )}
            </ul></div>
  )
}

export default ULs