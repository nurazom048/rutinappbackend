"use strict";
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.printError = exports.printD = exports.print = void 0;
// print ==> consoloe.log()
const print = (string) => {
    console.log("Debug Print : " + string);
};
exports.print = print;
const printD = (string) => {
    console.log("Debug Print : " + string);
};
exports.printD = printD;
const printError = (string) => {
    console.log('ErrorPrint : ' + string);
};
exports.printError = printError;
