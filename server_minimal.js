try {
    console.log('Requiring express...');
    const express = require('express');
    console.log('Express loaded.');

    console.log('Requiring body-parser...');
    const bodyParser = require('body-parser');
    console.log('body-parser loaded.');

    console.log('Requiring cors...');
    const cors = require('cors');
    console.log('cors loaded.');

    console.log('Requiring pg...');
    const pg = require('pg');
    console.log('pg loaded.');

    console.log('Requiring local routes...');
    const r = require('./routes/walletsRoutes');
    console.log('Local routes loaded.');

} catch (e) {
    console.error('ERROR:', e);
}
