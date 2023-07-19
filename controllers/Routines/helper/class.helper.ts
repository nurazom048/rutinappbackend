
//******************************************************************************** */
//
//.............................getNotificationClasses .............................//
//
//******************************************************************************** */
export const getNotificationClasses = async (classes: any[], periods: any[]) => {
    return classes.map(cls => {
        const startPeriod = periods.find(p => p.priode_number === cls.start && p.rutin_id.toString() === cls.routine_id.toString());
        const endPeriod = periods.find(p => p.priode_number === cls.end && p.rutin_id.toString() === cls.routine_id.toString());
        return {
            ...cls.toObject(),
            start_time: startPeriod ? startPeriod.start_time : null,
            end_time: endPeriod ? endPeriod.end_time : null,
        };
    });
};


// get class
export const getClasses = async (classes: any[], periods: any[]) => {


    return classes.map(cls => {
        const startPriode = periods.find(p => p.priode_number === cls.start);
        const endPriode = periods.find(p => p.priode_number === cls.end);
        return {
            ...cls.toObject(),
            start_time: startPriode ? startPriode.start_time : null,
            end_time: endPriode ? endPriode.end_time : null,
        };
    });
};