# Walrus Package: truthsignal-walrus-adapter

Steps to publish to Walrus mainnet:

1. Update `manifest.json` fields (name, version, mainnet_ready=true).

2. Build package archive: `zip -r walrus-package.zip *`

3. Use your Walrus wallet (or CLI) to sign and upload the package to mainnet.

   - If you have a walrus wallet CLI: `walrus deploy walrus-package.zip --network mainnet`

   - If using a browser wallet, upload via their web UI; capture the returned package id.

4. Put the returned package id in your submission.



**Important:** I did not automatically upload or sign anything. You must connect your wallet and run the final deploy command yourself.

