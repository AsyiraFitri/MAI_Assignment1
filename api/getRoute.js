const axios = require('axios');

// Replace with your Google API key
const GOOGLE_API_KEY = 'AIzaSyAOanXt4eoGWy6z4Au9phjX3AGhMfdfbf8';

// Coordinates for Ngee Ann Polytechnic
const ngeeAnnPolyCoordinates = {
  lat: 1.3331,
  lng: 103.7759,
};

// Helper function to get autocomplete suggestions within Ngee Ann Polytechnic
async function getPlaceSuggestion(input) {
  const radius = 500; // in meters

  const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&location=${ngeeAnnPolyCoordinates.lat},${ngeeAnnPolyCoordinates.lng}&radius=${radius}&strictbounds=true&key=${GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(placesUrl);
    const predictions = response.data.predictions;
    if (predictions.length > 0) {
      return predictions[0].description; // Suggest the first match as the corrected location
    }
    return null; // No suggestions found
  } catch (error) {
    console.error('Autocomplete Error:', error);
    return null;
  }
}

// Helper function to process 'from' or 'to' location
async function processLocation(location) {
  if (!location) {
    // Default to Ngee Ann Polytechnic if no location is provided
    return ngeeAnnPolyCoordinates;
  }

  // Get suggested location using Autocomplete
  const suggestedLocation = await getPlaceSuggestion(location);
  
  // Return either the suggested location or the default coordinates
  if (suggestedLocation) {
    // Attempt to get coordinates of the suggested place for more accuracy
    return await getCoordinatesFromAddress(suggestedLocation);
  }

  return ngeeAnnPolyCoordinates; // Default if no suggestion found
}

// Geocode a location (get its coordinates from an address or name)
async function getCoordinatesFromAddress(address) {
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await axios.get(geocodeUrl);
    const location = response.data.results[0]?.geometry?.location;
    if (location) {
      return location;
    }
    return ngeeAnnPolyCoordinates; // Default coordinates if geocoding fails
  } catch (error) {
    console.error('Geocoding Error:', error);
    return ngeeAnnPolyCoordinates; // Default coordinates in case of failure
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { from, to, mode = "walking" } = req.body; // Default mode to "walking"

  try {
    // Step 1: Get the corrected or suggested 'from' and 'to' locations using Autocomplete
    const fromLocation = await processLocation(from);
    const toLocation = await processLocation(to);

    // Step 2: Make the API call to get directions
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLocation.lat},${fromLocation.lng}&destination=${toLocation.lat},${toLocation.lng}&mode=${mode}&key=${GOOGLE_API_KEY}`;

    const response = await axios.get(directionsUrl);
    const steps = response.data.routes[0]?.legs[0]?.steps || [];

    // Prepare the directions step-by-step
    const directions = steps.map((step, i) => {
      const instruction = step.html_instructions.replace(/<[^>]+>/g, ''); // Remove HTML tags
      const distance = step.distance.text;
      return `${i + 1}. ${instruction} (${distance})`;
    });

    // Prepare the Google Maps link for easy navigation
    const gmapLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=${mode}`;

    // Return the route output with directions and Google Maps link
    return res.status(200).json({
      output: `Route from ${from} to ${to}:\n\n${directions.join('\n')}\n\n📍 Google Maps: ${gmapLink}`
    });

  } catch (error) {
    console.error('Error fetching directions:', error);
    return res.status(500).json({ output: "Sorry, I couldn't retrieve the route. Please try again later." });
  }
};
