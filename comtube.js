var crypto = require('crypto');
var http = require('http');

var Comtube = module.exports = {};

// config setting
var config = {password: null, username: null, type: 'json', attempts: 3};

// validate and prepare if need
// return null if str is invalid phone number
//
function numberPrepare(str)
{
  var number = null;
  // remove not a number
  var n1 = str.replace(/[^\d]/g, '');
  
  var n2 = ((n1.length === 10) ? '7' : '') + n1;

  // replace first num if need
  var n3 = ((n2[0] === '8') ? '7' : n2[0]) + n2.slice(1);

  // validate 
  if(n3.length === 11 && (n3[0] === '7' || n3[0] === '3'))
      number = n3;
  
  return number;
};

function buildUrl(api_url, template, params)
{
  // build params string
  var url_end = template.replace(/\{([a-zA-Z0-9]+)\}/g, function(match, key)
  {
    return encodeURIComponent(params[key]).replace("%20", "+");
  });

  // build params string for signature
  var urlSignature = url_end + '&&password=' + encodeURIComponent(params.password).replace("%20", "+");

  // calc signature
  var signature = crypto.createHash('md5').update(urlSignature).digest('hex');

  // build full url
  var url = api_url + '?' + url_end + '&signature=' + signature;
  
  return url;
}

// litle get http helper function
//
function httpGet(url, isJSON, cb)
{
  http
    .get(url, function(res)
    {
      var data = '';
      res
        .on('data', function(chunk)
        {
          if(isJSON) {
            data += chunk;
          } else {
            data += chunk.toSting();
          }
        })
        .on('end', function()
        {
          
          if(isJSON)
          {
            try
            {
              data = JSON.parse(data);

            }
            catch(err)
            {
              cb.fail && cb.fail(err);
            }
          }
              
          cb.done && cb.done(data);
        });
    })
    .on('error', function(err)
    {
      cb.fail && cb.fail(err);
    });
};

// mock function for test
function mockHttpGet(url, isJSON, cb)
{
  var rand = Math.random();

  if(rand > 0.75)
    cb.fail && cb.fail(new Error);
  else
    cb.done && cb.done({status: 'GET ' + url});
};

Comtube.configure = function(params)
{
  for(var key in params)
  {
    config[key] = params[key];
  }
};

// options = {numberTo, numberFrom}
Comtube.callup = function(options, cb)
{
  var number1 = numberPrepare(options.customerPhone);
  var number2 = numberPrepare(options.userPhone);
  var maxdurr = Number(options.maxdurr) || 0;
  
  // both not a null
  if(number1 && number2)
  {
    // collect params
    var params = 
    {
      action: 'call',
      type: config.type,
      number1: number1,
      number2: number2,
      maxdurr: maxdurr,
      attempts: config.attempts,
      username: config.username,
      password: config.password
    };

    var urlCallUp = buildUrl('http://api.comtube.com/scripts/api/callback.php', 'action={action}&attempts={attempts}&number1={number1}&number2={number2}&type={type}&username={username}', params);
    httpGet(urlCallUp, true,
    {
      done: function(res)
      {
        cb.done && cb.done(res);
      },
      fail: function(err)
      {
        cb.fail && cb.fail(err);
      }
    });
  }
  else
  {
    cb.fail && cb.fail(new Error);
  }
};


Comtube.fetchCalls = function(dateFrom, dateTo, cb)
{
    var get_month = (dateTo.getMonth()+1)<10 ? '0'+(dateTo.getMonth()+1):(dateTo.getMonth()+1);
    var get_date = dateTo.getDate()<10 ? '0'+dateTo.getDate():dateTo.getDate();
    var untildttm = dateTo.getFullYear()+'-'+get_month+"-"+get_date+' 23:59:59';
    
    var get_month = (dateFrom.getMonth()+1)<10 ? '0'+(dateFrom.getMonth()+1):(dateFrom.getMonth()+1);
    var get_date = dateFrom.getDate()<10 ? '0'+dateFrom.getDate():dateFrom.getDate();
    var fromdttm = dateFrom.getFullYear()+'-'+get_month+"-"+get_date+' 00:00:00';

    // collect params
    var params =
    {
        action: 'statistics',
        fromdttm: fromdttm,
        untildttm: untildttm,
        username: config.username,
        password: config.password,
        type: config.type
    };

    var urlStatistic = buildUrl('http://api.comtube.com/scripts/api/callback.php', 'action={action}&fromdttm={fromdttm}&type={type}&untildttm={untildttm}&username={username}', params);
    
    httpGet(urlStatistic, true,
    {
        done: function(res)
        {
          cb.done && cb.done(res.callbacks);
        },
        fail: function(err)
        {
          cb.fail && cb.fail(err);
        }
    });

};


