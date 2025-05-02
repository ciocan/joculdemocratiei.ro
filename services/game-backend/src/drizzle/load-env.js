require("dotenv").config({ path: ".dev.vars" });

const d1Data = {
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
  DB_ID: process.env.DB_ID,
};

for (const [key, value] of Object.entries(d1Data)) {
  process.env[key] = value;
}
