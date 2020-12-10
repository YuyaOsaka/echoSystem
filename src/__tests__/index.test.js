const va = require('virtual-alexa');
const expect = require('expect');
const model = './models/ja-JP.json';
const handler = './src/index.js';
const getUserData = require('../dynamoDB');
const day = require('../day');
const dynamoDB = require('../dynamoDB');

const alexa = va.VirtualAlexa.Builder()
    .handler(handler)
    .interactionModelFile(model)
    .create();

describe('標準搭載インテントのテスト', () => {
    it('スキル起動時のメッセージ', async () => {
        const launchResponse = await alexa.launch();
        expect(launchResponse.response.outputSpeech.ssml)
            .toBe(`<speak>このスキルではスピーチ当番の確認ができます。
                                他にもユーザーの初期登録、ユーザーの追加、
                                ユーザーの削除、登録されているユーザーの確認、
                                当番のスキップが行えます。</speak>`);
    });
});

describe('DBを利用しないカスタムインテントの動作テスト', () => {
    it('DialogIntentの動作テスト', async () => {
        const dialogResponse = await alexa.intend("DialogIntent");
        expect(dialogResponse.response.outputSpeech.ssml)
            .toBe(`<speak>誰を追加しますか？まるまるさんを追加、のように教えてください。
                            追加を終了する場合は、追加を終了と発話してください。</speak>`);
    });

    it('DialogEndIntentの動作テスト', async () => {
        const dialogEndResponse = await alexa.intend("DialogEndIntent");
        expect(dialogEndResponse.response.outputSpeech.ssml)
            .toBe(`<speak>ユーザーの登録を終了します。</speak>`);
    });
});

describe('DBを利用するカスタムインテントの動作テスト', () => {
    const jsonText = {
        userList: [ '山田', '斎藤' ],
        calledDate: '2020-12-09T00:00:00.000Z',
        numberOfCalls: 0
    };
    const jsonTextSecondTime = {
        userList: [ '山田', '斎藤' ],
        calledDate: '2020-12-09T00:00:00.000Z',
        numberOfCalls: 1
    };
    const onlyOneUser = {
        userList: [ '山田' ],
        calledDate: '2020-12-09T00:00:00.000Z',
        numberOfCalls: 1
    };
    const designatedDate = "2020/12/10";

    jest.spyOn(getUserData, 'getUserData').mockReturnValue(jsonText);
    jest.spyOn(day, 'getFormartedDate').mockReturnValue(designatedDate);
    jest.spyOn(day, 'isDifferentDate').mockReturnValue(true);

    it('AddUserIntentの動作テスト', async () => {
        const addUserResponse = await alexa.intend("AddUserIntent", {name: "中山"});
        expect(addUserResponse.response.outputSpeech.ssml)
            .toBe("<speak>中山さんを当番表に追加しました。</speak>");
    });

    it('DialogFirstAddIntentの動作テスト', async () => {
        const firstAddResponse = await alexa.intend("DialogFirstAddIntent", {name: "山田"});
        expect(firstAddResponse.response.outputSpeech.ssml)
            .toBe(`<speak>山田さんを当番表に初期登録しました。</speak>`);
    });

    it('DialogAddIntentの動作テスト', async () => {
        const dialogAddResponse = await alexa.intend("DialogAddIntent", {name: "小林"});
        expect(dialogAddResponse.response.outputSpeech.ssml)
            .toBe(`<speak>小林さんを当番表に追加しました。</speak>`);
    });

    it('GetDutyIntentの動作テスト', async () => {
        const getDutyResponse = await alexa.intend("GetDutyIntent");
        expect(getDutyResponse.response.outputSpeech.ssml)
            .toBe(`<speak>今日のスピーチ当番は、山田さんです。</speak>`);
    });

    it('SkipIntentの動作テスト', async () => {
        jest.spyOn(getUserData, 'getUserData').mockReturnValueOnce(jsonText)
            .mockReturnValueOnce(jsonTextSecondTime);
        const skipResponse = await alexa.intend("SkipIntent");
        expect(skipResponse.response.outputSpeech.ssml)
            .toBe(`<speak>当番を山田さんから
                                斎藤さんに変更しました。</speak>`);
    });

    it('GetAllUserIntentの動作テスト', async () => {
        const getAllUserResponse = await alexa.intend("GetAllUserIntent");
        expect(getAllUserResponse.response.outputSpeech.ssml)
    });

    it('DeleteIntentの正常時動作テスト', async () => {
        const deleteResponse = await alexa.intend("DeleteIntent", {name: "斎藤"});
        expect(deleteResponse.response.outputSpeech.ssml)
            .toBe(`<speak>削除が完了しました。削除されたメンバーは、
                                        斎藤さんです。</speak>`);
    });

    it('DeleteIntentでユーザーが見つからなかった場合の動作テスト', async () => {
        const deleteResponse = await alexa.intend("DeleteIntent", {name: "高田"});
        expect(deleteResponse.response.outputSpeech.ssml)
            .toBe(`<speak>高田さんは見つかりませんでした。</speak>`);
    });

    it('DeleteIntent起動時、当番表に一人だった場合の動作テスト', async () => {
        jest.spyOn(dynamoDB, 'getUserData').mockReturnValueOnce(onlyOneUser);
        const deleteResponse = await alexa.intend("DeleteIntent", {name: "山田"});
        expect(deleteResponse.response.outputSpeech.ssml)
            .toBe(`<speak>リストが1名以下の場合は、削除を行えません。</speak>`);
    });
});
