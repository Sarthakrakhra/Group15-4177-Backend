const { Client } = require("pg");

const client = new Client({
  connectionString:
    "postgres://urejtrhpecxngo:d6535cb9ceca727cf6cf8ffeca82f37f2faf8ad84e29368719b146b037c721c8@ec2-3-231-16-122.compute-1.amazonaws.com:5432/d1eens1hiuc999",
  ssl: {
    rejectUnauthorized: false,
  },
});
module.exports = client;
