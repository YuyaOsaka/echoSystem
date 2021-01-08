function getDutyName(currentData) {
    for (let i = 0; i<currentData.userList.length; i++) {
        if (currentData.userList[i].name === currentData.dutyName) {
            const nextDuty = i === currentData.userList.length-1 ? 
                currentData.userList[0].name : 
                currentData.userList[i+1].name;
            const previousDuty = currentData.userList[i].name;
            
            return {dutyName: nextDuty,
                previousDutyName: previousDuty};
        }
    }
}

module.exports = {
    getDutyName
}
