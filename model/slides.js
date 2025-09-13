import mongoose from "mongoose";
import Element from "./element";

const { Schema, model } = mongoose;

const slidesSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  thumbnail: String,
  created_at: String,
  last_update: String,
  pages: [{
    id: {
      type: String,
      required: true,
    },
    elements: {
      type: Map,
      of: Element.schema
    },
    fontFamily: String,
    bgColor: String
  }]       
});

const Slides = model('Slides', slidesSchema);
export default Slides;

