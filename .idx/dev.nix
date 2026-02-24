{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_20
    pkgs.yarn
  ];

  env = {
    ELECTRON_DISABLE_SANDBOX = "1";
  };

  idx = {
    extensions = [
      "google.gemini-cli-vscode-ide-companion"
    ];

    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
    };
  };
}