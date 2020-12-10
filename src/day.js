const dayjs = require('dayjs');

function getDate() {
    return dayjs().format('YYYY/MM/DD');
}

function isDifferentDate(currentDate, lastCalledDate) {
    const formatedLastCalledDate = dayjs(lastCalledDate).format('YYYY/MM/DD');
    const dateDiff = dayjs(currentDate).diff(formatedLastCalledDate, 'days');
    if(dateDiff > 0) {
        return true;
    }
    return false;
}

module.exports = {
    getDate,
    isDifferentDate
}
