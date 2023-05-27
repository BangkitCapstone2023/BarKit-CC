import moment from 'moment';
import admin from 'firebase-admin';

const timestamp = admin.firestore.Timestamp.now();
const date = timestamp.toDate();
const formattedTimestamp = moment(date).format('YYYY-MM-DD HH:mm:ss');

export default formattedTimestamp;
