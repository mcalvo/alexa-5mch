'use strict';

const Alexa = require('alexa-sdk');
const Feed = require('rss-to-json');
const constants = require('./constants');
const utils = require('./utils');
const request_string = 'https://5minutesinchurchhistory.ligonier.org/rss';

function initializeSession(body) {
    let today = new Date();
    this.attributes.offsetInMilliseconds = 0;
    this.attributes.autoplay = false;
    this.attributes.loop = false;
    this.attributes.shuffle = false;
    this.attributes.playbackIndexChanged = true;
    this.handler.state = constants.states.START_MODE;
    this.attributes.audioData = body.items;
    this.attributes.dataRefresh = today.toString();
    this.attributes.playOrder = Array.apply(null, {
        length: this.attributes.audioData.length
    }).map(Number.call, Number).reverse();
    this.attributes.index = this.attributes.playOrder.indexOf(0);
}

const stateHandlers = {
    startModeIntentHandlers : Alexa.CreateStateHandler(constants.states.START_MODE, {
        /*
         *  All Intent Handlers for state : START_MODE
         */
        'LaunchRequest' : function () {
            let today = new Date();
            if (this.attributes.dataRefresh){
                let dr = new Date(this.attributes.dataRefresh);
                if (dr < today) {
                    Feed.load(request_string, function(error, body){
                        initializeSession.call(this, body);

                        var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                        let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;

                        this.response.speak(message);
                        controller.play.call(this);
                    }.bind(this));
                } else {
                    var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                    let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;
                    this.response.speak(message);
                    controller.play.call(this);
                }
            } else {
                Feed.load(request_string, function(error, body){
                    initializeSession.call(this, body);

                    var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                    let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;

                    this.response.speak(message);
                    controller.play.call(this);
                }.bind(this));
            }
        },
        'PlayAudio' : function () {
            if (!this.attributes.playOrder) {
                Feed.load(request_string, function(error, body){
                    initializeSession.call(this, body);
                    controller.play.call(this);
                }.bind(this));
            } else {
                controller.play.call(this);
            }
        },
        'AMAZON.HelpIntent' : function () {
            var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];

            var message = 'You\'re listening to Five Minutes in Church History for ' + podcast.date + ' titled ' + podcast.title + '. You can say Pause, or, Resume, to control playback. To listen to an earlier episode, say Previous. To return to the most recent episode, say Latest Episode. To learn more about Five Minutes in Church History, say About. What can I help you with?';
            var reprompt = 'What can I help you with?';

            var cardTitle = 'Help with Five Minutes in Church History';
            var cardContent = 'You\'re listening to Five Minutes in Church History for ' + podcast.date + ' titled \"' + podcast.title + '\".\nSay "Pause" or "Resume" to control playback.\nSay \"Alexa, ask Church History to play the latest episode\" to play the most recent episode.\nSay "Previous" to listen to an earlier episode.';
            this.response.cardRenderer(cardTitle, cardContent, null);

            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'AboutIntent': function() {
            var message = "Five Minutes in Church History, hosted by Dr. Stephen Nichols, is a weekly podcast that provides an informal and informative look at church history. Join us each week as we take a brief break from the present to go exploring the past. Five Minutes in Church History is an outreach of Ligonier.";

            this.response.speak(message);
            this.emit(':responseReady');
        },
        'TodayIntent': function() {
            let today = new Date();
            if (this.attributes.dataRefresh){
                let dr = new Date(this.attributes.dataRefresh);
                if (dr != today) {
                    Feed.load(request_string, function(error, body){
                        initializeSession.call(this, body);

                        var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                        let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;

                        this.response.speak(message);
                        controller.play.call(this);
                    }.bind(this));
                } else {
                    var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                    let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;
                    controller.play.call(this);
                }
            } else {
                Feed.load(request_string, function(error, body){
                    initializeSession.call(this, body);

                    var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                    let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;

                    this.response.speak(message);
                    controller.play.call(this);
                }.bind(this));
            }
        },
        'AMAZON.StopIntent' : function () {
            controller.stop.call(this);
            this.emit(':responseReady');
        },
        'AMAZON.CancelIntent' : function () {
            controller.stop.call(this);
            this.emit(':responseReady');
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            let message = 'Sorry, I could not understand.';
            this.response.speak(message);
            this.emit(':responseReady');
        }
    }),
    playModeIntentHandlers : Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
        /*
         *  All Intent Handlers for state : PLAY_MODE
         */
        'LaunchRequest' : function () {
            /*
             *  Session resumed in PLAY_MODE STATE.
             *  If playback had finished during last session :
             *      Give welcome message.
             *      Change state to START_STATE to restrict user inputs.
             *  Else :
             *      Ask user if he/she wants to resume from last position.
             *      Change state to RESUME_MODE
             */
            let message;
            let reprompt;
            let today = new Date();
            if (this.attributes['playbackFinished']) {
                if (this.attributes.dataRefresh){
                    let dr = new Date(this.attributes.dataRefresh);
                    if (dr != today) {
                        Feed.load(request_string, function(error, body){
                            initializeSession.call(this, body);

                            var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                            let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;

                            this.response.speak(message);
                            controller.play.call(this);
                        }.bind(this));
                    } else {
                        var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                        let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;
                        controller.play.call(this);
                    }
                } else {
                    Feed.load(request_string, function(error, body){
                        initializeSession.call(this, body);

                        var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                        let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;

                        this.response.speak(message);
                        controller.play.call(this);
                    }.bind(this));
                }
            } else {
                this.handler.state = constants.states.RESUME_MODE;
                var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                message = 'Welcome back to Five Minutes in Church History. Previously you were listening to the episode from ' + podcast.date +
                    ' titled ' + podcast.title + '. Would you like to resume that episode?';
                reprompt = 'Say yes to resume the episode from ' + podcast.date + ' titled ' + podcast.title + ', or say no to play the latest episode.';

                this.response.speak(message).listen(reprompt);
                this.emit(':responseReady');
            }
        },
        'PlayAudio' : function () {
            controller.play.call(this);
        },
        'AMAZON.NextIntent' : function () { controller.cNext.call(this) },
        'AMAZON.PreviousIntent' : function () { controller.cPrevious.call(this) },
        'AMAZON.PauseIntent' : function () { controller.stop.call(this) },
        'AMAZON.StopIntent' : function () { controller.stop.call(this) },
        'AMAZON.CancelIntent' : function () { controller.stop.call(this) },
        'AMAZON.ResumeIntent' : function () { controller.play.call(this) },
        'AMAZON.LoopOnIntent': function() {
            var message = 'Sorry. This skill does not support looping.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'AMAZON.LoopOffIntent' : function () {
            var message = 'Sorry. This skill does not support looping.';

            this.response.speak(message);
            this.emit(':responseReady');
        },
        'AMAZON.ShuffleOnIntent' : function () {
            var message = 'Sorry. This skill does not support shuffling.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'AMAZON.ShuffleOffIntent' : function () {
            var message = 'Sorry. This skill does not support shuffling.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'AMAZON.StartOverIntent' : function () {
            controller.startOver.call(this)
        },
        'AMAZON.HelpIntent' : function () {
            var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];

            var message = 'You\'re listening to Five Minutes in Church History for ' + podcast.date + ' titled ' + podcast.title + '. You can say Pause, or, Resume, to control playback. To listen to an earlier episode, say Previous. To return to the most recent episode, say Latest Episode. To learn more about Five Minutes in Church History, say About. What can I help you with?';
            var reprompt = 'What can I help you with?';

            var cardTitle = 'Help with Five Minutes in Church History';
            var cardContent = 'You\'re listening to Five Minutes in Church History for ' + podcast.date + ' titled \"' + podcast.title + '\".\nSay "Pause" or "Resume" to control playback.\nSay \"Alexa, ask Church History to play the latest episode\" to play the most recent episode.\nSay "Previous" to listen to an earlier episode.';
            this.response.cardRenderer(cardTitle, cardContent, null);


            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'AboutIntent': function() {
            var message = "Five Minutes in Church History, hosted by Dr. Stephen Nichols, is a weekly podcast that provides an informal and informative look at church history. Join us each week as we take a brief break from the present to go exploring the past. Five Minutes in Church History is an outreach of Ligonier.";

            this.response.speak(message);
            this.emit(':responseReady');
        },
        'TodayIntent': function() {
            let today = new Date();
            if (this.attributes.dataRefresh){
                let dr = new Date(this.attributes.dataRefresh);
                if (dr != today) {
                    Feed.load(request_string, function(error, body){
                        initializeSession.call(this, body);

                        var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                        let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;

                        this.response.speak(message);
                        controller.play.call(this);
                    }.bind(this));
                } else {
                    var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                    let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;
                    controller.play.call(this);
                }
            } else {
                Feed.load(request_string, function(error, body){
                    initializeSession.call(this, body);

                    var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                    let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;

                    this.response.speak(message);
                    controller.play.call(this);
                }.bind(this));
            }
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            let message = 'Sorry, I could not understand.';
            this.response.speak(message);
            this.emit(':responseReady');
        }
    }),
    remoteControllerHandlers : Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
        /*
         *  All Requests are received using a Remote Control. Calling corresponding handlers for each of them.
         */
        'PlayCommandIssued' : function () { controller.play.call(this) },
        'PauseCommandIssued' : function () { controller.stop.call(this) },
        'NextCommandIssued' : function () { controller.cNext.call(this) },
        'PreviousCommandIssued' : function () { controller.cPrevious.call(this) }
    }),
    resumeModeIntentHandlers : Alexa.CreateStateHandler(constants.states.RESUME_MODE, {
        /*
         *  All Intent Handlers for state : RESUME_MODE
         */
        'LaunchRequest' : function () {
            var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];

            let message = 'Welcome back to Five Minutes in Church History. Previously you were listening to the episode from ' + podcast.date +
                ' titled ' + podcast.title + '. Would you like to resume that episode?';
            let reprompt = 'Say yes to resume the episode from ' + podcast.date + ' titled ' + podcast.title + ', or say no to play the latest episode.';

            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'AMAZON.YesIntent' : function () {
            controller.play.call(this)
        },
        'AMAZON.NoIntent' : function () {
            // We can do a feed refresh on reset
            Feed.load(request_string, function(error, body) {
                initializeSession.call(this, body);
                var token = String(this.attributes.playOrder[this.attributes.index]);
                var playBehavior = 'REPLACE_ALL';
                var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                var offsetInMilliseconds = this.attributes.offsetInMilliseconds;
                this.attributes.playbackIndexChanged = true;
                // Since play behavior is REPLACE_ALL, enqueuedToken attribute need to be set to null.
                this.attributes.enqueuedToken = null;

                let message = 'Playing the latest episode titled ' + podcast.title;
                this.response.speak(message);
                controller.play.call(this);
            }.bind(this));
        },
        'AMAZON.HelpIntent' : function () {
            var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];

            let message = 'Previously you were listening to the episode from ' + podcast.date + ' titled ' + podcast.title + '. Would you like to resume that episode?';
            let reprompt = 'Say yes to resume the episode from ' + podcast.date + ' titled ' + podcast.title + ', or say no to play the latest episode.';

            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'AMAZON.StopIntent' : function () {
            controller.stop.call(this);
            this.emit(':responseReady');
        },
        'AMAZON.CancelIntent' : function () {
            controller.stop.call(this);
            this.emit(':responseReady');
        },
        'AboutIntent': function() {
            var message = "Five Minutes in Church History, hosted by Dr. Stephen Nichols, is a weekly podcast that provides an informal and informative look at church history. Join us each week as we take a brief break from the present to go exploring the past. Five Minutes in Church History is an outreach of Ligonier.";

            this.response.speak(message);
            this.emit(':responseReady');
        },
        'TodayIntent': function() {
            let today = new Date();
            if (this.attributes.dataRefresh){
                let dr = new Date(this.attributes.dataRefresh);
                if (dr != today) {
                    Feed.load(request_string, function(error, body){
                        initializeSession.call(this, body);

                        var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                        let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;

                        this.response.speak(message);
                        controller.play.call(this);
                    }.bind(this));
                } else {
                    var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                    let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;
                    this.response.speak(message);
                    controller.play.call(this);
                }
            } else {
                Feed.load(request_string, function(error, body){
                    initializeSession.call(this, body);

                    var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                    let message = 'Welcome to Five Minutes in Church History. The latest episode is titled ' + podcast.title;

                    this.response.speak(message);
                    controller.play.call(this);
                }.bind(this));
            }
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            let message = 'Sorry, I could not understand.';
            this.response.speak(message);
            this.emit(':responseReady');
        }
    })
};

