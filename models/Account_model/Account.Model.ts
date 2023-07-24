
import mongoose, { Document, Schema, Model } from 'mongoose';
import { maineDB } from '../../connection/mongodb.connection';

export const  enum AccountType {
  User = 'user',
  Student = 'student',
  Academy = 'academy',
}

interface IAccount extends Document {
  username: string;
  name?: string;
  about?: string;
  email?: string;
  phone?: string;
  image?: string;
  coverImage?: string;
  Saved_routines: mongoose.Types.ObjectId[];
  password?: string;
  osUserID?: string;
  account_type: AccountType;
  routines: mongoose.Types.ObjectId[];
  googleSignIn: boolean;
  lastLoginTime?: Date;
}

const accountSchema: Schema<IAccount> = new Schema<IAccount>({

  username: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  about: String,
  email: {
    type: String,
    unique: true,
  },
  phone: {
    type: String,
    unique: true,
  },
  image: String,
  coverImage: String,
  Saved_routines: [{
    type: Schema.Types.ObjectId,
    ref: 'Routine',
  }],
  password: String,
  osUserID: String,
  account_type: {
    type: String,
    enum: [AccountType.User, AccountType.Student, AccountType.Academy],
    required: true,
    default: AccountType.User,
  },
  routines: [{
    type: Schema.Types.ObjectId,
    ref: 'Routine',
  }],
  googleSignIn: {
    type: Boolean,
    require: true,
    default: false,
  },
  lastLoginTime: Date,
});
maineDB.model('Account', accountSchema);

const Account: Model<IAccount> = maineDB.model<IAccount>('Account', accountSchema);

export default Account;
