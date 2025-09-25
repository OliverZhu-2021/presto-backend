const encodeEmailKey = (email) => email.replace(/\./g, '_DOT_');
const decodeEmailKey = (email) => email.replace(/_DOT_/g, '.');

export default { encodeEmailKey, decodeEmailKey };