module.exports = stateHandlers;

var controller = function () {
    return {
        play: function () {
            /*
             *  Using the function to begin playing audio when:
             *      Play Audio intent invoked.
             *      Resuming audio when stopped/paused.
             *      Next/Previous commands issued.
             */
            this.handler.state = constants.states.PLAY_MODE;

            if (this.attributes['playbackFinished']) {
                Feed.load(request_string, function(error, body){
                    initializeSession.call(this, body);

                    var token = String(this.attributes.playOrder[this.attributes.index]);
                    var playBehavior = 'REPLACE_ALL';
                    var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                    var offsetInMilliseconds = this.attributes.offsetInMilliseconds;
                    // Since play behavior is REPLACE_ALL, enqueuedToken attribute need to be set to null.
                    this.attributes.enqueuedToken = null;

                    if (utils.canThrowCard.call(this)) {
                        var cardTitle = podcast.title + ' (' + podcast.date + ')';
                        var cardContent = podcast.description;
                        var cardImage = {
                            'smallImageUrl': 'https://s3.amazonaws.com/ligonier-echo-apps/700x700_5MiCH.jpg',
                            'largeImageUrl': 'https://s3.amazonaws.com/ligonier-echo-apps/1200x1200_5MiCH.jpg'
                        };
                        this.response.cardRenderer(cardTitle, cardContent, cardImage);
                    }

                    this.response.audioPlayerPlay(playBehavior, podcast.url.replace("http", "https"), token, null, offsetInMilliseconds);
                    this.emit(':responseReady');
                }.bind(this));
            } else {
                var token = String(this.attributes.playOrder[this.attributes.index]);
                var playBehavior = 'REPLACE_ALL';
                var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                var offsetInMilliseconds = this.attributes.offsetInMilliseconds;
                // Since play behavior is REPLACE_ALL, enqueuedToken attribute need to be set to null.
                this.attributes.enqueuedToken = null;

                var cardTitle = podcast.title + ' (' + podcast.date + ')';
                var cardContent = podcast.description;
                var cardImage = {
                    'smallImageUrl': 'https://s3.amazonaws.com/ligonier-echo-apps/700x700_5MiCH.jpg',
                    'largeImageUrl': 'https://s3.amazonaws.com/ligonier-echo-apps/1200x1200_5MiCH.jpg'
                };
                this.response.cardRenderer(cardTitle, cardContent, cardImage);

                this.response.audioPlayerPlay(playBehavior, podcast.url, token, null, offsetInMilliseconds);
                this.emit(':responseReady');
            }
        },
        stop: function () {
            /*
             *  Issuing AudioPlayer.Stop directive to stop the audio.
             *  Attributes already stored when AudioPlayer.Stopped request received.
             */
            this.response.audioPlayerStop();
            this.emit(':responseReady');
        },
        cNext: function () {
            /*
             * The command variant of playNext. Mostly present due to stakeholders wanting system to continue playing.
             */
            var index = this.attributes.index;
            index += 1;
            // Check for last audio file.
            if (index === this.attributes.audioData.length) {
                if (this.attributes.loop) {
                    index = 0;
                } else {
                    // Manual attempt to reach beyond the end.
                    var token = String(this.attributes.playOrder[this.attributes.index]);
                    var playBehavior = 'REPLACE_ALL';
                    var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                    var offsetInMilliseconds = this.attributes.offsetInMilliseconds;

                    if (utils.canThrowCard.call(this)) {
                        var cardTitle = podcast.title + ' (' + podcast.date + ')';
                        var cardContent = podcast.description;
                        var cardImage = {
                            'smallImageUrl': 'https://s3.amazonaws.com/ligonier-echo-apps/700x700_5MiCH.jpg',
                            'largeImageUrl': 'https://s3.amazonaws.com/ligonier-echo-apps/1200x1200_5MiCH.jpg'
                        };
                        this.response.cardRenderer(cardTitle, cardContent, cardImage);
                    }

                    var message = 'You\'re listening to the most recent episode. Say, Previous, to listen to earlier episodes.';
                    this.response.speak(message).audioPlayerPlay(playBehavior, podcast.url, token, null, offsetInMilliseconds);
                    this.emit(':responseReady');
                }
            } else {
                // Set values to attributes.
                this.attributes.index = index;
                this.attributes.offsetInMilliseconds = 0;
                this.attributes.playbackIndexChanged = true;

                controller.play.call(this);
            }
        },
        playNext: function () {
            /*
             *  Called when AMAZON.NextIntent or PlaybackController.NextCommandIssued is invoked.
             *  Index is computed using token stored when AudioPlayer.PlaybackStopped command is received.
             *  If reached at the end of the playlist, choose behavior based on "loop" flag.
             */
            var index = this.attributes.index;
            index += 1;
            // Check for last audio file.
            if (index === this.attributes.audioData.length) {
                if (this.attributes.loop) {
                    index = 0;
                } else {
                    // Reached at the end. Thus reset state to start mode and stop playing.
                    this.handler.state = constants.states.START_MODE;

                    if (utils.canThrowCard.call(this)) {
                        var cardTitle = podcast.title + ' (' + podcast.date + ')';
                        var cardContent = podcast.description;
                        var cardImage = {
                            'smallImageUrl': 'https://s3.amazonaws.com/ligonier-echo-apps/700x700_5MiCH.jpg',
                            'largeImageUrl': 'https://s3.amazonaws.com/ligonier-echo-apps/1200x1200_5MiCH.jpg'
                        };
                        this.response.cardRenderer(cardTitle, cardContent, cardImage);
                    }

                    var message = 'You\'re listening to the most recent episode. Say, Previous, to listen to earlier episodes.';
                    this.response.speak(message).audioPlayerStop();
                    this.emit(':responseReady');
                }
            } else {
                // Set values to attributes.
                this.attributes.index = index;
                this.attributes.offsetInMilliseconds = 0;
                this.attributes.playbackIndexChanged = true;

                controller.play.call(this);
            }
        },
        cPrevious: function () {
            /*
             * The command variant of playPrevious. Blame the stakeholders.
             */
            var index = this.attributes.index;
            index -= 1;
            // Check for last audio file.
            if (index === -1) {
                if (this.attributes.loop) {
                    index = this.attributes.audioData.length - 1;
                } else {
                    // Manual attempt to reach beyond the beginning.
                    var token = String(this.attributes.playOrder[this.attributes.index]);
                    var playBehavior = 'REPLACE_ALL';
                    var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                    var offsetInMilliseconds = this.attributes.offsetInMilliseconds;

                    if (utils.canThrowCard.call(this)) {
                        var cardTitle = podcast.title + ' (' + podcast.date + ')';
                        var cardContent = podcast.description;
                        var cardImage = {
                            'smallImageUrl': 'https://s3.amazonaws.com/ligonier-echo-apps/700x700_5MiCH.jpg',
                            'largeImageUrl': 'https://s3.amazonaws.com/ligonier-echo-apps/1200x1200_5MiCH.jpg'
                        };
                        this.response.cardRenderer(cardTitle, cardContent, cardImage);
                    }

                    var message = 'You have reached the last available episode. Visit Five Minutes in Church History dot com to access older episodes';
                    this.response.speak(message).audioPlayerPlay(playBehavior, podcast.url, token, null, offsetInMilliseconds);
                    this.emit(':responseReady');
                }
            } else {
                // Set values to attributes.
                this.attributes.index = index;
                this.attributes.offsetInMilliseconds = 0;
                this.attributes.playbackIndexChanged = true;

                controller.play.call(this);
            }
        },
        playPrevious: function () {
            /*
             *  Called when AMAZON.PreviousIntent or PlaybackController.PreviousCommandIssued is invoked.
             *  Index is computed using token stored when AudioPlayer.PlaybackStopped command is received.
             *  If reached at the end of the playlist, choose behavior based on "loop" flag.
             */
            var index = this.attributes.index;
            index -= 1;
            // Check for last audio file.
            if (index === -1) {
                if (this.attributes.loop) {
                    index = this.attributes.audioData.length - 1;
                } else {
                    // Reached at the end. Thus reset state to start mode and stop playing.
                    this.handler.state = constants.states.START_MODE;

                    var message = 'You have reached the last available episode. Visit Five Minutes in Church History dot com to access older episodes';
                    this.response.speak(message).audioPlayerStop();
                    this.emit(':responseReady');
                }
            } else {
                // Set values to attributes.
                this.attributes.index = index;
                this.attributes.offsetInMilliseconds = 0;
                this.attributes.playbackIndexChanged = true;

                controller.play.call(this);
            }
        },
        loopOn: function () {
            // Turn on loop play.
            this.attributes.loop = true;
            var message = 'Loop turned on.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        loopOff: function () {
            // Turn off looping
            this.attributes.loop = false;
            var message = 'Loop turned off.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        shuffleOn: function () {
            // Turn on shuffle play.
            this.attributes.shuffle = true;
            utils.shuffleOrder((newOrder) => {
                // Play order have been shuffled. Re-initializing indices and playing first song in shuffled order.
                this.attributes.playOrder = newOrder;
                this.attributes.index = 0;
                this.attributes.offsetInMilliseconds = 0;
                this.attributes.playbackIndexChanged = true;
                controller.play.call(this);
            });
        },
        shuffleOff: function () {
            // Turn off shuffle play.
            if (this.attributes.shuffle) {
                this.attributes.shuffle = false;
                // Although changing index, no change in audio file being played as the change is to account for reordering playOrder
                this.attributes.index = this.attributes.playOrder[this.attributes.index];
                this.attributes.playOrder = Array.apply(null, {length: this.attributes.audioData.length}).map(Number.call, Number);
            }
            controller.play.call(this);
        },
        startOver: function () {
            // Start over the current audio file.
            this.attributes.offsetInMilliseconds = 0;
            controller.play.call(this);
        },
        reset: function () {
            // Update audioData
            Feed.load(request_string, function(error, body){
                initializeSession.call(this, body);
                var token = String(this.attributes.playOrder[this.attributes.index]);
                var playBehavior = 'REPLACE_ALL';
                var podcast = this.attributes.audioData[this.attributes.playOrder[this.attributes.index]];
                var offsetInMilliseconds = this.attributes.offsetInMilliseconds;
                this.attributes.playbackIndexChanged = true;
                // Since play behavior is REPLACE_ALL, enqueuedToken attribute need to be set to null.
                this.attributes.enqueuedToken = null;

                controller.play.call(this);
            }.bind(this));
        }
    }
}();
