const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Working hours for a single day
const dayHoursSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    open: { type: String, default: "09:00" },
    close: { type: String, default: "17:00" },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    studentId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "admin", "librarian"],
      default: "student",
    },
    avatar: { type: String, default: "" },

    // ── Librarian-only fields ───────────────────────────────────────────────
    // isAvailable: master toggle — if false, hidden from student booking page
    isAvailable: { type: Boolean, default: true },

    // workingHours: which days + hours the librarian accepts meetings
    workingHours: {
      mon: {
        type: dayHoursSchema,
        default: () => ({ enabled: true, open: "09:00", close: "17:00" }),
      },
      tue: {
        type: dayHoursSchema,
        default: () => ({ enabled: true, open: "09:00", close: "17:00" }),
      },
      wed: {
        type: dayHoursSchema,
        default: () => ({ enabled: true, open: "09:00", close: "17:00" }),
      },
      thu: {
        type: dayHoursSchema,
        default: () => ({ enabled: true, open: "09:00", close: "17:00" }),
      },
      fri: {
        type: dayHoursSchema,
        default: () => ({ enabled: true, open: "09:00", close: "17:00" }),
      },
      sat: {
        type: dayHoursSchema,
        default: () => ({ enabled: false, open: "09:00", close: "13:00" }),
      },
      sun: {
        type: dayHoursSchema,
        default: () => ({ enabled: false, open: "09:00", close: "13:00" }),
      },
    },

    // specialty shown on student scheduler
    specialty: { type: String, default: "" },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
