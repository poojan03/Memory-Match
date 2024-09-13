const mongoose = require("mongoose");

const UserDetailSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    mobile: String,
    password: String,
    image: String,
    gender: String,
    profession: String
  },
  {
    collection: "UserInfo",
  }
);

const FaceLinksJoinSchema = new mongoose.Schema({
  EventName: String,
  Link: String,
  Password: String
}, {
  collection: "FaceLinksJoinDetails",
});

mongoose.model("UserInfo", UserDetailSchema);
mongoose.model("FaceLinksJoinDetails", FaceLinksJoinSchema);

module.exports = mongoose; // Exporting mongoose for use in other files
