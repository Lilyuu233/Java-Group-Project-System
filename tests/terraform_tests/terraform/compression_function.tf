resource "azurerm_function_app" "IP_compression_function" {
  name                       = "ip-team6-compression-function"
  location                   = azurerm_resource_group.IP_resource_group.location
  resource_group_name        = azurerm_resource_group.IP_resource_group.name
  app_service_plan_id        = azurerm_app_service_plan.IP_service_plan.id
  storage_account_name       = azurerm_storage_account.IP_storage_account.name
  storage_account_access_key = azurerm_storage_account.IP_storage_account.primary_access_key
}
