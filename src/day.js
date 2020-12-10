const dayjs = require('dayjs');

function getFormartedDate() {
    console.log(dayjs())
    return dayjs().format('YYYY/MM/DD');
}

function isDifferentDate(currentDate, lastCalledDate) {
    const formatedLastCalledDate = dayjs(lastCalledDate).format('YYYY/MM/DD');
    const dateDiff = dayjs(currentDate).diff(formatedLastCalledDate, 'days');
    return dateDiff > 0;
}

module.exports = {
    getFormartedDate,
    isDifferentDate
}
