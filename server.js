var connect = require('connect'),
    http = require('http'),
    url = require('url')

var isRedirect = false
var redirectOption

var app = connect()
    .use(connect.logger('dev'))
    .use(connect.static(__dirname))
    .use(function (request, response) {
        if (request.url.indexOf('webhdfs') != -1) {
            //default namenode address
            var options = {
                hostname: 'namenode',
                port: 50070,
                path: request.url,
                method: request.method
            }
            if (isRedirect) {
                options = redirectOption;
                isRedirect = false;
            }
            var req = http.request(options, function (res) {
                if (res.statusCode == 307) {
                    var url_part = url.parse(res.headers.location)
                    isRedirect = true
                    redirectOption = {
                        hostname: url_part.hostname,
                        port: url_part.port,
                        path: url_part.path,
                        method: request.method
                    }
                    res.headers.location =  url_part.path;
                }
                response.writeHeader(res.statusCode, res.headers)
                res.on('data', function (chunk) {
                        response.write(chunk, 'binary')
                })
                res.on('end', function () {
                        response.end()
                })
            })
            request.on('data', function (chunk) {
                    req.write(chunk, 'binary')
            })
            request.on('error', function () {
                console.log("request failed")
            })
            request.on('end', function () {
                req.end()
            })
        } else {
            response.writeHead(404)
            response.end()
        }

    })
    .listen(8000)
