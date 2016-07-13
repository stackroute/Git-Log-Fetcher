var highland = require('highland');
var websocket = require('websocket-stream');

var wsstream = websocket('ws://192.168.99.100:7070');

highland(wsstream)
    .map(function(data) {
        data = JSON.parse(data);
        return data[2];
    })
    .map(function(data) {
        return data;
    })
    .each(highland.log);