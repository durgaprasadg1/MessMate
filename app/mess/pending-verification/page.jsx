'use client'
import VerificationComponent from '../../../Component/VerificationComponent'
import { useSession } from 'next-auth/react'
import NotFound from '../../not-found'
const PendingVerification = () => {
  const { data: session } = useSession();

  if(session && session?.user?.isAdmin){
   
    console.log("Sesion Verification DOne")
    return (
      <div>
          <VerificationComponent/>
      </div>
    )
  }
  else{
    
    return <NotFound/>
  }

}

export default PendingVerification