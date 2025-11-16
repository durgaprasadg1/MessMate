import EditConsumer from '@/Component/Consumer/EditConsumer';

const EditInfoOfConsumer = async({params}) => {
  const {consumerid} = await params;
  return (
    <div>
      <EditConsumer consumerid={consumerid}/> 
      
    </div>
  )
}

export default EditInfoOfConsumer