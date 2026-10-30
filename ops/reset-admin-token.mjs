import fs from "node:fs";

const target = "/srv/maxwell-homepage/shared/.env.local";
const original = fs.readFileSync(target, "utf8");
if (!/^ADMIN_TOKEN\s*=/m.test(original)) {
  throw new Error("ADMIN_TOKEN is missing; configuration was not changed");
}
// Preserve the inode, owner and permissions of the existing private config.
fs.writeFileSync(target, original.replace(/^ADMIN_TOKEN\s*=.*$/gm, "ADMIN_TOKEN="));
console.log("Admin token expired");
