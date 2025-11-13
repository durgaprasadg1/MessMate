'use client'
import VerificationComponent from '../../../Component/VerificationComponent'
import { useSession } from 'next-auth/react'
import NotFound from '../../not-found'
const PendingVerification = () => {
  const { data: session } = useSession();
  if(session && session?.user?.isAdmin){
    return (
      <div>
          <VerificationComponent/>
      </div>
    )
  }
  else{
    <NotFound/>
  }

}

export default PendingVerification