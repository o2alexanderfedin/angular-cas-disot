#!/bin/bash

# Enable CORS for IPFS API
echo "Configuring IPFS CORS settings..."

# Set CORS headers to allow requests from localhost
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:4200", "http://127.0.0.1:4200", "http://localhost:*", "http://127.0.0.1:*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET", "POST", "PUT", "DELETE", "OPTIONS"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Authorization", "Content-Type", "X-Requested-With"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials '["true"]'

echo "CORS configuration complete!"
echo ""
echo "Please restart IPFS Desktop or run 'ipfs daemon' for changes to take effect."
echo ""
echo "Current CORS settings:"
ipfs config show | grep -A 10 "HTTPHeaders"