'use strict';

const request = require('request');

const request_string = 'http://www.ligonier.org/podcasts/5-minutes-church-history/alexa.json';

request(request_string, function(error, response, body) {
    module.exports = JSON.parse(body);
});
/*
// Audio Source - AWS Podcast : https://aws.amazon.com/podcasts/aws-podcast/

var audioData = [
    {
        'title' : 'Episode 140',
        'url' : 'https://feeds.soundcloud.com/stream/275202399-amazon-web-services-306355661-amazon-web-services.mp3'
    },
    {
        'title' : 'Episode 139',
        'url' : 'https://feeds.soundcloud.com/stream/274166909-amazon-web-services-306355661-aws-podcast-episode-139.mp3'
    }
];

module.exports = audioData;
*/
