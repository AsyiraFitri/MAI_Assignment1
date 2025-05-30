const axios = require('axios');

// Replace with your Google API key
const GOOGLE_API_KEY = 'AIzaSyAOanXt4eoGWy6z4Au9phjX3AGhMfdfbf8';

// Helper function to get autocomplete suggestions
async function getPlaceSuggestion(input, location) {
  const radius = 1000; // Search radius (in meters)
  const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&location=${location.lat},${location.lng}&radius=${radius}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(placesUrl);
    const predictions = response.data.predictions;

    if (predictions.length > 0) {
      return predictions[0].description;
    }
    return null;
  } catch (error) {
    console.error('Autocomplete Error:', error);
    return null;
  }
}


// Helper function to get coordinates from Google Places
async function getCoordinatesFromAddress(address) {
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(geocodeUrl);
    const location = response.data.results[0]?.geometry?.location;
    if (location) {
      return location; // Return the coordinates (lat, lng)
    }
    return null; // No location found
  } catch (error) {
    console.error('Geocoding Error:', error);
    return null; // Return null in case of failure
  }
}

// Helper function to fetch directions with detailed steps
async function getDirections(fromCoordinates, toCoordinates, mode = "walking") {
  const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${fromCoordinates.lat},${fromCoordinates.lng}&destination=${toCoordinates.lat},${toCoordinates.lng}&mode=${mode}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(directionsUrl);
    const steps = response.data.routes[0]?.legs[0]?.steps || [];

    if (steps.length === 0) {
      return null; // No route found
    }

    // Prepare the directions step-by-step
    const directions = steps.map((step, i) => {
      const instruction = step.html_instructions.replace(/<[^>]+>/g, ''); // Remove HTML tags
      const distance = step.distance.text;
      return `${i + 1}. ${instruction} (${distance})`;
    });

    return directions; // Return directions as an array
  } catch (error) {
    console.error('Error fetching directions:', error);
    return null; // Return null if directions fetching fails
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Get session variables (from and to locations)
  const { from, to, mode = "walking", watsonxSession } = req.body;

  // Default location (Ngee Ann coordinates, or WatsonX session)
  const location = watsonxSession?.location || { lat: 1.3331, lng: 103.7759 };

  try {
    // Step 1: Get the corrected 'from' and 'to' locations using Autocomplete
    const fromLocation = await getPlaceSuggestion(from, location);
    const toLocation = await getPlaceSuggestion(to, location);

    if (!fromLocation || !toLocation) {
      return res.status(404).json({ output: "Unable to retrieve location suggestions for 'from' or 'to'." });
    }

    // Step 2: Get coordinates for both 'from' and 'to' locations
    const fromCoordinates = await getCoordinatesFromAddress(fromLocation);
    const toCoordinates = await getCoordinatesFromAddress(toLocation);

    if (!fromCoordinates || !toCoordinates) {
      return res.status(404).json({ output: "Unable to retrieve coordinates for one or both locations." });
    }

    // Step 3: Get directions
    const directions = await getDirections(fromCoordinates, toCoordinates, mode);

    // Check if directions are too short
    if (!directions || directions.length === 0) {
      return res.status(404).json({
        output: `No detailed route found from ${from} to ${to}. You can use the Google Maps link below for navigation.`
      });
    }

    // Create the Google Maps link correctly
    const gmapLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=${mode}`;

    // If the route is too short, provide a more suitable message
    if (directions.length === 1 && directions[0].includes('head')) {
      return res.status(200).json({
        output: `📍 Google Maps: ${gmapLink}`
      });
    }

    return res.status(200).json({
      output: `📍 Google Maps: ${gmapLink}`
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ output: "Sorry, an error occurred. Please try again later." });
  }
};
