const createApp = require('./app');

const app = createApp();
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`SAP BTP sample app listening on port ${port}`);
});
