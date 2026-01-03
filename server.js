const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const walletsRoutes = require('./routes/walletsRoutes');
const { logRequest } = require('./helpers/logger');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(logRequest); // Log every request

// Routes
app.use('/api', walletsRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
