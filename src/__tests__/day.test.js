const day = require('../day');

describe("日付取得関数のモックテスト", () => {
    it("モック化できているか", () => {
        const designatedDate = "2020/12/09";

        jest.spyOn(day, 'getDate').mockReturnValue(designatedDate);
        
        expect(day.getDate()).toBe('2020/12/09');
    });
});

describe("日付比較関数のモックテスト", () => {
    it("モック化できているか", () => {
        jest.spyOn(day, 'compareDates').mockReturnValue(true);
        
        expect(day.compareDates()).toBe(true);
    });
});
