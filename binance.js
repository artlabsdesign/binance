const { USDMClient } = require('binance');
require('dotenv').config();


const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.SECRET_KEY;

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