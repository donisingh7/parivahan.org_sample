import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IPortalUser extends Document {
  userId:     string;   // unique login ID (e.g. DL12345 / mobile no.)
  name:       string;
  password:   string;   // bcrypt hashed
  mobileNo:   string;
  email:      string;
  vehicleNos: string[]; // linked vehicle registration numbers
  isActive:   boolean;
  createdAt:  Date;
  updatedAt:  Date;
  comparePassword(plain: string): Promise<boolean>;
}

const PortalUserSchema = new Schema<IPortalUser>(
  {
    userId:     { type: String, required: true, unique: true, trim: true },
    name:       { type: String, required: true, trim: true },
    password:   { type: String, required: true },
    mobileNo:   { type: String, required: true, trim: true },
    email:      { type: String, default: "", lowercase: true, trim: true },
    vehicleNos: { type: [String], default: [] },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

PortalUserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

PortalUserSchema.methods.comparePassword = function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.password);
};

const PortalUser: Model<IPortalUser> =
  mongoose.models.PortalUser ?? mongoose.model<IPortalUser>("PortalUser", PortalUserSchema);

export default PortalUser;
