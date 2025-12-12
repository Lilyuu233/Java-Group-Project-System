resource "azurerm_storage_account" "IP_storage_account" {
  name                     = "team6ipstorageaccount"
  resource_group_name      = azurerm_resource_group.IP_resource_group.name
  location                 = azurerm_resource_group.IP_resource_group.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "POST", "PUT", "DELETE"]
      allowed_origins    = ["http://localhost:3000", "https://delightful-dune-0bf943403-preview.westeurope.6.azurestaticapps.net"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 86400
    }
  }
}
