import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISiteSettings extends Document {
  // Singleton row lookup key — always "default"
  key:               string;
  warningEnabled:    boolean;
  warningMessage:    string;
  warningStartDate:  Date;
  lockoutEnabled:    boolean;
  createdAt:         Date;
  updatedAt:         Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    key:              { type: String, required: true, unique: true, default: "default" },
    warningEnabled:   { type: Boolean, default: true },
    warningMessage:   {
      type: String,
      default: "Your hosting plan is going to expire in 7 days. Please purchase a plan to avoid service interruption.",
    },
    warningStartDate: { type: Date, default: Date.now },
    lockoutEnabled:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ?? mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
