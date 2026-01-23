import { uploadDirectory, deleteProjectPrefix } from "./provider/google.js";

export async function upload({ name }) {
  await deleteProjectPrefix(name);
  await uploadDirectory(name);
}
