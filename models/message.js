import mongoose from "mongoose";
const { Schema } = mongoose;

const messageSchema = new Schema({
    message:{
        type : String, 
        required : true,
    },
    toMess:{
        type : Schema.Types.ObjectId,
        ref : "Mess"
    }
}
);


const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
