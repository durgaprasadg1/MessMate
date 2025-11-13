import EditConsumer from '../../../../Component/EditConsumer';

const EditInfoOfConsumer = async({params}) => {
  const {consumerid} = await params;
  // console.log(" MINE - "+ consumerid)
  return (
    <div>
      <EditConsumer consumerid={consumerid}/> 
      
    </div>
  )
}

export default EditInfoOfConsumer