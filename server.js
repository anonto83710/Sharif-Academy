const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./db/database'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/dua', express.static(path.join(__dirname, 'dua-page')));

app.use(session({
  secret: 'sharif-academy-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const examRoutes = require('./routes/exam');

app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/exam', examRoutes);

app.listen(PORT, () => {
  console.log(`Sharif Academy server running on http://localhost:${PORT}`);
});
