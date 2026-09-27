const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

async function getAuthClient() {
  const keyPath = path.resolve(__dirname, '../../service-account.json');
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const projectId = serviceAccount.project_id;
  const auth = new GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/datastore']
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return { projectId, token: tokenResponse.token };
}

async function createIndex(collectionId, fields) {
  const { projectId, token } = await getAuthClient();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/${collectionId}/indexes`;
  const body = {
    queryScope: 'COLLECTION',
    fields: fields.map(f => ({
      fieldPath: f.fieldPath,
      order: f.order === 'DESC' ? 'DESCENDING' : 'ASCENDING'
    }))
  };

  console.log(`Creating index for ${collectionId}:`, JSON.stringify(fields));
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log('Result:', JSON.stringify(data, null, 2));
}

async function run() {
  await createIndex('appointments', [
    { fieldPath: 'branchUid', order: 'ASC' },
    { fieldPath: 'createdAt', order: 'DESC' }
  ]);
  await createIndex('appointments', [
    { fieldPath: 'operatorId', order: 'ASC' },
    { fieldPath: 'createdAt', order: 'DESC' }
  ]);
}

run().catch(console.error);
