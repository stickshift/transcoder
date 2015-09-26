// app.js - A simple video transcoder based on ffmpeg

// Requires
var config = require('./config/config');
var express = require('express');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var mkdirp = require('mkdirp');
var uuid = require('node-uuid');

var app = express();

/**
 * Transcode service - accepts video stream in elementary h264 and transcodes to HLS
 */
app.post('/transcode', function (req, res) {

    var streamId = uuid.v1();
    var streamFolder = streamId.substring(0, 2) + '/' + streamId.substring(2, 4);
    var streamPlaylist = streamFolder + '/' + streamId + '.m3u8'; 

    // Create temp folder to hold HLS segments
    mkdirp.sync(streamFolder);

    // Watch streamFolder for changes
    fs.watch(streamFolder, function (event, filename) {
        console.log('%s - HLS updated %s/%s', config.name, streamFolder, filename);
    });

    // Transcode to HLS using ffmpeg
    ffmpeg().input(req)
            .output(streamPlaylist)
            .on('error', function (err) {
                res.writeHead(400);
                res.write(err.message);
                res.end();
            })
            .on('end', function () {
                res.writeHead(200);
                res.end();
                console.log('%s - Transcoding complete', config.name);
            })
            .run();

    console.log('%s - Transcoding stream to %s', config.name, streamPlaylist);
});

// Kick off server
app.listen(config.listen_port, function () {
    console.log('%s - Listening on port %d', config.name, config.listen_port);
});
