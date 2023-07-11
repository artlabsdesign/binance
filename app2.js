const axios = require('axios');
const mysql = require('mysql2');


const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "binance",
    password: "Anton31337"
});
connection.connect(function(err){
    if (err) {
        return console.error("Ошибка: " + err.message);
    }
    else{
        console.log("Подключение к серверу MySQL успешно установлено");
    }
})


axios.get('https://fapi.binance.com/fapi/v1/ticker/price').then(
    function (responce) {
//console.log(responce.data)
        responce.data.map((item) => {
            let symbol = [item.symbol, item.price];


            const sql = 'INSERT INTO symbols(symbol,price) VALUES(?,?)';
            connection.query(sql, symbol, function (err, results) {
                if (err) console.log(err);
                else console.log("Данные добавлены");
            });
        });
    });
