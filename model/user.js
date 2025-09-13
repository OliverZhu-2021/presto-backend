import mongoose from "mongoose";
import Slides from "./slides";

const { Schema, model } = mongoose;

const userSchema = new Schema ({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  store: {
    type: Map,
    of: Slides.schema
  },
  sessionActive: {
    type: Boolean,
    default: true,
  }
});

const User = model('User', userSchema);
export default User;