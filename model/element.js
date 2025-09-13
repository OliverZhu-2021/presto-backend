import mongoose from "mongoose";
const { Schema, model } = mongoose;

const elementSchema = new Schema({
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  text: String,
  font_size: String,
  color: String,
  image: String,
  description: String,
  code: String,
  fontSize: String,
  url: String,
  autoPlay: Boolean,
  position_X: Number,
  position_Y: Number,
  type: String,
});

const Element = model('Element', elementSchema);
export default Element;