const { USDMClient } = require('binance');

const API_KEY = 'xxx';
const API_SECRET = 'yyy';

const client = new USDMClient({
    api_key: API_KEY,
    api_secret: API_SECRET,
});

client
    .getBalance()
    .then((result) => {
        console.log('getBalance result: ', result);
    })
    .catch((err) => {
        console.error('getBalance error: ', err);
    });

client
    .get24hrChangeStatististics()
    .then((result) => {
        console.log('get24hrChangeStatististics inverse futures result: ', result);
    })
    .catch((err) => {
        console.error('get24hrChangeStatististics inverse futures error: ', err);
    });