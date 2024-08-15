


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