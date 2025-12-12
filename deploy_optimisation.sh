#!/bin/bash

# Configuration
FUNCTION_APP_NAME="ip-team6-optimisation-function"
RESOURCE_GROUP="IP-resource-group-wrapper"
FUNCTION_DIR="optimisation_function"
PYTHON_VERSION="3.11"

# Colours for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Colour

# Function to check if a command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed. Please install it first.${NC}"
        exit 1
    fi
}

# Step 1: Check prerequisites
echo -e "${GREEN}Checking prerequisites...${NC}"
check_command "python3"
check_command "func"
check_command "az"
check_command "pip"

# Step 2: Ensure Azure CLI is logged in
echo -e "${GREEN}Checking Azure CLI login...${NC}"
if ! az account show &> /dev/null; then
    echo "Not logged in to Azure CLI. Logging in now..."
    az login || { echo -e "${RED}Azure login failed.${NC}"; exit 1; }
fi

# Step 3: Verify function directory
echo -e "${GREEN}Navigating to function directory: $FUNCTION_DIR...${NC}"
if [ ! -d "$FUNCTION_DIR" ]; then
    echo -e "${RED}Directory $FUNCTION_DIR not found.${NC}"
    exit 1
fi
cd "$FUNCTION_DIR" || { echo -e "${RED}Failed to navigate to $FUNCTION_DIR.${NC}"; exit 1; }

# Step 4: Verify function structure
echo -e "${GREEN}Checking for optimise function directory...${NC}"
if [ ! -d "optimise" ] || [ ! -f "optimise/__init__.py" ] || [ ! -f "optimise/function.json" ] || [ ! -f "optimise/grid_search.py" ]; then
    echo -e "${RED}Optimise function directory or required files missing (optimise/__init__.py, optimise/function.json, optimise/grid_search.py).${NC}"
    exit 1
fi
if [ ! -f "requirements.txt" ] || [ ! -f "host.json" ] || [ ! -f "local.settings.json" ]; then
    echo -e "${RED}Required files missing (requirements.txt, host.json, local.settings.json).${NC}"
    exit 1
fi

# Step 5: Install dependencies
echo -e "${GREEN}Installing Python dependencies...${NC}"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt || { echo -e "${RED}Failed to install dependencies.${NC}"; exit 1; }

# Step 6: Deploy to Azure
echo -e "${GREEN}Deploying to Azure Function App: $FUNCTION_APP_NAME...${NC}"
func azure functionapp publish "$FUNCTION_APP_NAME" --python --verbose > deploy.log 2>&1 || {
    echo -e "${RED}Deployment failed. Check deploy.log for details.${NC}"
    cat deploy.log
    exit 1
}
echo -e "${GREEN}Deployment log saved to deploy.log${NC}"

# Step 7: Get function key
echo -e "${GREEN}Retrieving function key for optimise...${NC}"
FUNCTION_KEY=$(az functionapp function keys list \
  --resource-group "$RESOURCE_GROUP" \
  --name "$FUNCTION_APP_NAME" \
  --function-name "optimise" \
  --query "default" -o tsv) || {
    echo -e "${RED}Failed to retrieve function key. Ensure the optimise function is deployed correctly.${NC}"
    az functionapp function list \
      --resource-group "$RESOURCE_GROUP" \
      --name "$FUNCTION_APP_NAME" \
      --query "[].name" -o tsv
    exit 1
}
echo "Function Key: $FUNCTION_KEY"

# Step 8: Test the function
echo -e "${GREEN}Testing the deployed function...${NC}"
TEST_URL="https://$FUNCTION_APP_NAME.azurewebsites.net/api/optimise?code=$FUNCTION_KEY"
TEST_PAYLOAD='{"storage_url":"https://team6ipstorageaccount.blob.core.windows.net/ip-input-container/test.csv"}'
curl -s -X POST -H "Content-Type: application/json" -d "$TEST_PAYLOAD" "$TEST_URL" > test_response.json
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Test succeeded! Response saved to test_response.json${NC}"
    cat test_response.json
else
    echo -e "${RED}Test failed. Check test_response.json for details.${NC}"
    cat test_response.json
    exit 1
fi

echo -e "${GREEN}Deployment and testing complete!${NC}"
