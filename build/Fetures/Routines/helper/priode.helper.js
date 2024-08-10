"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMidArray = void 0;
const weakday_Model_1 = __importDefault(require("../models/weakday.Model"));
// Find the priode mid number if the priode is to show any class
function calculateMidArray(routineID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const allWeekday = yield weakday_Model_1.default.find({ routine_id: routineID });
            // console.log(allWeekday)
            const mid = [];
            for (let i = 0; i < allWeekday.length; i++) {
                const weekday = yield weakday_Model_1.default.findById(allWeekday[i].id);
                console.log(weekday);
                if (weekday) {
                    for (let j = weekday.start + 1; j < weekday.end; j++) {
                        mid.push(j);
                    }
                }
            }
            // console.log('Mid Array:', mid);
            return mid;
        }
        catch (error) {
            console.error('Error in calculateMidArray:', error);
            throw new Error(`Weekday not found for ID}`);
        }
    });
}
exports.calculateMidArray = calculateMidArray;
