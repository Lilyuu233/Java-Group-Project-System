resource "azurerm_linux_function_app" "IP_api_function" {
  name                       = "ip-team6-api-function"
  location                   = azurerm_resource_group.IP_resource_group.location
  resource_group_name        = azurerm_resource_group.IP_resource_group.name
  service_plan_id            = azurerm_service_plan.IP_service_plan.id
  storage_account_name       = azurerm_storage_account.IP_storage_account.name
  storage_account_access_key = azurerm_storage_account.IP_storage_account.primary_access_key

  app_settings = {
    "FUNCTIONS_EXTENSION_VERSION" = "~4"
    "FUNCTIONS_WORKER_RUNTIME"    = "python"
    "WEBSITE_RUN_FROM_PACKAGE"    = "1"
  }

  site_config {
    application_stack {
      python_version = "3.11"
    }
  }
}
