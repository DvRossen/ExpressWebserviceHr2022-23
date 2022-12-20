const mongoose = require("mongoose");

//schema structure
const BuildSchema = new mongoose.Schema(
  {
    title: String,
    theme: String,
    date: Date,
    author: String,
    height: String,
  },
  {
    toJSON: {
      virtuals: true,
    },
  }
);

//links
BuildSchema.virtual("_links").get(function () {
  return {
    self: {
      href: `${process.env.BASE_URI}/builds/${this._id}`,
    },
    collection: {
      href: `${process.env.BASE_URI}/builds`,
    },
  };
});

//object + export
const Build = mongoose.model("Build", BuildSchema);

module.exports = { Build };
