const ibmdb = require('ibm_db');  // DB2 Node.js driver

// This is the handler Vercel will call when the POST request is made to /api/getCoordinates
module.exports = async (req, res) => {
  // Get 'from' and 'to' from the request body
  const { from, to } = req.body;

  // Check if both 'from' and 'to' inputs are present
  if (!from || !to) {
    return res.status(400).json({ error: 'Missing "from" or "to" location input' });
  }

  // DB2 Connection string (use environment variables for security)
  const db2ConnString = `DATABASE=${process.env.DB2_DATABASE};HOSTNAME=${process.env.DB2_HOST};PORT=${process.env.DB2_PORT};USER=${process.env.DB2_USER};PASSWORD=${process.env.DB2_PASSWORD};SECURITY=SSL`;

  try {
    // Connect to DB2
    const conn = await ibmdb.open(db2ConnString);

    // Query for coordinates for both "from" and "to"
    const queryFrom = `SELECT coordinates FROM location_synonyms WHERE synonyms LIKE ?`;
    const queryTo = `SELECT coordinates FROM location_synonyms WHERE synonyms LIKE ?`;

    const rowsFrom = await conn.query(queryFrom, [`%${from}%`]);
    const rowsTo = await conn.query(queryTo, [`%${to}%`]);

    conn.close();

    // Check results and return coordinates
    if (rowsFrom.length > 0 && rowsTo.length > 0) {
      return res.json({
        from_coordinates: rowsFrom[0].COORDINATES,
        to_coordinates: rowsTo[0].COORDINATES,
      });
    } else {
      return res.status(404).json({ error: 'Coordinates not found for one or both locations' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Database connection or query failed', details: err.message });
  }
};
