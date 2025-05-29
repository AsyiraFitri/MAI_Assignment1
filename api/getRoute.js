const axios = require('axios');

// Replace with your Google API key
const GOOGLE_API_KEY = 'AIzaSyAOanXt4eoGWy6z4Au9phjX3AGhMfdfbf8';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { from, to, mode = "walking" } = req.body; // Default mode to "walking"

  // Coordinates for Ngee Ann Polytechnic 
  const ngeeAnnPolyCoordinates = {
    lat: 1.3331,
    lng: 103.7759,
  };

  // If "from" and "to" are within NP, you can use NP coordinates as origin and destination
  const fromLocation = from ? encodeURIComponent(from) : `${ngeeAnnPolyCoordinates.lat},${ngeeAnnPolyCoordinates.lng}`;
  const toLocation = to ? encodeURIComponent(to) : `${ngeeAnnPolyCoordinates.lat},${ngeeAnnPolyCoordinates.lng}`;

  const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLocation}&destination=${toLocation}&mode=${mode}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(directionsUrl);
    const steps = response.data.routes[0]?.legs[0]?.steps || [];
    
    // Prepare the directions step-by-step
    const directions = steps.map((step, i) => {
      const instruction = step.html_instructions.replace(/<[^>]+>/g, ''); // Remove HTML tags
      const distance = step.distance.text;
      return `${i + 1}. ${instruction} (${distance})`;
    });

    const gmapLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=${mode}`;

    return res.status(200).json({
      output: `Route from ${from} to ${to}:\n\n${directions.join('\n')}\n\n📍 Google Maps: ${gmapLink}`
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ output: "Sorry, I couldn't retrieve the route. Please try again later." });
  }
};
