import { uploadDirectory, deleteProjectPrefix } from "./provider/google.js";

export async function upload({ name }) {
  console.log(`⬆️ Uploading ${name}...`);

  await deleteProjectPrefix(name);
  await uploadDirectory(name);

  console.log(`✅ Uploaded ${name}`);
}
