
import mongoose, { Document, Schema, Model } from 'mongoose';
import { AccountType } from './Account.Model';



interface IPendingAccount extends Document {
  isAccept: boolean;
  email: string;
  username: string;
  EIIN: string;
  address?: string;
  name?: string;
  about?: string;
  contractInfo?: string;
  phone?: string;
  image?: string;
  coverImage?: string;
  sendTime: Date;
  password?: string;
  account_type: AccountType;
  googleSignIn: boolean;
}

const pendingAccountSchema: Schema<IPendingAccount> = new Schema<IPendingAccount>({
  isAccept: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  EIIN: {
    type: String,
    required: true,
    unique: true,
  },
  address: String,
  name: String,
  about: String,
  contractInfo: String,
  phone: String,
  image: String,
  coverImage: String,
  sendTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  password: String,
  account_type: {
    type: String,
    enum: [AccountType.User, AccountType.Student, AccountType.Academy],
    required: true,
    default: AccountType.User,
  },
  googleSignIn: {
    type: Boolean,
    require: true,
    default: false,
  },
});

const PendingAccount: Model<IPendingAccount> = mongoose.model<IPendingAccount>('PendingAccount', pendingAccountSchema);

export default PendingAccount;












// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const pendingAccount = new Schema({

//   isAccept: {
//     type: Boolean,
//     default: false,

//   },

//   email: {
//     type: String,
//     required: true,
//   },
//   username: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   EIIN: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   adddress: {
//     type: String,

//   },


//   name: {
//     type: String,

//   },

//   about: {
//     type: String,


//   },

//   contractInfo: {
//     type: String,


//   },
//   email: {
//     type: String,

//   },
//   phone: {
//     type: String,

//   },
//   image: {
//     type: String
//   },
//   coverImage: {
//     type: String
//   },
//   sendTime: {
//     type: Date,
//     required: true,
//     default: Date.now
//   },
//   password: {
//     type: String,
//   },
//   account_type: {
//     type: String,
//     enum: ['user', 'academy'],
//     required: true,
//     default: 'user'
//   },
//   googleSignIn: {
//     type: Boolean,
//     require: true,
//     default: false,
//   }


// });

// const Account = mongoose.model('PendingAccount', pendingAccount);

// module.exports = Account;
