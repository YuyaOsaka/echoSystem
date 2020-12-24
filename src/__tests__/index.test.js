const va = require('virtual-alexa');
const expect = require('expect');
const model = './models/ja-JP.json';
const handler = './src/index.js';
const dynamoDB = require('../dynamoDB');
const day = require('../day');
const yomigana = require('../yomigana');


const alexa = va.VirtualAlexa.Builder()
    .handler(handler)
    .interactionModelFile(model)
    .create();

// 外部ライブラリを利用しないテスト
describe('LaunchRequestのテスト', () => {
    it('スキル起動時にスキルの説明を行うことを確認', async () => {
        const launchResponse = await alexa.launch();
        expect(launchResponse.response.outputSpeech.ssml)
            .toBe(`<speak>このスキルではスピーチ当番の確認ができます。
                                他にもユーザーの初期登録、ユーザーの追加、
                                ユーザーの削除、登録されているユーザーの確認、
                                当番のスキップが行えます。</speak>`);
    });
});

describe('CancelAndStopIntentのテスト', () => {
    it('キャンセル要求があった際にスキルの終了を宣言することを確認', async () => {
        const cancelResponse = await alexa.intend("AMAZON.CancelIntent");
        expect(cancelResponse.response.outputSpeech.ssml)
            .toBe(`<speak>終了します</speak>`);
    });
    it('中断要求があった際にスキルの終了を宣言することを確認', async () => {
        const stopResponse = await alexa.intend("AMAZON.StopIntent");
        expect(stopResponse.response.outputSpeech.ssml)
            .toBe(`<speak>終了します</speak>`);
    });
});

describe('DialogIntentのテスト', () => {
    it('「対話して登録」で呼び出し時に次の動作を促すか確認', async () => {
        const dialogResponse = await alexa.intend("DialogIntent");
        expect(dialogResponse.response.outputSpeech.ssml)
            .toBe(`<speak>誰を追加しますか？まるまるさんを追加、のように教えてください。
                            追加を終了する場合は、追加を終了と発話してください。</speak>`);
    });
});

describe('DialogEndIntentのテスト', () => {
    it('「追加を終了」で呼び出し時に終了宣言を行うか確認', async () => {
        const dialogEndResponse = await alexa.intend("DialogEndIntent");
        expect(dialogEndResponse.response.outputSpeech.ssml)
            .toBe(`<speak>ユーザーの登録を終了します。</speak>`);
    });
});

// 外部ライブラリを利用するテスト
const day1Data = {
    userList: [ { name : '山田', read : 'ヤマダ' }, 
                { name : '斎藤', read : 'サイトウ' } ],
    calledDate: '2020-12-09T00:00:00.000Z',
    dutyName: '山田'
};
const day2Data = {
    userList: [ { name : '山田', read : 'ヤマダ' },    
                { name : '斎藤', read : 'サイトウ' } ],
    calledDate: '2020-12-09T00:00:00.000Z',
    dutyName: '斎藤'
};
const dutyloopData = {
    userList: [ { name : '神田', read : 'カンダ' },    
                { name : '伊藤', read : 'イトウ' },
                { name : '内山', read : 'ウチヤマ' } ],
    calledDate: '2020-12-09T00:00:00.000Z',
    dutyName: '内山'
};
const skipData = {
    userList: [ { name : '山田', read : 'ヤマダ' }, 
                { name : '斎藤', read : 'サイトウ' } ],
    calledDate: '2020-12-09T00:00:00.000Z',
    dutyName: '斎藤'
};
const skiploopData = {
    userList: [ { name : '山田', read : 'ヤマダ' }, 
                { name : '斎藤', read : 'サイトウ' } ],
    calledDate: '2020-12-09T00:00:00.000Z',
    dutyName: '山田'
}
const userListData = {
    userList: [ { name : '原田', read : 'ハラダ' }, 
                { name : '後藤', read : 'ゴトウ' }, 
                { name : '藤', read : 'フジ' } ],
    calledDate: '2020-12-09T00:00:00.000Z',
    dutyName: '藤'
};
const onlyOneUserData = {
    userList: [ { name : '原田', read : 'ハラダ' } ],
    calledDate: '2020-12-09T00:00:00.000Z',
    dutyName: '藤'
};
const sortData = {
    userList: [ { name : '原田', read : 'ハラダ' }, 
                { name : '山田', read : 'ヤマダ' }, 
                { name : '中山', read : 'ナカヤマ' },    
                { name : '後藤', read : 'ゴトウ' }, 
                { name : '中村', read : 'ナカムラ' },                
                { name : '藤', read : 'フジ' } ],
    calledDate: '2020-12-09T00:00:00.000Z',
    dutyName: '藤'
};

