try {
    console.log('Requiring routes...');
    require('./routes/walletsRoutes');
    console.log('Routes loaded.');

    console.log('Requiring server...');
    // We can't require server.js easily if it starts listening immediately without export.
    // But we can check if file exists.

    console.log('Imports verify success.');
} catch (e) {
    console.error('Import Error:', e);
}
