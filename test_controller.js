try {
    console.log('Requiring zigChainSdk...');
    require('./helpers/zigChainSdk');
    console.log('zigChainSdk loaded');

    console.log('Requiring cryptoHelper...');
    require('./helpers/cryptoHelper');
    console.log('cryptoHelper loaded');

    console.log('Requiring db...');
    require('./db');
    console.log('db loaded');

    console.log('Requiring walletsController...');
    require('./controllers/walletsController');
    console.log('walletsController loaded');

} catch (e) {
    console.error('FAIL:', e);
}
