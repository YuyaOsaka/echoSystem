const Alexa = require('ask-sdk-core');
const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: "ap-northeast-1"
  });

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
            || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent');
    },
    handle(handlerInput) {
        const speechText = 'Hello World.';

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    },
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speechText = 'Hello World Good Day.';

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    },
};

const AddUserIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AddUserIntent';
    },
    async handle(handlerInput) {
        // スロットからユーザー名を取得
        const inputName = handlerInput.requestEnvelope.request.intent.slots.name.value;
        // DynamoDBにユーザーを追加
        const params = {
            TableName: 'userList',
            Item: {
                name: inputName
            }
        };
        await dynamoDB.put(params).promise();
        const speechText = `${inputName}さんを当番表に追加しました。`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    },
};

const GetAllUserIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetAllUserIntent';
    },
    async handle(handlerInput) {
        // テーブル内のデータ件数を取得
        const params = {
            TableName: 'userList',
          };
        const allUserList = [];
        const result = await dynamoDB.scan(params).promise();
        allUserList.push(...result.Items);

        // 取得した名前データをテキストに追加
        let speechText = `当番表に登録されているメンバーは、`;
        for (const i in allUserList) {
            speechText += `${allUserList[i].name}さん、`;
        }
        speechText += `です。`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    },
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'さようなら';

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('エラーが発生しました')
            .getResponse();
    },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        AddUserIntentHandler,
        GetAllUserIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();

