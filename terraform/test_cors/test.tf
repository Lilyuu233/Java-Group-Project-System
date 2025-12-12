terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.26.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = "40086bc9-0489-470c-a527-869baa9c5c62"
}

resource "azurerm_resource_group" "test" {
  name     = "test-IP-resource-group"
  location = "West Europe"
}

resource "azurerm_storage_account" "test" {
  name                     = "testteam6storage"
  resource_group_name      = azurerm_resource_group.test.name
  location                 = azurerm_resource_group.test.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "POST", "PUT", "DELETE"]
      allowed_origins    = ["http://localhost:3000"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 86400
    }
  }
}
