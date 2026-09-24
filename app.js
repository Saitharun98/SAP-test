const express = require('express');
const {
  ADMIN_SCOPE,
  VIEWER_SCOPE,
  authenticate,
  hasScope,
  requireAnyScope
} = require('./lib/auth');
const {
  PUBLIC_FIELDS,
  RESTRICTED_FIELDS,
  products,
  restrictProductFields
} = require('./lib/catalog');

function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/', (req, res) => {
    res.json({
      name: 'SAP BTP sample catalog',
      endpoints: ['/api/products', '/api/admin/roles', '/health']
    });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get(
    '/api/products',
    authenticate,
    requireAnyScope([VIEWER_SCOPE, ADMIN_SCOPE]),
    (req, res) => {
      const includeRestrictedFields = hasScope(req, ADMIN_SCOPE);

      res.json({
        role: includeRestrictedFields ? ADMIN_SCOPE : VIEWER_SCOPE,
        visibleFields: includeRestrictedFields
          ? [...PUBLIC_FIELDS, ...RESTRICTED_FIELDS]
          : PUBLIC_FIELDS,
        products: products.map((product) =>
          restrictProductFields(product, includeRestrictedFields)
        )
      });
    }
  );

  app.get(
    '/api/admin/roles',
    authenticate,
    requireAnyScope([ADMIN_SCOPE]),
    (req, res) => {
      res.json({
        role: ADMIN_SCOPE,
        restrictions: {
          products: {
            viewer: PUBLIC_FIELDS,
            admin: [...PUBLIC_FIELDS, ...RESTRICTED_FIELDS]
          }
        }
      });
    }
  );

  return app;
}

module.exports = createApp;
