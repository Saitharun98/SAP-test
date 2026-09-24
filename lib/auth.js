const xsenv = require('@sap/xsenv');
const {
  XsuaaService,
  createSecurityContext,
  errors: { ValidationError }
} = require('@sap/xssec');

const VIEWER_SCOPE = 'CatalogViewer';
const ADMIN_SCOPE = 'CatalogAdmin';
const KNOWN_SCOPES = [VIEWER_SCOPE, ADMIN_SCOPE];

let xsuaaService;

function isMockAuthEnabled() {
  return process.env.ALLOW_MOCK_AUTH === 'true';
}

try {
  xsuaaService = new XsuaaService(xsenv.serviceCredentials({ label: 'xsuaa' }));
} catch {
  xsuaaService = null;
}

function buildMockUser(req) {
  const roles = (req.header('x-mock-roles') || '')
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);

  if (!roles.length) {
    return null;
  }

  return {
    user: {
      id: req.header('x-mock-user') || 'local-user',
      roles
    },
    authInfo: {
      checkLocalScope(scope) {
        return roles.includes(scope);
      }
    }
  };
}

async function authenticate(req, res, next) {
  if (isMockAuthEnabled()) {
    const mockUser = buildMockUser(req);

    if (!mockUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    Object.assign(req, mockUser);
    return next();
  }

  if (xsuaaService) {
    try {
      const authInfo = await createSecurityContext(xsuaaService, { req });
      req.authInfo = authInfo;
      req.user = {
        id: authInfo.token?.payload?.sub || authInfo.token?.payload?.user_name || 'btp-user',
        roles: KNOWN_SCOPES.filter((scope) => authInfo.checkLocalScope(scope))
      };
      return next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      return next(error);
    }
  }

  return res.status(401).json({ error: 'Authentication required' });
}

function hasScope(req, scope) {
  if (req.authInfo?.checkLocalScope) {
    return req.authInfo.checkLocalScope(scope);
  }

  return Array.isArray(req.user?.roles) && req.user.roles.includes(scope);
}

function requireAnyScope(scopes) {
  return (req, res, next) => {
    if (scopes.some((scope) => hasScope(req, scope))) {
      return next();
    }

    return res.status(403).json({
      error: `Missing required role: ${scopes.join(' or ')}`
    });
  };
}

module.exports = {
  ADMIN_SCOPE,
  VIEWER_SCOPE,
  authenticate,
  hasScope,
  requireAnyScope,
  validateAuthConfiguration() {
    if (!isMockAuthEnabled() && !xsuaaService) {
      throw new Error(
        'XSUAA service binding is required when ALLOW_MOCK_AUTH is not enabled.'
      );
    }
  }
};
