const axios = require('axios');

const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY'; // Replace with your actual Google API key

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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

    return res.status(200).json({
      output: `Route from ${from} to ${to}:\n\n${directions.join('\n')}\n\n📍 Google Maps: ${gmapLink}`
    });
  } catch (error) {
    return res.status(500).json({ output: "Sorry, I couldn't retrieve the route. Please try again later." });
  }
};
