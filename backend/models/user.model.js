const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "employee"], default: "employee", index: true },
    phone: { type: String, default: "" },
    avatar: { url: String, publicId: String },
    isActive: { type: Boolean, default: true, index: true },

    // employee meta
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = function (raw) {
  return bcrypt.compare(raw, this.password);
};

module.exports = mongoose.model("User", UserSchema);
