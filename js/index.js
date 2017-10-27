'use strict';

const Alexa = require('alexa-sdk');
const constants = require('./constants');
const stateHandlers = require('./stateHandlers');
const audioEventHandlers = require('./audioEventHandlers');
var VoiceInsights = require('voice-insights-sdk');

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.appId = constants.appId;
    alexa.dynamoDBTableName = constants.dynamoDBTableName;

    VoiceInsights.initialize(event.session, constants.viAppToken);

    alexa.registerHandlers(
        stateHandlers.startModeIntentHandlers,
        stateHandlers.playModeIntentHandlers,
        stateHandlers.remoteControllerHandlers,
        stateHandlers.resumeModeIntentHandlers,
        audioEventHandlers
    );
    alexa.execute();
};
