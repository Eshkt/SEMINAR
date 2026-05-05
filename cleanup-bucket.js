const { S3Client, ListObjectVersionsCommand, DeleteObjectsCommand, DeleteBucketCommand } = require('@aws-sdk/client-s3');

const bucketName = 'cnag-aws-qna';
const client = new S3Client({ region: 'ap-southeast-1' });

async function clearAndDeleteBucket() {
  try {
    console.log(`Clearing bucket: ${bucketName}`);
    const versions = await client.send(new ListObjectVersionsCommand({ Bucket: bucketName }));
    
    const objectsToDelete = [];
    if (versions.Versions) {
      versions.Versions.forEach(v => objectsToDelete.push({ Key: v.Key, VersionId: v.VersionId }));
    }
    if (versions.DeleteMarkers) {
      versions.DeleteMarkers.forEach(m => objectsToDelete.push({ Key: m.Key, VersionId: m.VersionId }));
    }

    if (objectsToDelete.length > 0) {
      await client.send(new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: objectsToDelete }
      }));
      console.log(`Deleted ${objectsToDelete.length} objects/versions.`);
    }

    console.log(`Deleting bucket: ${bucketName}`);
    await client.send(new DeleteBucketCommand({ Bucket: bucketName }));
    console.log('Bucket deleted successfully.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

clearAndDeleteBucket();
