const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const GOOGLE_API_KEY = 'AIzaSyAOanXt4eoGWy6z4Au9phjX3AGhMfdfbf8';

app.post('/get-route', async (req, res) => {
  const { from, to, mode = "transit" } = req.body;

  const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&mode=${mode}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(directionsUrl);
    const steps = response.data.routes[0]?.legs[0]?.steps || [];
    const directions = steps.map((step, i) => {
      const instruction = step.html_instructions.replace(/<[^>]+>/g, ''); // Remove HTML tags
      const distance = step.distance.text;
      return `${i + 1}. ${instruction} (${distance})`;
    });

    const gmapLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=${mode}`;

    res.json({
      output: `Route from ${from} to ${to}:\n\n${directions.join('\n')}\n\n📍 Google Maps: ${gmapLink}`
    });

  } catch (error) {
    res.json({ output: "Sorry, I couldn't retrieve the route. Please try again later." });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
