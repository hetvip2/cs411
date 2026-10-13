
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); 
app.use(express.json()); 


app.get('/api/items', async (req, res) => {
  try {
    console.log("Received limit request:", req.query.limit);
    const limit = parseInt(req.query.limit) || 20;

    const [rows] = await pool.query('SELECT * FROM Parks LIMIT ?', [limit]);
    

    const parksWithActivities = await Promise.all(
      rows.map(async (park) => {
        try {
          const [activities] = await pool.query(
            `SELECT DISTINCT a.activity_id, a.activity_name, a.description
             FROM Activities a
             INNER JOIN ParkActivities pa ON a.activity_id = pa.activity_id
             WHERE pa.park_id = ?`,
            [park.park_id]
          );
          return {
            ...park,
            activities: activities || []
          };
        } catch (actErr) {
          console.error(`Error fetching activities for park ${park.park_id}:`, actErr.message);
          return {
            ...park,
            activities: []
          };
        }
      })
    );
    
    console.log(`Returned ${parksWithActivities.length} parks for /api/items`);
    res.json(parksWithActivities);

  } catch (err) {
    console.error("Error in /api/items:", err.message);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const keyword = req.query.q || '';
    const limit = parseInt(req.query.limit) || 20;
    console.log(`Search request: keyword="${keyword}", limit=${limit}`);

    const parkSearchQuery = `
      SELECT DISTINCT p.* FROM Parks p
      WHERE p.park_name LIKE ? OR p.description LIKE ? OR p.state LIKE ?
      ORDER BY 
        CASE 
          WHEN p.park_name LIKE ? THEN 1
          WHEN p.description LIKE ? THEN 2
          ELSE 3
        END,
        p.park_name ASC
      LIMIT ?
    `;
    const searchTerm = `%${keyword}%`;
    const [parkResults] = await pool.query(parkSearchQuery, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit]);

    const activitySearchQuery = `
      SELECT DISTINCT p.* FROM Parks p
      INNER JOIN ParkActivities pa ON p.park_id = pa.park_id
      INNER JOIN Activities a ON pa.activity_id = a.activity_id
      WHERE a.activity_name LIKE ?
      AND p.park_id NOT IN (
        SELECT park_id FROM Parks 
        WHERE park_name LIKE ? OR description LIKE ? OR state LIKE ?
      )
      ORDER BY p.park_name ASC
      LIMIT ?
    `;
    const [activityResults] = await pool.query(activitySearchQuery, [searchTerm, searchTerm, searchTerm, searchTerm, limit]);

  
    const allResults = [...parkResults, ...activityResults];


    const uniqueParks = [];
    const seenIds = new Set();

    for (const park of allResults) {
      const parkId = park.park_id || park.id;
      if (!seenIds.has(parkId)) {
        seenIds.add(parkId);
        uniqueParks.push(park);
      }
    }


    const parksWithActivities = await Promise.all(
      uniqueParks.map(async (park) => {
        try {
          const [activities] = await pool.query(
            `SELECT a.activity_id, a.activity_name, a.description
             FROM Activities a
             INNER JOIN ParkActivities pa ON a.activity_id = pa.activity_id
             WHERE pa.park_id = ?
             ORDER BY a.activity_name ASC`,
            [park.park_id]
          );
          return {
            ...park,
            activities: activities || []
          };
        } catch (actErr) {
          console.error(`Error fetching activities for park ${park.park_id}:`, actErr.message);
          return {
            ...park,
            activities: []
          };
        }
      })
    );

    console.log(`Search results count: ${parksWithActivities.length} (${parkResults.length} from parks, ${activityResults.length} from activities)`);
    res.json(parksWithActivities);
  } catch (err) {
    console.error("Error in /api/search:", err.message);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});




