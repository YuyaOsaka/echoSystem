const alexa = require('ask-sdk-core');
const adapter = require('ask-sdk-dynamodb-persistence-adapter');
const dynamoDB = require('./dynamoDB.js');
const day = require('./day.js');
const yomigana = require('./yomigana.js');
const duty = require('./duty.js');
const config = {tableName: 'userTable', 
    partition_key_name: 'id',  
    attributesName: 'userAndDate'};
const dynamoDBAdapter = new adapter.DynamoDbPersistenceAdapter(config);

const PERMISSIONS = ['alexa::profile:email:read'];

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
        const inputName = handlerInput.requestEnvelope.request.intent.slots.name.value;
        const inputNameReading = await yomigana.getYomigana(inputName);

        const allUserList = await dynamoDB.getUserData(handlerInput);
        allUserList.userList.push({name:inputName, read:inputNameReading});
        await dynamoDB.putUserData(handlerInput, allUserList);
        
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
        const firstAddDate = day.getFormartedDate();

        // メールアドレス情報の取得可否確認用
        const { responseBuilder, serviceClientFactory } = handlerInput;

        try {
            // メールアドレス情報の取得
            const deviceAddressServiceClient = serviceClientFactory.getUpsServiceClient();
            const email = await deviceAddressServiceClient.getProfileEmail(); 

            // スロットからユーザー名を取得
            const inputName = handlerInput.requestEnvelope.request.intent.slots.name.value;
            const inputNameReading = await yomigana.getYomigana(inputName);

            // DynamoDBにユーザーと登録日を追加
            const allUserList = {userList:[{name:inputName, read:inputNameReading}], calledDate:firstAddDate, dutyName:inputName, mailAddress:email};
            await dynamoDB.putUserData(handlerInput, allUserList);

            const speechOutput = `${inputName}さんを当番表に初期登録しました。`;
            
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();
        } catch (error) {
            if (error.name == 'ServiceError') {
                console.log(`ERROR StatusCode:${error.statusCode} ${  error.message}`);
            }
            return responseBuilder
                .speak('メールアドレスの利用が許可されていません。アレクサアプリの設定を変更して下さい。')
                .withAskForPermissionsConsentCard(PERMISSIONS)
                .getResponse();
        }
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
        const inputNameReading = await yomigana.getYomigana(inputName);

        // DynamoDBからデータを取得
        const allUserList = await dynamoDB.getUserData(handlerInput);

        // DynamoDBにユーザーを追加
        allUserList.userList.push({name:inputName, read:inputNameReading});
        dynamoDB.putUserData(handlerInput, allUserList);
        
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
        const currentDate = day.getFormartedDate();

        // テーブル内のデータを取得
        let currentData = await dynamoDB.getUserData(handlerInput);
        const lastCalledDate = currentData.calledDate;
        let newDuty;
        let updateData;

        if(day.isDifferentDate(currentDate, lastCalledDate)) {
            const newDutyData = duty.getDutyName(currentData);
            newDuty = newDutyData.dutyName;

            updateData = {userList:currentData.userList, 
                calledDate:currentData.calledDate,
                dutyName:newDuty,
                mailAddress:currentData.mailAddress};
            dynamoDB.putUserData(handlerInput, updateData);
            currentData = await dynamoDB.getUserData(handlerInput);
        }
        const speechOutput = `今日のスピーチ当番は、${currentData.dutyName}さんです。`;

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
        let currentData = await dynamoDB.getUserData(handlerInput);
        let previousDuty;
        let newDuty;

        // テーブルに当番データを上書き
        for (let i = 0; i<currentData.userList.length; i++) {
            const newDutyData = duty.getDutyName(currentData);
            newDuty = newDutyData.dutyName;
            previousDuty = newDutyData.previousDutyName
        }
        const updateData = {userList:currentData.userList, 
            calledDate:currentData.calledDate,
            dutyName:newDuty,
            mailAddress:currentData.mailAddress};
        dynamoDB.putUserData(handlerInput, updateData);

        // 新しい当番の名前データをテキストに追加
        currentData = await dynamoDB.getUserData(handlerInput);
        const speechOutput = `当番を${previousDuty}さんから${currentData.dutyName}さんに変更しました。`;
        
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
        const currentData = await dynamoDB.getUserData(handlerInput);

        // 取得した名前データをテキストに追加
        let speechOutput = '当番表に登録されているメンバーは、';
        for (let i = 0; i<currentData.userList.length; i++) {
            speechOutput += `${currentData.userList[i].name}さん、`;
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
        const currentData = await dynamoDB.getUserData(handlerInput);

        // 取得した名前データをテキストに追加
        if(currentData.userList.length <= 1) {
            return handlerInput.responseBuilder
                .speak('リストが1名以下の場合は、削除を行えません。')
                .getResponse();
        }
        for (let i = 0; i<currentData.userList.length; i++) {
            if (currentData.userList[i].name === inputName) {
                if (currentData.dutyName === inputName) {
                    currentData.dutyName = i === currentData.userList.length-1 ? 
                        currentData.userList[0].name : 
                        currentData.userList[i+1].name;
                }
                const speechOutput = `削除が完了しました。削除されたメンバーは、
                                        ${currentData.userList[i].name}さんです。`;
                currentData.userList.splice(i, 1);
                dynamoDB.putUserData(handlerInput, currentData);
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

const SortIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'SortIntent';
    },
    async handle(handlerInput) {
        // テーブル内のデータを取得
        let currentData = await dynamoDB.getUserData(handlerInput);

        // テーブルに当番データを上書き
        const sortedList = currentData.userList.sort((x, y) => x.read.localeCompare(y.read, 'ja'));

        const updateData = {userList:sortedList, 
            calledDate:currentData.calledDate,
            dutyName:currentData.dutyName,
            mailAddress:currentData.mailAddress};
        dynamoDB.putUserData(handlerInput, updateData);

        // データを再取得
        currentData = await dynamoDB.getUserData(handlerInput);

        // 取得した名前データをテキストに追加
        let speechOutput = '新しい順番は、';
        for (const i in currentData.userList) {
            speechOutput += `${currentData.userList[i].name}さん、`;
        }
        speechOutput += 'になります。';

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

const skillBuilder = alexa.SkillBuilders.custom();

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
        SortIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .withApiClient(new alexa.DefaultApiClient())
    .withPersistenceAdapter(dynamoDBAdapter)
    .addErrorHandlers(ErrorHandler)
    .lambda();
