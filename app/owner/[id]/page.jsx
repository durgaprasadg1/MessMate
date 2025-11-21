'use client'
import OwnerNavbar from '@/Component/Owner/OwnerNavbar'
import PersonalInfo from '@/Component/Consumer/PersonalInfo'
import { useSession } from 'next-auth/react'
const OwnerPage = () => {
  const { data: session } = useSession();
  return (
    <div className='bg-gray-800'>
        <OwnerNavbar />
        <PersonalInfo consumerid={session?.user?.id } />
    </div>
  )
}

export default OwnerPage