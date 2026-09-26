const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

async function deployFirestoreRules() {
  try {
    const keyPath = path.resolve(__dirname, '../../service-account.json');
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Service account key not found at ${keyPath}`);
    }

    const rulesPath = path.resolve(__dirname, '../../../firestore.rules');
    if (!fs.existsSync(rulesPath)) {
      throw new Error(`firestore.rules not found at ${rulesPath}`);
    }

    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const projectId = serviceAccount.project_id;

    console.log(`Authenticating for project: ${projectId}...`);
    const auth = new GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase']
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    console.log('Creating ruleset...');
    const createRes = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: {
          files: [
            {
              name: 'firestore.rules',
              content: rulesContent
            }
          ]
        }
      })
    });

    const createData = await createRes.json();
    if (!createRes.ok) {
      console.error('Failed to create ruleset:', createData);
      return;
    }

    console.log('Ruleset created successfully:', createData.name);

    console.log('Releasing ruleset to cloud.firestore...');
    const releaseRes = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        release: {
          name: `projects/${projectId}/releases/cloud.firestore`,
          rulesetName: createData.name
        }
      })
    });

    const releaseData = await releaseRes.json();
    if (!releaseRes.ok) {
      // If release doesn't exist yet, try creating it
      console.log('PATCH release returned status:', releaseRes.status, 'Trying POST release...');
      const postReleaseRes = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `projects/${projectId}/releases/cloud.firestore`,
          rulesetName: createData.name
        })
      });
      const postData = await postReleaseRes.json();
      if (!postReleaseRes.ok) {
        console.error('Failed to release ruleset:', postData);
        return;
      }
      console.log('Release created successfully:', postData.name);
    } else {
      console.log('Release updated successfully:', releaseData.name);
    }

    console.log('\n SUCCESS: Live Firestore Security Rules deployed successfully!');
  } catch (error) {
    console.error('Error deploying rules:', error);
  }
}

deployFirestoreRules();
