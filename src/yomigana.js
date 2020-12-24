const kuromoji = require('kuromoji');

async function getYomigana(inputWord) {
    //kuromojiによる形態素変換
    const builder = kuromoji.builder({
        dicPath: "./node_modules/kuromoji/dict"
    });
    const tokenizer = await new Promise((resolve, reject) => {
        builder.build((err, tokenizer) => {
            if(err) {
                reject(new Error('Error'));
            }
            resolve(tokenizer);
        })
    })
    const token = tokenizer.tokenize(inputWord);
    return token[0].reading;
}

module.exports = {
    getYomigana
}