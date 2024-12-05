const mongoose = require('mongoose');

// Create a schema for colors
const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hex: { type: String, required: true }, // Hex code for the color
  },
  { timestamps: true } // Optional, if you want to keep track of created/updated timestamps
);

// Create and export the Color model
const Color = mongoose.model('Color', colorSchema);

module.exports = Color;