const readingName = "サトウ";

const registrationDate = "2020/12/09";
const designatedDate = "2020/12/10";

jest.spyOn(dynamoDB, 'getUserData').mockReturnValue(day1Data);
jest.spyOn(dynamoDB, 'putUserData').mockReturnValue();
jest.spyOn(yomigana, 'getYomigana').mockReturnValue(readingName);
jest.spyOn(day, 'getFormartedDate').mockReturnValue(designatedDate);
jest.spyOn(day, 'isDifferentDate').mockReturnValue(true);

describe('AddUserIntentのテスト', () => {
    it('「中山」を追加した際に、「中山」を含んだ返答を行うことを確認', async () => {
        const addUserResponse = await alexa.intend("AddUserIntent", {name: "佐藤"});
        expect(addUserResponse.response.outputSpeech.ssml)
            .toBe("<speak>佐藤さんを当番表に追加しました。</speak>");
    });
});

describe('DialogFirstAddIntentのテスト', () => {
    it('「山田」を初期登録した際に、「山田」を含んだ返答を行うことを確認', async () => {
        const request = await alexa.request()
            .intent("DialogFirstAddIntent")
            .slot("name", "山田")
            .dialogState("COMPLETED")
        const response = await request.send();
        expect(response.prompt())
            .toBe(`<speak>山田さんを当番表に初期登録しました。</speak>`);
    });
});

describe('DialogAddIntentのテスト', () => {
    it('対話中に「小林」を追加した際に、「小林」を含んだ返答を行うことを確認', async () => {
        const dialogAddResponse = await alexa.intend("DialogAddIntent", {name: "小林"});
        expect(dialogAddResponse.response.outputSpeech.ssml)
            .toBe(`<speak>小林さんを当番表に追加しました。</speak>`);
        jest.spyOn(dynamoDB, 'getUserData').mockClear();
    });
});

describe('GetDutyIntentのテスト', () => {
    it('当番表から当番を決定し、先頭の「山田」が呼ばれることを確認', async () => {
        jest.spyOn(day, 'getFormartedDate').mockReturnValue(registrationDate);
        jest.spyOn(dynamoDB, 'getUserData').mockReturnValue(day1Data);
        const getDutyResponse = await alexa.intend("GetDutyIntent");
        expect(getDutyResponse.response.outputSpeech.ssml)
            .toBe(`<speak>今日のスピーチ当番は、山田さんです。</speak>`);
    });
    it('日付が変わったことで、次の当番である「斎藤」が呼ばれることを確認', async () => {
        jest.spyOn(day, 'getFormartedDate').mockReturnValue(designatedDate);
        jest.spyOn(dynamoDB, 'getUserData').mockReturnValue(day2Data);
        const getDutyResponse = await alexa.intend("GetDutyIntent");
        expect(getDutyResponse.response.outputSpeech.ssml)
            .toBe(`<speak>今日のスピーチ当番は、斎藤さんです。</speak>`);
    });
    it('当番表の最後尾が当番だった場合、次の当番が先頭になることを確認', async () => {
        jest.spyOn(day, 'getFormartedDate').mockReturnValue(designatedDate);
        jest.spyOn(dynamoDB, 'getUserData').mockReturnValue(dutyloopData);
        const getDutyResponse = await alexa.intend("GetDutyIntent");
        expect(getDutyResponse.response.outputSpeech.ssml)
            .toBe(`<speak>今日のスピーチ当番は、内山さんです。</speak>`);
    });
    it('当番表に誰も登録されていない状態で呼び出した場合、エラーメッセージが発生することを確認', async () => {
        jest.spyOn(dynamoDB, 'getUserData').mockReturnValue();
        const errorResponse = await alexa.intend("GetDutyIntent");
        expect(errorResponse.response.outputSpeech.ssml)
            .toBe(`<speak>エラーが発生しました</speak>`);
    });
});

