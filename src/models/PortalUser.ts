import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IPortalUser extends Document {
  id:       string;   // login ID
  password: string;   // bcrypt hashed
  type:     string;   // e.g. "family" | "test" | "reselling"
  isActive: boolean;

  // ── Single-session enforcement ──────────────────────────────────────────
  // The id of the one live session. "" = no live session. A login from a
  // different device while this is set + unexpired locks the whole account.
  sessionId:        string;
  sessionExpiresAt: Date | null;

  // ── Scheduled auto-disable ──────────────────────────────────────────────
  // When set + in the future: account still works but shows a countdown
  // warning. Once passed, the next login/request flips isActive to false.
  disableScheduledAt: Date | null;

  // ── Booking cooldown ────────────────────────────────────────────────────
  // Minimum minutes between two successful bookings. 0 = no limit.
  bookingCooldownMinutes: number;
  lastBookingAt:          Date | null;

  comparePassword(plain: string): Promise<boolean>;
}

const PortalUserSchema = new Schema<IPortalUser>(
  {
    id:       { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    type:     { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },

    sessionId:        { type: String,  default: "" },
    sessionExpiresAt: { type: Date,    default: null },

    disableScheduledAt: { type: Date, default: null },

    bookingCooldownMinutes: { type: Number, default: 0 },
    lastBookingAt:          { type: Date,   default: null },
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
