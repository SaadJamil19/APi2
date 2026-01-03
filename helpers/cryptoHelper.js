const crypto = require('crypto');
require('dotenv').config();

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = Buffer.from(process.env.SECRET_KEY, 'hex');

const encrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');

    // We need to store authTag with the encrypted data to decrypt later in GCM mode
    // The requirement says "encrypted_private_key TEXT NOT NULL, -- Base64 encoded encrypted data"
    // and "encryption_iv TEXT NOT NULL".
    // Usually GCM tag is appended to ciphertext or stored separately. 
    // I will append it to the ciphertext for simplicity of the single column constraint, or stick to standard.
    // However, typical GCM usage: Concatenate ciphertext + authTag.

    return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag
    };
};

const decrypt = (encryptedData, ivHex, authTagBase64) => {
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

// Modification to fit the "encrypted_private_key" column strictly if needed:
// But since the DB schema only has `encrypted_private_key` and `encryption_iv`, 
// we MUST store the authTag somewhere.
// Common practice: `encrypted_private_key` = `ciphertext` + `authTag`.
// Let's adjust usage to pack/unpack the tag.

const encryptPacked = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Return base64 of the hex concatenation or just keep it hex?
    // User asked for Base64 encoded encrypted data.
    // So let's do:
    // result = base64(ciphertext_bytes + tag_bytes)

    // Refactoring to be clean about buffers
    const ivBuf = crypto.randomBytes(16);
    const cipher2 = crypto.createCipheriv(ALGORITHM, SECRET_KEY, ivBuf);

    let encryptedBuf = cipher2.update(text, 'utf8');
    encryptedBuf = Buffer.concat([encryptedBuf, cipher2.final()]);
    const tagBuf = cipher2.getAuthTag();

    // Concatenate encrypted content + tag
    const combined = Buffer.concat([encryptedBuf, tagBuf]);

    return {
        encryptedResult: combined.toString('base64'),
        ivResult: ivBuf.toString('hex')
    };
};

const decryptPacked = (encryptedBase64, ivHex) => {
    const combined = Buffer.from(encryptedBase64, 'base64');
    const iv = Buffer.from(ivHex, 'hex');

    // Extract tag (last 16 bytes for GCM)
    const tag = combined.slice(combined.length - 16);
    const text = combined.slice(0, combined.length - 16);

    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(text);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
};

module.exports = {
    encrypt: encryptPacked,
    decrypt: decryptPacked
};
