import mongoose from "mongoose";
import { minLength } from "zod";
import { required } from "zod/mini";

const { Schema } = mongoose;

const ownerSchema = new Schema(
  {
    name: { 
        type : String,
        required: true
    }, 
    email : {
        type : String, 
        minLength:3,
        required : true,
    },
    upi : {
        type : String, 
        minLength:4,
        required : true,
    },
    mess:{
        type: Schema.Types.ObjectId,
        ref : "Mess",
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref : "Consumer",
    }
  }
)