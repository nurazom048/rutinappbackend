import mongoose, { Document, Schema, Model } from 'mongoose';
import { NoticeDB } from '../../connection/mongodb.connection';

interface INoticeBoardMember extends Document {
    academyID: mongoose.Types.ObjectId;
    notificationOn: boolean;
    memberID: mongoose.Types.ObjectId;
}

const NoticeBoardMemberSchema: Schema<INoticeBoardMember> = new Schema<INoticeBoardMember>({
    academyID: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    notificationOn: {
        type: Boolean,
        default: false,
    },
    memberID: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
});


// export default NoticeBoardMember;
export default NoticeDB.model('NoticeBoardMember', NoticeBoardMemberSchema);
