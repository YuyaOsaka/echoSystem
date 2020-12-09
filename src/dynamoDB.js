async function getUserData(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes() || {};
    const list = JSON.parse(attributes.data);
    return list;
}

async function putUserData(handlerInput, allUserList) {
    const attributesManager = handlerInput.attributesManager;
    attributesManager.setPersistentAttributes({'data':JSON.stringify(allUserList)});
    await attributesManager.savePersistentAttributes();
}

module.exports = {
    getUserData,
    putUserData
}