describe('SkipIntentのテスト', () => {
    it('登録初日にskipすることで当番が「山田」から「斎藤」に代わることを確認', async () => {
        jest.spyOn(dynamoDB, 'getUserData').mockReturnValueOnce(day1Data).mockReturnValueOnce(skipData)
        const skipResponse = await alexa.intend("SkipIntent");
        expect(skipResponse.response.outputSpeech.ssml)
            .toBe(`<speak>当番を山田さんから斎藤さんに変更しました。</speak>`);
    });
    it('当番表の最後尾が当番だった場合、スキップ処理後に当番が先頭になることを確認', async () => {
        jest.spyOn(dynamoDB, 'getUserData').mockReturnValueOnce(day2Data).mockReturnValueOnce(skiploopData)
        const getDutyResponse = await alexa.intend("SkipIntent");
        expect(getDutyResponse.response.outputSpeech.ssml)
            .toBe(`<speak>当番を斎藤さんから山田さんに変更しました。</speak>`);
    });
    it('当番表に誰も登録されていない状態で呼び出した場合、エラーメッセージが発生することを確認', async () => {
        jest.spyOn(dynamoDB, 'getUserData').mockReturnValue();
        const errorResponse = await alexa.intend("SkipIntent");
        expect(errorResponse.response.outputSpeech.ssml)
            .toBe(`<speak>エラーが発生しました</speak>`);
    });
});

describe('GetAllUserIntentのテスト', () => {
    it('当番表に登録されている「原田」「後藤」「藤」が呼ばれることを確認', async () => {
        jest.spyOn(dynamoDB, 'getUserData').mockReturnValue(userListData);
        const getAllUserResponse = await alexa.intend("GetAllUserIntent");
        expect(getAllUserResponse.response.outputSpeech.ssml)
            .toBe(`<speak>当番表に登録されているメンバーは、原田さん、後藤さん、藤さん、です。</speak>`);
    });
});

describe('DeleteIntentのテスト', () => {
    it('「斎藤」を指定して削除を行い、「斎藤」を含んだ返答を行うことを確認', async () => {
        jest.spyOn(dynamoDB, 'getUserData').mockReturnValue(day1Data);
        const deleteResponse = await alexa.intend("DeleteIntent", {name: "斎藤"});
        expect(deleteResponse.response.outputSpeech.ssml)
            .toBe(`<speak>削除が完了しました。削除されたメンバーは、
                                        斎藤さんです。</speak>`);
    });

    it('削除対象が当番表に存在しない場合、対象が見つからないと宣言することを確認', async () => {
        jest.spyOn(dynamoDB, 'getUserData').mockReturnValue(day1Data);
        const deleteResponse = await alexa.intend("DeleteIntent", {name: "高田"});
        expect(deleteResponse.response.outputSpeech.ssml)
            .toBe(`<speak>高田さんは見つかりませんでした。</speak>`);
    });

    it('削除の際当番表に1人のみだった場合、削除不可能を宣言することを確認', async () => {
        jest.spyOn(dynamoDB, 'getUserData').mockReturnValue(onlyOneUserData);
        const deleteResponse = await alexa.intend("DeleteIntent", {name: "原田"});
        expect(deleteResponse.response.outputSpeech.ssml)
            .toBe(`<speak>リストが1名以下の場合は、削除を行えません。</speak>`);
    });
});

describe('SortIntentのテスト', () => {
    it('意図した順番となっていることを確認', async () => {
    jest.spyOn(dynamoDB, 'getUserData').mockReturnValue(sortData);
    const sortResponse = await alexa.intend("SortIntent");
        expect(sortResponse.prompt())
            .toBe(`<speak>新しい順番は、後藤さん、中村さん、中山さん、原田さん、藤さん、山田さん、になります。</speak>`);
    });
    it('当番表に誰も登録されていない状態で呼び出した場合、エラーメッセージが発生することを確認', async () => {
        jest.spyOn(dynamoDB, 'getUserData').mockReturnValue();
        const errorResponse = await alexa.intend("SortIntent");
        expect(errorResponse.response.outputSpeech.ssml)
            .toBe(`<speak>エラーが発生しました</speak>`);
    });
});
