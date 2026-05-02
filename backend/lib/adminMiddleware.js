// Admin middleware
// local: check x-admin-password header
// lambda: verify Cognito JWT
const { CognitoJwtVerifier } = require('aws-jwt-verify');

const ADMIN_PASS = 'localadmin123';
const RUNTIME = process.env.RUNTIME;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

let verifier;
if (RUNTIME === 'lambda' && USER_POOL_ID && CLIENT_ID) {
  verifier = CognitoJwtVerifier.create({
    userPoolId: USER_POOL_ID,
    tokenUse: 'id', // or 'access' depending on how frontend is set up
    clientId: CLIENT_ID,
  });
}

async function adminMiddleware(req, res, next) {
  if (RUNTIME === 'lambda') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    try {
      const payload = await verifier.verify(token);
      req.user = payload;
      return next();
    } catch (err) {
      console.error('Cognito Auth Failed:', err);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = adminMiddleware;
