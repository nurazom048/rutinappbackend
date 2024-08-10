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
exports.joinHisOwnNoticeboard = exports.generateUniqUsername = exports.generateUsername = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// imports models
const Account_Model_1 = __importDefault(require("../../../Fetures/Account/models/Account.Model"));
const pending_account_model_1 = __importDefault(require("../../../Fetures/Account/models/pending_account.model"));
const noticeboard_member_1 = __importDefault(require("../../../Fetures/Notice_Fetures/models/noticeboard_member"));
const generateUsername = (email) => {
    const atIndex = email.indexOf("@");
    if (atIndex !== -1) {
        return email.substring(0, atIndex);
    }
    return email;
};
exports.generateUsername = generateUsername;
// Generate uniq username 
const generateUniqUsername = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const username = (0, exports.generateUsername)(email);
    const isUsed = (yield Account_Model_1.default.findOne({ username })) || (yield pending_account_model_1.default.findOne({ username }));
    if (isUsed) {
        return username + Date.now();
    }
    return username;
});
exports.generateUniqUsername = generateUniqUsername;
//Methods: Generate Token
/// join the academy user when he create academy account 
const joinHisOwnNoticeboard = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const account = yield Account_Model_1.default.findOne({ id: id });
        if (!account) {
            return { message: 'Academy not found ', id: id };
        }
        const existingMember = yield noticeboard_member_1.default.findOne({
            academyID: id,
            memberID: id,
        });
        if (existingMember) {
            return { message: 'You are already a member' };
        }
        const newMember = new noticeboard_member_1.default({
            academyID: id,
            memberID: id,
        });
        const added = yield newMember.save();
        console.log('added to noticeboard account  : ' + added);
    }
    catch (error) {
        console.error(error);
        return { message: error.message };
    }
});
exports.joinHisOwnNoticeboard = joinHisOwnNoticeboard;
