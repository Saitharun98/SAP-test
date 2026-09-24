const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const createApp = require('../app');

const app = createApp();

test('GET /api/products rejects unauthenticated requests', async () => {
  const response = await request(app).get('/api/products');

  assert.equal(response.status, 401);
  assert.equal(response.body.error, 'Authentication required');
});

test('GET /api/products returns only public fields for viewer role', async () => {
  const response = await request(app)
    .get('/api/products')
    .set('x-mock-user', 'viewer-user')
    .set('x-mock-roles', 'CatalogViewer');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.visibleFields, ['id', 'name', 'category', 'price']);
  assert.equal(response.body.role, 'CatalogViewer');
  assert.equal('supplierCost' in response.body.products[0], false);
  assert.equal('internalNotes' in response.body.products[0], false);
});

test('GET /api/products returns restricted fields for admin role', async () => {
  const response = await request(app)
    .get('/api/products')
    .set('x-mock-user', 'admin-user')
    .set('x-mock-roles', 'CatalogAdmin');

  assert.equal(response.status, 200);
  assert.equal(response.body.role, 'CatalogAdmin');
  assert.deepEqual(response.body.visibleFields, [
    'id',
    'name',
    'category',
    'price',
    'supplierCost',
    'internalNotes'
  ]);
  assert.equal(response.body.products[0].supplierCost, 620);
  assert.equal(response.body.products[0].internalNotes, 'Approved vendors only');
  assert.equal(response.body.products[1].supplierCost, 180);
  assert.equal(
    response.body.products[1].internalNotes,
    'Renewal managed by central procurement'
  );
});

test('GET /api/admin/roles blocks viewer access', async () => {
  const response = await request(app)
    .get('/api/admin/roles')
    .set('x-mock-user', 'viewer-user')
    .set('x-mock-roles', 'CatalogViewer');

  assert.equal(response.status, 403);
});

test('GET /api/products returns admin fields when both viewer and admin roles are present', async () => {
  const response = await request(app)
    .get('/api/products')
    .set('x-mock-user', 'power-user')
    .set('x-mock-roles', 'CatalogViewer,CatalogAdmin');

  assert.equal(response.status, 200);
  assert.equal(response.body.role, 'CatalogAdmin');
  assert.deepEqual(response.body.visibleFields, [
    'id',
    'name',
    'category',
    'price',
    'supplierCost',
    'internalNotes'
  ]);
  assert.equal(response.body.products[0].supplierCost, 620);
});

test('GET /api/admin/roles allows admin access', async () => {
  const response = await request(app)
    .get('/api/admin/roles')
    .set('x-mock-user', 'admin-user')
    .set('x-mock-roles', 'CatalogAdmin');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.restrictions.products.viewer, ['id', 'name', 'category', 'price']);
  assert.deepEqual(response.body.restrictions.products.admin, [
    'id',
    'name',
    'category',
    'price',
    'supplierCost',
    'internalNotes'
  ]);
});
