const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: 'ap-northeast-1'
});

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
            || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent');
    },
    handle(handlerInput) {
        const launchRequestText = `このスキルではスピーチ当番の確認ができます。
                                    他にもユーザーの初期登録、ユーザーの追加、
                                    ユーザーの削除、登録されているユーザーの確認、
                                    当番のスキップが行えます。`;
        const launchRequestRepromptText = `行う操作を教えてください。`;

        return handlerInput.responseBuilder
            .speak(launchRequestText)
            .reprompt(launchRequestRepromptText)
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
        const addUserText = `${inputName}さんを当番表に追加しました。`;

        return handlerInput.responseBuilder
            .speak(addUserText)
            .getResponse();
    },
};

const DialogIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'DialogIntent';
    },
    handle(handlerInput) {
        const dialogText = `誰を追加しますか？まるまるさんを追加、のように教えてください。
                            追加を終了する場合は、追加を終了と発話してください。`;
        const dialogRepromptText = `行う操作を教えてください。`;

        return handlerInput.responseBuilder
            .speak(dialogText)
            .reprompt(dialogRepromptText)
            .getResponse();
    },
};

const DialogAddIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'DialogAddIntent';
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
        const dialogAddText = `${inputName}さんを当番表に追加しました。`;
        const dialogAddRepromptText = `終了しますか？終了する場合は、追加を終了と発話してください。`;

        return handlerInput.responseBuilder
            .speak(dialogAddText)
            .reprompt(dialogAddRepromptText)
            .getResponse();
    },
};

const DialogEndIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'DialogEndIntent';
    },
    handle(handlerInput) {
        const dialogEndText = `ユーザーの登録を終了します。`;

        return handlerInput.responseBuilder
            .speak(dialogEndText)
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
        let getAllUserText = `当番表に登録されているメンバーは、`;
        for (const i in allUserList) {
            getAllUserText += `${allUserList[i].name}さん、`;
        }
        getAllUserText += `です。`;

        return handlerInput.responseBuilder
            .speak(getAllUserText)
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
        return handlerInput.responseBuilder
            .speak(`終了します`)
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
            .speak(`エラーが発生しました`)
            .getResponse();
    },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        AddUserIntentHandler,
        DialogIntentHandler,
        DialogAddIntentHandler,
        DialogEndIntentHandler,
        GetAllUserIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();

