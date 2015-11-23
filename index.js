var http = require('http')
var handlebars = require('handlebars')
var qs = require('querystring')
var WiFiControl = require('wifi-control')
var concat = require('concat-stream')
var path = require('path')
var debug = require('debug')('thething')
var fs = require('fs')

var PORT = process.env.PORT || 5337

WiFiControl.init({debug: true})
var server = http.createServer(function (req, res) {
  debug('got', req.url)
  if (req.url === '/') {
    return getWifis(req, res)
  }
  if (req.url === '/wifi' && req.method === 'POST') {
    res.writeHead(200, {'Content-Type': 'application/json'})
    return req.pipe(concat(function (body) {
      var json = qs.parse(body.toString())
      var _ap = {
        ssid: json.name,
        password: json.password
      }
      var results = WiFiControl.connectToAP(_ap)
      res.statusCode = 200
      res.write(JSON.stringify(results))
      res.end()
    }))
  }
  res.statusCode = 404
  res.write('404 not found')
  return res.end()
})

server.listen(PORT, function () {
  console.error('Listening on', PORT)
})

function getWifis (req, res) {
  return WiFiControl.scanForWiFi(function (err, response) {
    if (err) {
      res.writeHead(500, {'Content-Type': 'text/plain'})
      res.write(err.trace)
      return res.end()
    }
    var ifaceState = WiFiControl.getIfaceState()
    var template = fs.readFileSync(path.join(__dirname, 'index.html')).toString()
    var data = {wifis: response.networks, state: ifaceState}
    var html = handlebars.compile(template)(data)
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.write(html)
    return res.end()
  })
}
