resource "azurerm_storage_container" "IP_output_container" {
  name                  = "ip-output-container"
  storage_account_name  = azurerm_storage_account.IP_storage_account.name
  container_access_type = "private"
}
