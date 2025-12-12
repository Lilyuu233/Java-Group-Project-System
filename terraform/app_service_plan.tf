resource "azurerm_service_plan" "IP_service_plan" {
  name                = "ip-azure-functions-service-plan"
  location            = azurerm_resource_group.IP_resource_group.location
  resource_group_name = azurerm_resource_group.IP_resource_group.name
  os_type             = "Linux"
  sku_name            = "Y1"
}
