#!/usr/bin/env bash

echo "1) Zip the package:"

zip -r walrus-package.zip .

echo "2) You must sign/upload from your Walrus wallet. Example CLI (replace with actual Walrus CLI if available):"

echo "   walrus deploy walrus-package.zip --network mainnet"

echo ""

echo "If you need, paste your wallet address and I will prepare the curl command for the wallet endpoint (but wallet signing must be done by you)."

