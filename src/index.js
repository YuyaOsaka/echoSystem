const Alexa = require('ask-sdk-core');
const Adapter = require('ask-sdk-dynamodb-persistence-adapter');
const dayjs = require('dayjs');
const config = {tableName: 'userTable', 
    partition_key_name: 'id',  
    attributesName: 'userAndDate', 
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
        const repromptSpeechOutput = '行う操作を教えてください。';

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
        const attributesManager = handlerInput.attributesManager;
        const attributes = await attributesManager.getPersistentAttributes() || {};
        const allUserList = JSON.parse(attributes.data);
        
        // DynamoDBにユーザーを追加
        allUserList.userList.push(inputName);
        attributesManager.setPersistentAttributes({'data':JSON.stringify(allUserList)});
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
                            追加を終了する場合は、追加を終了と発話してください。`;
        const repromptSpeechOutput = '行う操作を教えてください。';

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
        // 登録日を取得
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
        const serviceClientFactory = handlerInput.serviceClientFactory;
        const upsServiceClient = serviceClientFactory.getUpsServiceClient();
        const userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
        const currentDateTime = new Date(new Date().toLocaleString('ja-JP', {timeZone: userTimeZone}));
        const firstAddDate = new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), currentDateTime.getDate());

        // スロットからユーザー名を取得
        const inputName = handlerInput.requestEnvelope.request.intent.slots.name.value;

        // DynamoDBにユーザーと登録日を追加
        const allUserList = {userList:[inputName], calledDate:firstAddDate, numberOfCalls:0};
        const attributesManager = handlerInput.attributesManager;
        attributesManager.setPersistentAttributes({'data':JSON.stringify(allUserList)});
        await attributesManager.savePersistentAttributes();

        const speechOutput = `${inputName}さんを当番表に初期登録しました。`;
        const repromptSpeechOutput = '初期登録の確認をします。「はい」か「いいえ」で応答してください';
        
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

        // DynamoDBからデータを取得
        const attributesManager = handlerInput.attributesManager;
        const attributes = await attributesManager.getPersistentAttributes() || {};
        const allUserList = JSON.parse(attributes.data);

        // DynamoDBにユーザーを追加
        allUserList.userList.push(inputName);
        attributesManager.setPersistentAttributes({'data':JSON.stringify(allUserList)});
        await attributesManager.savePersistentAttributes();
        
        const speechOutput = `${inputName}さんを当番表に追加しました。`;
        const repromptSpeechOutput = '終了しますか？終了する場合は、追加を終了と発話してください。';

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
        const speechOutput = 'ユーザーの登録を終了します。';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
    },
};

const GetDutyIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetDutyIntent';
    },
    async handle(handlerInput) {
        // 現在日を取得
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
        const serviceClientFactory = handlerInput.serviceClientFactory;
        const upsServiceClient = serviceClientFactory.getUpsServiceClient();
        const userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
        const currentDateTime = new Date(new Date().toLocaleString('ja-JP', {timeZone: userTimeZone}));
        
        // 現在日を形式変換
        const currentDate = dayjs(new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), 
            currentDateTime.getDate())).format('YYYY/MM/DD');

        // テーブル内のデータを取得
        const attributesManager = handlerInput.attributesManager;
        let attributes = await attributesManager.getPersistentAttributes() || {};
        let currentData = JSON.parse(attributes.data);
        
        // 最終呼び出し日を形式変換
        const lastCalledDate = dayjs(currentData.calledDate).format('YYYY/MM/DD');
        
        // 現在日と最終呼び出し日の差分を算出
        const dateDiff = dayjs(currentDate).diff(lastCalledDate, 'days');

        // 呼び出し日が異なる場合、呼び出し日と回数を更新する
        if(dateDiff > 0) {
            const allUserList = {userList:currentData.userList, calledDate:currentDate,
                numberOfCalls:currentData.numberOfCalls + 1};
            attributesManager.setPersistentAttributes({'data':JSON.stringify(allUserList)});
            await attributesManager.savePersistentAttributes();

            // データの再取得
            attributes = await attributesManager.getPersistentAttributes() || {};
            currentData = JSON.parse(attributes.data);
        }

        const index = currentData.numberOfCalls % currentData.userList.length;

        // 当番の名前データをテキストに追加
        const speechOutput = `今日のスピーチ当番は、${currentData.userList[index]}さんです。`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
    },
};

const SkipIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'SkipIntent';
    },
    async handle(handlerInput) {
        // テーブル内のデータを取得
        const attributesManager = handlerInput.attributesManager;
        let attributes = await attributesManager.getPersistentAttributes() || {};
        let currentData = JSON.parse(attributes.data);

        // テーブルにデータを上書き
        const updateData = {userList:currentData.userList, calledDate:currentData.calledDate,
            numberOfCalls:currentData.numberOfCalls + 1};
        attributesManager.setPersistentAttributes({'data':JSON.stringify(updateData)});
        await attributesManager.savePersistentAttributes();

        // 新しい当番の名前データをテキストに追加
        attributes = await attributesManager.getPersistentAttributes() || {};
        currentData = JSON.parse(attributes.data);
        const index = currentData.numberOfCalls % currentData.userList.length;
        const speechOutput = `スピーチ当番のスキップが完了しました。
                                新しい当番は${currentData.userList[index]}さんです。`;

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
        const allUserList = JSON.parse(attributes.data).userList;

        // 取得した名前データをテキストに追加
        let speechOutput = '当番表に登録されているメンバーは、';
        for (const i in allUserList) {
            speechOutput += `${allUserList[i]}さん、`;
        }
        speechOutput += 'です。';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
    },
};

const DeleteIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'DeleteIntent';
    },
    async handle(handlerInput) {
        // スロットからユーザー名を取得
        const inputName = handlerInput.requestEnvelope.request.intent.slots.name.value;

        // DynamoDBからデータを取得
        const attributesManager = handlerInput.attributesManager;
        const attributes = await attributesManager.getPersistentAttributes() || {};
        const allUserList = JSON.parse(attributes.data);

        // 取得した名前データをテキストに追加
        if(allUserList.userList.length <= 1) {
            return handlerInput.responseBuilder
                .speak('リストが1名以下の場合は、削除を行えません。')
                .getResponse();
        }
        for (const i in allUserList.userList) {
            if(allUserList.userList[i] === inputName) {
                const speechOutput = `削除が完了しました。削除されたメンバーは、
                                        ${allUserList.userList[i]}さんです。`
                allUserList.userList.splice(i, 1);
                attributesManager.setPersistentAttributes({'data':JSON.stringify(allUserList)});
                await attributesManager.savePersistentAttributes()
                return handlerInput.responseBuilder
                    .speak(speechOutput)
                    .getResponse();
            }
        }

        return handlerInput.responseBuilder
            .speak(`${inputName}さんは見つかりませんでした。`)
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
            .speak('終了します')
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
        AddUserIntentHandler,
        DialogIntentHandler,
        DialogFirstAddIntentHandler,
        DialogAddIntentHandler,
        DialogEndIntentHandler,
        GetDutyIntentHandler,
        SkipIntentHandler,
        GetAllUserIntentHandler,
        DeleteIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .withApiClient(new Alexa.DefaultApiClient())
    .withPersistenceAdapter(DynamoDBAdapter)
    .addErrorHandlers(ErrorHandler)
    .lambda();
