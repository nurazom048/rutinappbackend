import Weekday from "../models/weakday.Model";

// Find the priode mid number if the priode is to show any class
export async function calculateMidArray(routineID: any): Promise<number[]> {
    try {
        const allWeekday = await Weekday.find({ routine_id: routineID });
        // console.log(allWeekday)

        const mid: number[] = [];
        for (let i = 0; i < allWeekday.length; i++) {
            const weekday = await Weekday.findById(allWeekday[i].id);
            console.log(weekday)

            if (weekday) {
                for (let j = weekday.start + 1; j < weekday.end; j++) {
                    mid.push(j);
                }
            }
        }

        // console.log('Mid Array:', mid);

        return mid;
    } catch (error) {
        console.error('Error in calculateMidArray:', error);
        throw new Error(`Weekday not found for ID}`);

    }
}
