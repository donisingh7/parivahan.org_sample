import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IPortalUser extends Document {
  id:       string;   // login ID
  password: string;   // bcrypt hashed
  type:     string;   // e.g. "family" | "test" | "reselling"
  isActive: boolean;
  comparePassword(plain: string): Promise<boolean>;
}

const PortalUserSchema = new Schema<IPortalUser>(
  {
    id:       { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    type:     { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { id: false }
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
