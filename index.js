const fs = require('fs'),
  express = require('express'),
  axios = require('axios');

const data = { price: 0 };
const app = express();
app.get('/getprice', function (req, res) {
  res.send(JSON.stringify(data));
});

app.listen(54329, function () {
  console.log('Example app listening on port 54329!');
});

const API_LIST = [
  {
    url: 'https://api.coinhills.com/v1/cspa/xtz/',
    ratelimit: 60000,
    handler: coinhills
  },
  {
    url: 'https://api.cryptowat.ch/markets/hitbtc/xtzusdt/price',
    ratelimit: 5000,
    handler: hitbtc
  },
  {
    url: 'https://data.gate.io/api2/1/marketlist',
    ratelimit: 5000,
    handler: gateio
  }
]

// filters
function coinhills(url) {
  return request(url).then(data => data.data['CSPA:XTZ'].cspa);
}

function hitbtc(url) {
  return request(url)
  .then(data => data.result.price);
}

function gateio(url) {
  return request(url).then(data => {
    const target = data.data.find(item => item.symbol === 'XTZ' && item.curr_suffix.trim() === 'USDT')
    return target && target.rate;
  })
}

const request = (apiUrl, params) => {
  const additional = !params ?
    '' :
    '?' + Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return axios.get(apiUrl + additional)
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return null;
    });
}

const saveResult = (result) => {
  if(result) {
    data.price = data.price ? (data.price + (+result)) / 2 : (+result);
  }
}

API_LIST.forEach(api => {
  setInterval(() => Promise.resolve()
    .then(() => api.handler(api.url))
    .then((result) => saveResult(result)), api.ratelimit)
})
