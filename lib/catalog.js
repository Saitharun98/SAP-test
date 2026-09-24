const PUBLIC_FIELDS = ['id', 'name', 'category', 'price'];
const RESTRICTED_FIELDS = ['supplierCost', 'internalNotes'];

const products = [
  {
    id: 'HT-1000',
    name: 'Warehouse Scanner',
    category: 'Hardware',
    price: 899,
    supplierCost: 620,
    internalNotes: 'Approved vendors only'
  },
  {
    id: 'SW-2000',
    name: 'Inventory Analytics',
    category: 'Software',
    price: 299,
    supplierCost: 180,
    internalNotes: 'Renewal managed by central procurement'
  }
];

function restrictProductFields(product, includeRestrictedFields) {
  const fields = includeRestrictedFields
    ? [...PUBLIC_FIELDS, ...RESTRICTED_FIELDS]
    : PUBLIC_FIELDS;

  return Object.fromEntries(fields.map((field) => [field, product[field]]));
}

module.exports = {
  PUBLIC_FIELDS,
  RESTRICTED_FIELDS,
  products,
  restrictProductFields
};
