resource "azurerm_storage_account" "IP_storage_account" {
  name                     = "team6ipstorageaccount"
  resource_group_name      = azurerm_resource_group.IP_resource_group.name
  location                 = azurerm_resource_group.IP_resource_group.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
