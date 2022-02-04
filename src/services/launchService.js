import { deleteVideoFolder } from "../utils";

export default class CustomLauncherService {
  onComplete(exitCode, config, capabilities) {
    deleteVideoFolder();
  }
}