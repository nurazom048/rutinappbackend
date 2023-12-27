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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClasses = exports.getNotificationClasses = void 0;
//******************************************************************************** */
//
//.............................getNotificationClasses .............................//
//
//******************************************************************************** */
const getNotificationClasses = (classes, periods) => __awaiter(void 0, void 0, void 0, function* () {
    return classes.map(cls => {
        const startPeriod = periods.find(p => p.priode_number === cls.start && p.rutin_id.toString() === cls.routine_id.toString());
        const endPeriod = periods.find(p => p.priode_number === cls.end && p.rutin_id.toString() === cls.routine_id.toString());
        return Object.assign(Object.assign({}, cls.toObject()), { start_time: startPeriod ? startPeriod.start_time : null, end_time: endPeriod ? endPeriod.end_time : null });
    });
});
exports.getNotificationClasses = getNotificationClasses;
// get class
const getClasses = (classes, periods) => __awaiter(void 0, void 0, void 0, function* () {
    return classes.map(cls => {
        const startPriode = periods.find(p => p.priode_number === cls.start);
        const endPriode = periods.find(p => p.priode_number === cls.end);
        return Object.assign(Object.assign({}, cls.toObject()), { start_time: startPriode ? startPriode.start_time : null, end_time: endPriode ? endPriode.end_time : null });
    });
});
exports.getClasses = getClasses;
