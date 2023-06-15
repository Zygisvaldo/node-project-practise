const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' });

// connecting config.env file to the node
// running app only after the config ir required
// console.log(app.get('env')); // development
// console.log(process.env)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
