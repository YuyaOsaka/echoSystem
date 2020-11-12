const Alexa = require('ask-sdk-core');
const Adapter = require('ask-sdk-dynamodb-persistence-adapter');
const config = {tableName: 'userList', 
                partition_key_name: 'id',  
                attributesName: 'name', 
                createTable: true};
const DynamoDBAdapter = new Adapter.DynamoDbPersistenceAdapter(config);

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
            || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent');
    },
    handle(handlerInput) {
        const speechOutput = `このスキルではスピーチ当番の確認ができます。
                                    他にもユーザーの初期登録、ユーザーの追加、
                                    ユーザーの削除、登録されているユーザーの確認、
                                    当番のスキップが行えます。`;
        const repromptSpeechOutput = `行う操作を教えてください。`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptSpeechOutput)
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
        
        // DynamoDBから現在のリストを取得
        let allUserList = [];
        const attributesManager = handlerInput.attributesManager;
        const attributes = await attributesManager.getPersistentAttributes() || {};    
        allUserList = attributes.name; 

        // DynamoDBにユーザーを追加
        allUserList.push(inputName);
        attributesManager.setPersistentAttributes({'name':allUserList});
        await attributesManager.savePersistentAttributes();

        const speechOutput = `${inputName}さんを当番表に追加しました。`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
    },
};

const DialogIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'DialogIntent';
    },
    handle(handlerInput) {
        const speechOutput = `誰を追加しますか？まるまるさんを追加、のように教えてください。
                            最初の一人を追加する場合は、まるまるさんを初期登録、と発話してください。
                            追加を終了する場合は、追加を終了と発話してください。`;
        const repromptSpeechOutput = `行う操作を教えてください。`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptSpeechOutput)
            .getResponse();
    },
};

const DialogFirstAddIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'DialogFirstAddIntent';
    },
    async handle(handlerInput) {
        // スロットからユーザー名を取得
        const inputName = handlerInput.requestEnvelope.request.intent.slots.name.value;
        const allUserList = [inputName];

        // // DynamoDBにユーザーを追加
        const attributesManager = handlerInput.attributesManager;
        attributesManager.setPersistentAttributes({'name':allUserList});
        await attributesManager.savePersistentAttributes();

        const speechOutput = `${inputName}さんを追加します。`;
        const repromptSpeechOutput = `終了しますか？終了する場合は、追加を終了と発話してください。`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptSpeechOutput)
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
        
        // DynamoDBから現在のリストを取得
        let allUserList = [];
        const attributesManager = handlerInput.attributesManager;
        const attributes = await attributesManager.getPersistentAttributes() || {};
        allUserList = attributes.name;

        // // DynamoDBにユーザーを追加
        allUserList.push(inputName);
        attributesManager.setPersistentAttributes({'name':allUserList});
        await attributesManager.savePersistentAttributes();

        const speechOutput = `${inputName}さんを追加します。`;
        const repromptSpeechOutput = `終了しますか？終了する場合は、追加を終了と発話してください。`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptSpeechOutput)
            .getResponse();
    },
};

const DialogEndIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'DialogEndIntent';
    },
    handle(handlerInput) {
        const speechOutput = `ユーザーの登録を終了します。`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
    },
};

const GetAllUserIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetAllUserIntent';
    },
    async handle(handlerInput) {
        // テーブル内のデータを取得
        const attributesManager = handlerInput.attributesManager;
        const attributes = await attributesManager.getPersistentAttributes() || {};
        let allUserList = [];
        allUserList = attributes.name;

        // 取得した名前データをテキストに追加
        let speechOutput = `当番表に登録されているメンバーは、`;
        for (const i in allUserList) {
            speechOutput += `${allUserList[i]}さん、`;
        }
        speechOutput += `です。`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
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
        DialogFirstAddIntentHandler,
        DialogAddIntentHandler,
        DialogEndIntentHandler,
        GetAllUserIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .withPersistenceAdapter(DynamoDBAdapter)
    .addErrorHandlers(ErrorHandler)
    .lambda();

