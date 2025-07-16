import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    telegramID: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: [
      {
        type: String,
        trim: true,
      },
    ],
    telegramLink: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

groupSchema.index({ telegramID: 1 });
groupSchema.index({ name: 1 });

groupSchema.methods.addMember = function (memberID) {
  if (!this.members.includes(memberID)) {
    this.members.push(memberID);
  }
  return this.save();
};

groupSchema.methods.removeMember = function (memberID) {
  this.members = this.members.filter((member) => member !== memberID);
  return this.save();
};

groupSchema.statics.findByTelegramID = function (telegramID) {
  return this.findOne({ telegramID });
};

const Group = mongoose.model("Group", groupSchema);

export default Group;
