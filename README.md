# SAP BTP Sample Catalog App

This repository contains a minimal Node.js sample application that can be deployed to SAP BTP Cloud Foundry with XSUAA-backed role enforcement.

## What is included

- `manifest.yml` for Cloud Foundry deployment
- `xs-security.json` with SAP BTP scopes and role templates
- `/api/products` protected API with field-level restrictions
- `/api/admin/roles` admin-only API that documents the active restrictions

## Security model

Two roles are defined in `xs-security.json`:

- `CatalogViewer` - can read product data, but only the public fields `id`, `name`, `category`, and `price`
- `CatalogAdmin` - inherits viewer access and can also read restricted fields `supplierCost` and `internalNotes`

## Local run

```bash
npm install
ALLOW_MOCK_AUTH=true npm start
```

For local development only, when no XSUAA service is bound and `ALLOW_MOCK_AUTH=true` is set, the app accepts mock headers:

```bash
curl http://localhost:8080/api/products \
  -H "x-mock-user: viewer-user" \
  -H "x-mock-roles: CatalogViewer"
```

Use `CatalogAdmin` to view restricted fields:

```bash
curl http://localhost:8080/api/products \
  -H "x-mock-user: admin-user" \
  -H "x-mock-roles: CatalogAdmin"
```

## Tests

```bash
npm test
```

## Deploy to SAP BTP Cloud Foundry

1. Log in to your Cloud Foundry org and space.
2. Create the XSUAA instance:

   ```bash
   cf create-service xsuaa application sap-test-auth -c xs-security.json
   ```

3. Push the application:

   ```bash
   cf push
   ```

4. In SAP BTP, create role collections for `CatalogViewer` and `CatalogAdmin`, assign them to users, and access the protected routes through the deployed app URL.