app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password_hash } = req.body;

    console.log(`Create user request: username="${username}", email="${email}"`);

    if (!username || !email || !password_hash) {
      return res.status(400).json({ error: 'Username, email, and password_hash are required' });
    }

    const [existingUsers] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const [existingUsernames] = await pool.query('SELECT * FROM Users WHERE username = ?', [username]);
    if (existingUsernames.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const insertQuery = 'INSERT INTO Users (username, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())';
    const [result] = await pool.query(insertQuery, [username, email, password_hash]);

    const userId = result.insertId;
    console.log(`User created successfully: user_id=${userId}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { user_id: userId, username, email }
    });
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [users] = await pool.query('SELECT user_id, username, email, created_at, updated_at FROM Users WHERE user_id = ?', [userId]);

    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, user: users[0] });
  } catch (err) {
    console.error('Error retrieving user:', err.message);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

app.get('/api/users/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const [users] = await pool.query('SELECT user_id, username, email, password_hash, created_at, updated_at FROM Users WHERE email = ?', [email]);

    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, user: users[0] });
  } catch (err) {
    console.error('Error retrieving user:', err.message);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email } = req.body;
    console.log(`Update user request: user_id=${userId}`);

    const [users] = await pool.query('SELECT * FROM Users WHERE user_id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    if (email) {
      const [existingEmails] = await pool.query('SELECT * FROM Users WHERE email = ? AND user_id != ?', [email, userId]);
      if (existingEmails.length > 0) return res.status(409).json({ error: 'Email already in use' });
    }

    if (username) {
      const [existingUsernames] = await pool.query('SELECT * FROM Users WHERE username = ? AND user_id != ?', [username, userId]);
      if (existingUsernames.length > 0) return res.status(409).json({ error: 'Username already taken' });
    }

    const updates = [];
    const values = [];
    if (username) { updates.push('username = ?'); values.push(username); }
    if (email) { updates.push('email = ?'); values.push(email); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  
    values.push(userId);

    const updateQuery = `UPDATE Users SET ${updates.join(', ')} WHERE user_id = ?`;
    await pool.query(updateQuery, values);

    res.json({
      success: true,
      message: 'User updated successfully',
      user: { user_id: userId, username: username || users[0].username, email: email || users[0].email }
    });
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
});


app.delete('/api/users/:userId', async (req, res) => {
  const connection = await pool.getConnection(); 
  try {
    const { userId } = req.params;
    console.log(`Transaction: Deleting user ${userId}`);
    
   
    await connection.beginTransaction();

 
    await connection.query(
      'DELETE FROM TripPlanParks WHERE trip_plan_id IN (SELECT trip_plan_id FROM TripPlans WHERE user_id = ?)', 
      [userId]
    );

   
    await connection.query('DELETE FROM TripPlans WHERE user_id = ?', [userId]);

 
    const [result] = await connection.query('DELETE FROM Users WHERE user_id = ?', [userId]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'User not found' });
    }


    await connection.commit();
    console.log(`Transaction Committed: User ${userId} deleted.`);
    
    res.json({ success: true, message: 'User and all associated data deleted.' });

  } catch (err) {
    await connection.rollback();
    console.error('Transaction Error:', err.message);
    res.status(500).json({ error: 'Transaction Failed' });
  } finally {
    connection.release(); 
  }
});


app.post('/api/trip-plans', async (req, res) => {
  try {
    const { user_id, plan_name } = req.body;
    if (!user_id || !plan_name) return res.status(400).json({ error: 'user_id and plan_name are required' });

    const [users] = await pool.query('SELECT * FROM Users WHERE user_id = ?', [user_id]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const insertQuery = 'INSERT INTO TripPlans (user_id, plan_name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())';
    const [result] = await pool.query(insertQuery, [user_id, plan_name]);

    res.status(201).json({
      success: true,
      message: 'Trip plan created successfully',
      trip_plan: { trip_plan_id: result.insertId, user_id, plan_name, parks: [] }
    });
  } catch (err) {
    console.error('Error creating trip plan:', err.message);
    res.status(500).json({ error: 'Failed to create trip plan' });
  }
});

app.get('/api/trip-plans/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const [users] = await pool.query('SELECT * FROM Users WHERE user_id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const [tripPlans] = await pool.query(
      'SELECT trip_plan_id, user_id, plan_name, created_at, updated_at FROM TripPlans WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const plansWithParks = await Promise.all(
      tripPlans.map(async (plan) => {
        const [parks] = await pool.query(
          `SELECT p.park_id, p.park_name, p.park_code, p.state, p.description, 
                   tpp.added_at, tpp.user_notes
           FROM Parks p
           INNER JOIN TripPlanParks tpp ON p.park_id = tpp.park_id
           WHERE tpp.trip_plan_id = ?
           ORDER BY tpp.added_at DESC`,
          [plan.trip_plan_id]
        );
        return { ...plan, parks: parks || [] };
      })
    );

    res.json({ success: true, trip_plans: plansWithParks });
  } catch (err) {
    console.error('Error retrieving trip plans:', err.message);
    res.status(500).json({ error: 'Failed to retrieve trip plans' });
  }
});

app.get('/api/trip-plans/:tripPlanId', async (req, res) => {
  try {
    const { tripPlanId } = req.params;
    const [tripPlans] = await pool.query('SELECT * FROM TripPlans WHERE trip_plan_id = ?', [tripPlanId]);
    if (tripPlans.length === 0) return res.status(404).json({ error: 'Trip plan not found' });

    const [parks] = await pool.query(
      `SELECT p.park_id, p.park_name, p.park_code, p.state, p.description,
              tpp.added_at, tpp.user_notes
       FROM Parks p
       INNER JOIN TripPlanParks tpp ON p.park_id = tpp.park_id
       WHERE tpp.trip_plan_id = ?
       ORDER BY tpp.added_at DESC`,
      [tripPlanId]
    );

    res.json({ success: true, trip_plan: { ...tripPlans[0], parks: parks || [] } });
  } catch (err) {
    console.error('Error retrieving trip plan:', err.message);
    res.status(500).json({ error: 'Failed to retrieve trip plan' });
  }
});

app.put('/api/trip-plans/:tripPlanId', async (req, res) => {
  try {
    const { tripPlanId } = req.params;
    const { plan_name } = req.body;
    if (!plan_name) return res.status(400).json({ error: 'plan_name is required' });

    const [tripPlans] = await pool.query('SELECT * FROM TripPlans WHERE trip_plan_id = ?', [tripPlanId]);
    if (tripPlans.length === 0) return res.status(404).json({ error: 'Trip plan not found' });

    await pool.query('UPDATE TripPlans SET plan_name = ?, updated_at = NOW() WHERE trip_plan_id = ?', [plan_name, tripPlanId]);

    res.json({ success: true, message: 'Trip plan updated successfully' });
  } catch (err) {
    console.error('Error updating trip plan:', err.message);
    res.status(500).json({ error: 'Failed to update trip plan' });
  }
});

app.delete('/api/trip-plans/:tripPlanId', async (req, res) => {
  try {
    const { tripPlanId } = req.params;
    const [tripPlans] = await pool.query('SELECT * FROM TripPlans WHERE trip_plan_id = ?', [tripPlanId]);
    if (tripPlans.length === 0) return res.status(404).json({ error: 'Trip plan not found' });

    await pool.query('DELETE FROM TripPlanParks WHERE trip_plan_id = ?', [tripPlanId]);
    await pool.query('DELETE FROM TripPlans WHERE trip_plan_id = ?', [tripPlanId]);

    res.json({ success: true, message: 'Trip plan deleted successfully' });
  } catch (err) {
    console.error('Error deleting trip plan:', err.message);
    res.status(500).json({ error: 'Failed to delete trip plan' });
  }
});

app.post('/api/trip-plans/:tripPlanId/parks', async (req, res) => {
  try {
    const { tripPlanId } = req.params;
    const { park_id, user_notes } = req.body;
    if (!park_id) return res.status(400).json({ error: 'park_id is required' });

    const [tripPlans] = await pool.query('SELECT * FROM TripPlans WHERE trip_plan_id = ?', [tripPlanId]);
    if (tripPlans.length === 0) return res.status(404).json({ error: 'Trip plan not found' });

    const [parks] = await pool.query('SELECT * FROM Parks WHERE park_id = ?', [park_id]);
    if (parks.length === 0) return res.status(404).json({ error: 'Park not found' });

    const [existing] = await pool.query('SELECT * FROM TripPlanParks WHERE trip_plan_id = ? AND park_id = ?', [tripPlanId, park_id]);
    if (existing.length > 0) return res.status(409).json({ error: 'Park already in trip plan' });

    await pool.query('INSERT INTO TripPlanParks (trip_plan_id, park_id, added_at, user_notes) VALUES (?, ?, NOW(), ?)', [tripPlanId, park_id, user_notes || null]);

    res.status(201).json({ success: true, message: 'Park added successfully', park: { park_id, park_name: parks[0].park_name } });
  } catch (err) {
    console.error('Error adding park:', err.message);
    res.status(500).json({ error: 'Failed to add park' });
  }
});

app.delete('/api/trip-plans/:tripPlanId/parks/:parkId', async (req, res) => {
  try {
    const { tripPlanId, parkId } = req.params;
    const [existing] = await pool.query('SELECT * FROM TripPlanParks WHERE trip_plan_id = ? AND park_id = ?', [tripPlanId, parkId]);
    if (existing.length === 0) return res.status(404).json({ error: 'Park not found in trip plan' });

    await pool.query('DELETE FROM TripPlanParks WHERE trip_plan_id = ? AND park_id = ?', [tripPlanId, parkId]);
    res.json({ success: true, message: 'Park removed successfully', removedParkId: parkId });
  } catch (err) {
    console.error('Error removing park:', err.message);
    res.status(500).json({ error: 'Failed to remove park' });
  }
});

app.put('/api/trip-plans/:tripPlanId/parks/:parkId', async (req, res) => {
  try {
    const { tripPlanId, parkId } = req.params;
    const { user_notes } = req.body;
    const [existing] = await pool.query('SELECT * FROM TripPlanParks WHERE trip_plan_id = ? AND park_id = ?', [tripPlanId, parkId]);
    if (existing.length === 0) return res.status(404).json({ error: 'Park not found in trip plan' });

    await pool.query('UPDATE TripPlanParks SET user_notes = ? WHERE trip_plan_id = ? AND park_id = ?', [user_notes || null, tripPlanId, parkId]);
    res.json({ success: true, message: 'Notes updated', park: { park_id: parkId, user_notes } });
  } catch (err) {
    console.error('Error updating notes:', err.message);
    res.status(500).json({ error: 'Failed to update notes' });
  }
});


app.get('/api/trip-plans/:tripId/summary', async (req, res) => {
  try {
    const { tripId } = req.params;
    

    const query = 'CALL GenerateTripSummary(?, @summary_output);';
    await pool.query(query, [tripId]);

    const [results] = await pool.query('SELECT @summary_output as summary');

    if (results.length > 0 && results[0].summary) {
      res.json({ success: true, summary: results[0].summary });
    } else {
      res.json({ success: false, message: 'Summary not generated.' });
    }

  } catch (err) {
    console.error('Error calling stored procedure:', err);
    res.status(500).json({ success: false, error: 'Database error', details: err.message });
  }
});


app.get('/api/parks/:parkId/activities', async (req, res) => {
  try {
    const { parkId } = req.params;
    const [activities] = await pool.query(
      `SELECT a.activity_id, a.activity_name, a.description FROM Activities a
       INNER JOIN ParkActivities pa ON a.activity_id = pa.activity_id
       WHERE pa.park_id = ? ORDER BY a.activity_name ASC`, [parkId]);
    res.json({ success: true, park_id: parkId, activities });
  } catch (err) {
    console.error('Error retrieving activities:', err.message);
    res.status(500).json({ error: 'Failed to retrieve activities' });
  }
});

app.get('/api/activities/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const [activities] = await pool.query('SELECT * FROM Activities WHERE activity_id = ?', [activityId]);
    if (activities.length === 0) return res.status(404).json({ error: 'Activity not found' });
    res.json({ success: true, activity: activities[0] });
  } catch (err) {
    console.error('Error retrieving activity:', err.message);
    res.status(500).json({ error: 'Failed to retrieve activity' });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const [activities] = await pool.query('SELECT * FROM Activities ORDER BY activity_name ASC');
    res.json({ success: true, activities });
  } catch (err) {
    console.error('Error retrieving activities:', err.message);
    res.status(500).json({ error: 'Failed to retrieve activities' });
  }
});


app.get('/api/parks/map', async (req, res) => {
  try {
    console.log("Retrieve parks for map");
    const [rows] = await pool.query('SELECT park_id, park_name, state FROM Parks ORDER BY park_id');
    res.json(rows);
  } catch (err) {
    console.error("Error in /api/parks/map:", err.message);
    res.status(500).json({ error: "Failed to load parks for map" });
  }
});

app.get('/api/parks/popular', async (req, res) => {
  try {
    const [parks] = await pool.query(`
      SELECT p.park_id, p.park_name, p.state, COUNT(tpp.trip_plan_id) as trip_count
      FROM Parks p
      LEFT JOIN TripPlanParks tpp ON p.park_id = tpp.park_id
      GROUP BY p.park_id, p.park_name, p.state
      ORDER BY trip_count DESC
      LIMIT 5
    `);
    res.json(parks);
  } catch (err) {
    console.error('Error fetching popular parks:', err.message);
    res.status(500).json({ error: 'Failed to fetch popular parks' });
  }
});


app.get('/api/parks/most-activities', async (req, res) => {
  try {
    const [parks] = await pool.query(`
      SELECT p.park_id, p.park_name, p.state, COUNT(pa.activity_id) as activity_count
      FROM Parks p
      LEFT JOIN ParkActivities pa ON p.park_id = pa.park_id
      GROUP BY p.park_id, p.park_name, p.state
      ORDER BY activity_count DESC
      LIMIT 5
    `);
    res.json(parks);
  } catch (err) {
    console.error('Error fetching activity parks:', err.message);
    res.status(500).json({ error: 'Failed to fetch activity parks' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});