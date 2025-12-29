.PHONY: backend ui firmware help

help:
	@echo "TruthSignal MVP - Available commands:"
	@echo "  make backend  - Run the Express backend server"
	@echo "  make ui       - Run the UI server on port 8080"
	@echo "  make firmware - Instructions for PlatformIO firmware build"

backend:
	node server/index.js

ui:
	cd ui && python3 -m http.server 8080

firmware:
	@echo "Firmware build instructions:"
	@echo "1. Open PlatformIO IDE"
	@echo "2. Open the firmware folder"
	@echo "3. Build and upload to ATOM Echo device"

