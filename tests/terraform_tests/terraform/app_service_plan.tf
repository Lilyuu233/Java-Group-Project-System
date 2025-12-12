resource "azurerm_app_service_plan" "IP_service_plan" {
  name                = "ip-azure-functions-service-plan"
  location            = azurerm_resource_group.IP_resource_group.location
  resource_group_name = azurerm_resource_group.IP_resource_group.name

  sku {
    tier = "Standard"
    size = "S1"
  }
}
