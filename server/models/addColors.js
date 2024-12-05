const express = require('express');
const Color = require('./colorModel'); // Import the Color model

const router = express.Router();

// POST route to add a new color
router.post('/add', async (req, res) => {
  try {
    const { name, hex } = req.body;
    const newColor = new Color({
      name,
      hex,
    });

    await newColor.save();
    res.status(201).json(newColor);
  } catch (error) {
    console.error('Error adding color:', error);
    res.status(500).send('Error adding color');
  }
});

// GET route to fetch all colors
router.get('/', async (req, res) => {
  try {
    const colors = await Color.find(); // Fetch all colors from the database
    res.status(200).json(colors); // Send colors as a JSON response
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).send('Error fetching colors');
  }
});

module.exports = router;
