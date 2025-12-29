#!/bin/bash
# Quick demo script for Walrus Upload & Sign flow QA testing

echo "=== TruthSignal Walrus Upload & Sign Flow Demo ==="
echo ""

# Check if server is running
if ! curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "❌ Server is not running on port 4000"
    echo "   Start it with: cd server && npm start"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Step 1: Create a snapshot
echo "Step 1: Creating snapshot..."
SNAPSHOT_RESPONSE=$(curl -s -X POST http://localhost:4000/snapshot \
  -H "Content-Type: application/json" \
  -d '{"token":"sui","price":1.23,"timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}')

echo "$SNAPSHOT_RESPONSE" | python3 -m json.tool
echo ""

# Extract CID from response
CID=$(echo "$SNAPSHOT_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print('dev-' + d['digest'][:12])" 2>/dev/null)

if [ -z "$CID" ]; then
    echo "❌ Failed to extract CID from snapshot response"
    exit 1
fi

echo "✅ Snapshot created with CID: $CID"
echo ""

# Step 2: Prepare package
echo "Step 2: Preparing package..."
PREPARE_RESPONSE=$(curl -s -X POST http://localhost:4000/walrus/prepare-and-initiate \
  -H "Content-Type: application/json" \
  -d "{\"snapshotId\":\"$CID\",\"includeAudio\":false}")

echo "$PREPARE_RESPONSE" | python3 -m json.tool
echo ""

# Extract pkgId
PKG_ID=$(echo "$PREPARE_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('pkgId', ''))" 2>/dev/null)

if [ -z "$PKG_ID" ]; then
    echo "❌ Failed to extract pkgId from prepare response"
    exit 1
fi

echo "✅ Package prepared with pkgId: $PKG_ID"
echo ""

# Step 3: Create publish payload
echo "Step 3: Creating publish payload..."
PAYLOAD_RESPONSE=$(curl -s -X POST http://localhost:4000/walrus/create-publish-payload \
  -H "Content-Type: application/json" \
  -d "{\"pkgId\":\"$PKG_ID\"}")

echo "$PAYLOAD_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(json.dumps({'ok': d.get('ok'), 'pkgId': d.get('pkgId'), 'walrusPayload_keys': list(d.get('walrusPayload', {}).keys())}, indent=2))" 2>/dev/null
echo ""

echo "✅ Publish payload created"
echo ""

# Step 4: Check package status
echo "Step 4: Checking package status..."
if [ -f "server/data/walrus_packages/packages.json" ]; then
    cat server/data/walrus_packages/packages.json | python3 -m json.tool | grep -A 10 "\"$PKG_ID\"" || echo "Package record not found"
else
    echo "Package records file not found"
fi
echo ""

# Step 5: Check logs
echo "Step 5: Recent log entries..."
if [ -f "server/logs/walrus_upload.log" ]; then
    tail -5 server/logs/walrus_upload.log
else
    echo "Log file not created yet (will be created on first operation)"
fi
echo ""

echo "=== Demo Complete ==="
echo ""
echo "Next steps:"
echo "1. Open UI: http://localhost:8080"
echo "2. Click 'Upload to Walrus' on the snapshot"
echo "3. Choose 'Upload & Sign' (requires Sui wallet) or 'Manual Upload'"
echo "4. Follow the UI flow to complete upload"
echo ""
echo "To test submit-signed endpoint, you'll need:"
echo "- A signed payload from a Sui wallet"
echo "- Or mock the endpoint for testing"

