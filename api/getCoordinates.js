const ibmdb = require('ibm_db');
const bodyParser = require('body-parser');
const cors = require('cors');

module.exports = async (req, res) => {
  const userInput = req.query.synonym;
  if (!userInput) {
    return res.status(400).json({ error: 'No synonym provided' });
  }

  const db2ConnString = `DATABASE=${process.env.DB2_DATABASE};HOSTNAME=${process.env.DB2_HOST};PORT=${process.env.DB2_PORT};USER=${process.env.DB2_USER};PASSWORD=${process.env.DB2_PASSWORD};SECURITY=SSL`;

  try {
    const conn = await ibmdb.open(db2ConnString);
    
    const query = `SELECT coordinates FROM location_synonyms WHERE synonyms LIKE ?`;
    const rows = await conn.query(query, [`%${userInput}%`]);
    
    conn.close();
    
    if (rows.length > 0) {
      return res.json({ coordinates: rows[0].COORDINATES });
    } else {
      return res.status(404).json({ error: 'No matching coordinates found' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Database connection or query failed', details: err.message });
  }
};
