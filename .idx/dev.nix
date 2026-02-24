{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_22
    pkgs.yarn
  ];

  env = {
    ELECTRON_DISABLE_SANDBOX = "1";
  };

  idx = {
    extensions = [
    ];

    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
    };
  };
}