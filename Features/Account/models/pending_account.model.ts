
import mongoose, { Document, Schema, Model, mongo } from 'mongoose';
import { AccountType } from './Account.Model';
import { maineDB } from '../../../connection/mongodb.connection';




interface IPendingAccount extends Document {
  // accountId: mongoose.Types.ObjectId,
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
  // accountId: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'Account',

  // },
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

const PendingAccount: Model<IPendingAccount> = maineDB.model<IPendingAccount>('PendingAccount', pendingAccountSchema);

export default PendingAccount;



