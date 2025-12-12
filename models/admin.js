import mongoose from "mongoose";
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
});

adminSchema.post("findOneAndDelete", async (admin) => {
  if (admin) {
    
  }
});

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
export default Admin;
