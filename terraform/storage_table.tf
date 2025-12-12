resource "azurerm_storage_table" "ip_configurations_table" {
  name                 = "ipconfigurations"
  storage_account_name = azurerm_storage_account.IP_storage_account.name
}
