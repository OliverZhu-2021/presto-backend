import mongoose from "mongoose";
import User from "./user";

const { Schema, model } = mongoose;

const adminsSchema = new Schema({
  admins: {
    type: Map,
    of: User.schema
  }
});

const Admins = model('Admins', adminsSchema);
export default Admins;

