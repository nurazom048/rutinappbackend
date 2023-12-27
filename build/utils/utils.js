"use strict";
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.printError = exports.print = void 0;
// print ==> consoloe.log()
const print = (string) => {
    console.log("Debug Print : " + string);
};
exports.print = print;
const printError = (string) => {
    console.log('ErrorPrint : ' + string);
};
exports.printError = printError;
