const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const accountId = process.env.ACCOUNT_ID;
const accessKeyId = process.env.ACCESS_KEY_ID;
const secretAcessKey = process.env.SECRET_ACCESS_KEY;

const bucket = 'discordbot-ai-youtube';

const s3 = new S3Client({
    region: 'auto', // Required by AWS SDK, not used by R2
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAcessKey
    }
});

async function UploadFile(localFilePath) {
    const file = await fs.readFile(localFilePath);
    const ext = path.extname(localFilePath).toLowerCase() || '.mp3';
    const key = `${Date.now()}-${crypto.randomUUID()}${ext}`;

    await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: 'audio/mpeg'
    }));

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    await fs.unlink(localFilePath).catch((error)=>{ console.log(error) });

    return url;
}

module.exports = {UploadFile};