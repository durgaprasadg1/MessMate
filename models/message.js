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

// messageSchema.index({ consumer: 1 });
// messageSchema.index({ mess: 1 });
// messageSchema.index({ razorpaymessageId: 1 }, { unique: true, sparse: true });
// messageSchema.index({ createdAt: -1 });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
