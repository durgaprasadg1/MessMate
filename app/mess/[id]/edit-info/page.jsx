import EditMess from '../../../../Component/EditMess'

const MessInfoEdit = async({params}) => {
 const {id} = await params;
   return (
     <div>
       <EditMess messID={id}/> 
     </div>
   )
}

export default MessInfoEdit