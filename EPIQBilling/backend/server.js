const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL connection configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'epiq_billing',
  password: 'opium', // Replace with your actual password
  port: 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to PostgreSQL database');
  release();
});

// API endpoint to submit a form (generic for all types, supports draft/final)
app.post('/api/submit-form', async (req, res) => {
  const { user_id, form_type, form_data, status } = req.body;
  try {
    // If saving as draft, upsert (update if exists, else insert)
    if (status === 'draft') {
      const upsert = await pool.query(
        `INSERT INTO form_submissions (user_id, form_type, form_data, status)
         VALUES ($1, $2, $3, 'draft')
         ON CONFLICT (user_id, form_type, status)
         DO UPDATE SET form_data = $3, created_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [user_id, form_type, form_data]
      );
      return res.json({ success: true, submission: upsert.rows[0] });
    }
    // If submitting as final, insert as new row
    const result = await pool.query(
      'INSERT INTO form_submissions (user_id, form_type, form_data, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, form_type, form_data, status || 'final']
    );
    res.json({ success: true, submission: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving form.' });
  }
});

// API endpoint to get a draft for a user and form type
app.get('/api/get-draft/:user_id/:form_type', async (req, res) => {
  const { user_id, form_type } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM form_submissions WHERE user_id = $1 AND form_type = $2 AND status = $3 ORDER BY created_at DESC LIMIT 1',
      [user_id, form_type, 'draft']
    );
    if (result.rows.length > 0) {
      res.json({ success: true, draft: result.rows[0] });
    } else {
      res.json({ success: false, message: 'No draft found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching draft.' });
  }
});

// API endpoint for user login
app.post('/api/login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = $2 AND role = $3',
      [email, password, role]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.json({ success: false, message: 'Invalid credentials or role.' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// API endpoint for user submissions
app.post('/api/submit-data', async (req, res) => {
  const { user_id, role, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO submissions (user_id, role, content) VALUES ($1, $2, $3) RETURNING *',
      [user_id, role, content]
    );
    res.json({ success: true, submission: result.rows[0] });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// API endpoint for superadmin to create admin
app.post('/api/create-admin', async (req, res) => {
  const { creator_role, first_name, last_name, email, password } = req.body;
  if (creator_role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only superadmin can create admins.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [first_name, last_name, email, password, 'admin']
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating admin.' });
  }
});

// API endpoint for admin to create user (limit 4 per admin)
app.post('/api/create-user', async (req, res) => {
  const { creator_role, creator_id, first_name, last_name, email, password } = req.body;
  if (creator_role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admin can create users.' });
  }
  try {
    // Count users created by this admin
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM users WHERE created_by = $1 AND role = $2',
      [creator_id, 'user']
    );
    if (parseInt(countResult.rows[0].count) >= 4) {
      return res.status(403).json({ success: false, message: 'Admin can only create 4 users.' });
    }
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password, role, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [first_name, last_name, email, password, 'user', creator_id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating user.' });
  }
});

// API endpoint for superadmin dashboard: get all admins and their users
app.get('/api/superadmin-dashboard', async (req, res) => {
  try {
    const admins = await pool.query("SELECT * FROM users WHERE role = 'admin'");
    const adminData = await Promise.all(admins.rows.map(async (admin) => {
      const users = await pool.query("SELECT * FROM users WHERE created_by = $1 AND role = 'user'", [admin.id]);
      return {
        admin,
        users: users.rows
      };
    }));
    res.json({ success: true, admins: adminData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard data.' });
  }
});

// API endpoint for admin dashboard: get all users created by this admin
app.get('/api/admin-dashboard/:adminId', async (req, res) => {
  const adminId = req.params.adminId;
  try {
    const users = await pool.query("SELECT * FROM users WHERE created_by = $1 AND role = 'user'", [adminId]);
    res.json({ success: true, users: users.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users.' });
  }
});

// API endpoint to get all submissions of a form type (with user info)
app.get('/api/forms/:form_type', async (req, res) => {
  const { form_type } = req.params;
  try {
    const result = await pool.query(
      `SELECT f.*, u.first_name, u.last_name, u.email, u.role
       FROM form_submissions f
       JOIN users u ON f.user_id = u.id
       WHERE f.form_type = $1
       ORDER BY f.created_at DESC`,
      [form_type]
    );
    res.json({ success: true, submissions: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching forms.' });
  }
});

// API endpoint for superadmin: get all admins, their users, and their forms
app.get('/api/superadmin-full-dashboard', async (req, res) => {
  try {
    const admins = await pool.query("SELECT * FROM users WHERE role = 'admin'");
    const adminData = await Promise.all(admins.rows.map(async (admin) => {
      const users = await pool.query("SELECT * FROM users WHERE created_by = $1 AND role = 'user'", [admin.id]);
      const usersWithForms = await Promise.all(users.rows.map(async (user) => {
        const forms = await pool.query("SELECT * FROM form_submissions WHERE user_id = $1 ORDER BY created_at DESC", [user.id]);
        return { ...user, forms: forms.rows };
      }));
      return {
        admin,
        users: usersWithForms
      };
    }));
    res.json({ success: true, admins: adminData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard data.' });
  }
});

// API endpoint for admin: get all users and their forms
app.get('/api/admin-full-dashboard/:adminId', async (req, res) => {
  const adminId = req.params.adminId;
  try {
    const users = await pool.query("SELECT * FROM users WHERE created_by = $1 AND role = 'user'", [adminId]);
    const usersWithForms = await Promise.all(users.rows.map(async (user) => {
      const forms = await pool.query("SELECT * FROM form_submissions WHERE user_id = $1 ORDER BY created_at DESC", [user.id]);
      return { ...user, forms: forms.rows };
    }));
    res.json({ success: true, users: usersWithForms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users and forms.' });
  }
});

// Edit user (admin or user)
app.put('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, role, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET first_name=$1, last_name=$2, email=$3, role=$4, status=$5 WHERE id=$6 RETURNING *',
      [first_name, last_name, email, role, status, id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error editing user.' });
  }
});

// Delete user (admin or user)
app.delete('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user.' });
  }
});

// Edit form submission
app.put('/api/form/:id', async (req, res) => {
  const { id } = req.params;
  const { form_data, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE form_submissions SET form_data=$1, status=$2 WHERE id=$3 RETURNING *',
      [form_data, status, id]
    );
    res.json({ success: true, form: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error editing form.' });
  }
});

// Delete form submission
app.delete('/api/form/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM form_submissions WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting form.' });
  }
});

// Get individual user
app.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.json({ success: false, message: 'User not found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user.' });
  }
});

// Get individual form
app.get('/api/form/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM form_submissions WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.json({ success: true, form: result.rows[0] });
    } else {
      res.json({ success: false, message: 'Form not found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching form.' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});