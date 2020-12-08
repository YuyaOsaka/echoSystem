const va = require('virtual-alexa');
const model = './models/ja-JP.json';
const expect = require('expect');
const handler = './src/index.js';

const alexa = va.VirtualAlexa.Builder()
    .handler(handler)
    .interactionModelFile(model)
    .create();
alexa.dynamoDB().mock();

describe('スキルの起動テスト', () => {
    it('スキル起動時のメッセージ', async () => {
        const launchResponse = await alexa.launch();
        expect(launchResponse.response.outputSpeech.ssml).toBe(`<speak>このスキルではスピーチ当番の確認ができます。
                                他にもユーザーの初期登録、ユーザーの追加、
                                ユーザーの削除、登録されているユーザーの確認、
                                当番のスキップが行えます。</speak>`);
    });
});

// describe('DBを利用するカスタムスキルの起動テスト', () => {
//     it('当番表の取得インテント', async () => {
//         const firstAddResponse = await alexa.intend("DialogFirstAddIntent", { name: "山田"});
//         expect(firstAddResponse.response.outputSpeech.ssml).toBe("山田さんを当番表に初期登録しました。");
//     });
// });
