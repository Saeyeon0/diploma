const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const colorRoutes = require('./models/colorRoutes');

const app = express();
const port = 5001;

app.use(cors());  // Enable CORS for all routes

mongoose.connect('mongodb://localhost:27017/dbcolors')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log('Error connecting to MongoDB', err);
  });

app.use(express.json());

app.use('/colors', colorRoutes);

app.listen(5001, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});
