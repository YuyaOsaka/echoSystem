const getUserData = require('../dynamoDB');

describe("ユーザー取得関数のモックテスト", () => {
    it("モック化できているか", () => {
        const jsonText = '{"userList":["山田","中山"],"calledDate":"2020/12/08","numberOfCalls":5}';

        jest.spyOn(getUserData, 'getUserData').mockReturnValueOnce(jsonText);
        expect(getUserData.getUserData()).toBe('{"userList":["山田","中山"],"calledDate":"2020/12/08","numberOfCalls":5}');
    });
});