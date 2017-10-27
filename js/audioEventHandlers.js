'use strict';

const Alexa = require('alexa-sdk');
//var audioData = require('./audioAssets');
const constants = require('./constants');
const utils = require('./utils');

// Binding audio handlers to PLAY_MODE State since they are expected only in this mode.
var audioEventHandlers = Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
    'PlaybackStarted': function () {
        /*
         * AudioPlayer.PlaybackStarted Directive received.
         * Confirming that requested audio file began playing.
         * Storing details in dynamoDB using attributes.
         */
        this.attributes.token = utils.getToken.call(this);
        this.attributes.index = utils.getIndex.call(this);
        this.attributes.playbackFinished = false;
        this.emit(':saveState', true);
    },
    'PlaybackFinished': function () {
        /*
         * AudioPlayer.PlaybackFinished Directive received.
         * Confirming that audio file completed playing.
         * Storing details in dynamoDB using attributes.
         */
        this.attributes.playbackFinished = true;
        this.attributes.enqueuedToken = false;
        this.emit(':saveState', true);
    },
    'PlaybackStopped': function () {
        /*
         * AudioPlayer.PlaybackStopped Directive received.
         * Confirming that audio file stopped playing.
         * Storing details in dynamoDB using attributes.
         */
        this.attributes.token = utils.getToken.call(this);
        this.attributes.index = utils.getIndex.call(this);
        this.attributes.offsetInMilliseconds = utils.getOffsetInMilliseconds.call(this);
        this.emit(':saveState', true);
    },
    'PlaybackNearlyFinished': function () {
        /*
         * AudioPlayer.PlaybackNearlyFinished Directive received.
         * Using this opportunity to enqueue the next audio
         * Storing details in dynamoDB using attributes.
         * Enqueuing the next audio file.
         */

        if (!this.attributes.autoplay) {
            /*
             * If autoplay disabled, we don't need to enqueue anything further.
             */
            return this.context.succeed(true);
        }

        if (this.attributes.enqueuedToken) {
            /*
             * Since AudioPlayer.PlaybackNearlyFinished Directive are prone to be delivered multiple times during the
             * same audio being played.
             * If an audio file is already enqueued, exit without enqueuing again.
             */
            return this.context.succeed(true);
        }

        let enqueueIndex = this.attributes.index;
        enqueueIndex += 1;

        // Checking if  there are any items to be enqueued.
        if (enqueueIndex === this.attributes.audioData.length) {
            if (this.attributes.loop) {
                // Enqueueing the first item since looping is enabled.
                enqueueIndex = 0;
            } else {
                // Nothing to enqueue since reached end of the list and looping is disabled.
                return this.context.succeed(true);
            }
        }
        // Setting attributes to indicate item is enqueued.
        this.attributes.enqueuedToken = String(this.attributes.playOrder[enqueueIndex]);

        let enqueueToken = this.attributes.enqueuedToken;
        let playBehavior = 'ENQUEUE';
        let podcast = this.attributes.audioData[this.attributes.playOrder[enqueueIndex]];
        let expectedPreviousToken = this.attributes.token;
        let offsetInMilliseconds = 0;

        this.response.audioPlayerPlay(playBehavior, podcast.url, enqueueToken, expectedPreviousToken, offsetInMilliseconds);
        this.emit(':responseReady');
    },
    'PlaybackFailed': function () {
        //  AudioPlayer.PlaybackNearlyFinished Directive received. Logging the error.
        console.log("Playback Failed : %j", this.event.request.error);
        this.context.succeed(true);
    }
});

module.exports = audioEventHandlers;
