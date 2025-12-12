# Terraform docs

## How to Start with Terraform

1. terraform init after providers.tf and main.tf (but empty)

```
Initializing the backend...

Initializing provider plugins...
- Finding hashicorp/azurerm versions matching "~> 3.0"...
- Installing hashicorp/azurerm v3.117.0...
- Installed hashicorp/azurerm v3.117.0 (signed by HashiCorp)

Terraform has created a lock file .terraform.lock.hcl to record the provider
selections it made above. Include this file in your version control repository
so that Terraform can guarantee to make the same selections by default when
you run "terraform init" in the future.

Terraform has been successfully initialized!

You may now begin working with Terraform. Try running "terraform plan" to see
any changes that are required for your infrastructure. All Terraform commands
should now work.

If you ever set or change modules or backend configuration for Terraform,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.
```

providers.tf should be

```
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  required_version = ">= 1.3.0"
}

provider "azurerm" {
  features {}
}
```

2. Now create Terraform State
  - An example file structure:
    ```
    .
    ├── api_function.tf
    ├── app_service_plan.tf
    ├── compression_function.tf
    ├── input_blob_container.tf
    ├── main.tf
    ├── output_blob_container.tf
    ├── provider.tf
    ├── resource_group.tf
    ├── storage_account.tf
    ├── storage_event_queue.tf
    ├── terraform_backend
    │   ├── state_container.tf
    │   └── terraform.tfstate
    ├── terraform.tfstate
    ├── terraform.tfstate.backup
    └── variables.tf
    ```
    - this `terraform_backend` directory is a separate Terraform project and requires it's own set up
    - i.e. you need to do a `terraform init` and `terraform apply`
    - the state of this project can be stored on your own computer (that's what we will be doing for this project)
  - state_container.tf should be
  ```
    terraform {
      required_providers {
        azurerm = {
          source  = "hashicorp/azurerm"
          version = "~>3.0"
        }
      }
    }
    
    provider "azurerm" {
      features {}
    }
    
    resource "random_string" "resource_code" {
      length  = 5
      special = false
      upper   = false
    }
    
    resource "azurerm_resource_group" "tfstate" {
      name     = "tfstate"
      location = "West Europe"
    }
    
    resource "azurerm_storage_account" "tfstate" {
      name                     = "tfstate${random_string.resource_code.result}"
      resource_group_name      = azurerm_resource_group.tfstate.name
      location                 = azurerm_resource_group.tfstate.location
      account_tier             = "Standard"
      account_replication_type = "LRS"
      allow_nested_items_to_be_public = false
    
      tags = {
        environment = "staging"
      }
    }
    
    resource "azurerm_storage_container" "IP-team6-tfstate" {
      name                  = "tfstate"
      storage_account_name  =     azurerm_storage_account.tfstate.name
      container_access_type = "private"
    }
```
3. Link terraform state container to project
  - add the `backend` block to the terraform block in the provider.tf
  ```
  terraform {
    required_providers {
      azurerm = {
        source  = "hashicorp/azurerm"
        version = "~> 3.0"
      }
    }
    backend "azurerm" {
        resource_group_name = "tfstate"
        storage_account_name = "tfstatejmlbw"
        container_name = "tfstate"
        key = "terraform.tfstate"
    }
  
    required_version = ">= 1.3.0"
  }
  
  provider "azurerm" {
    features {}
  }
  ```
  - refs
    - https://learn.microsoft.com/en-us/azure/developer/terraform/store-state-in-azure-storage?tabs=azure-cli

## What are Resource Groups?
- essentially they are a wrapper that you can put services and resources into
- there is a single resource group for the intelligent plant azure project called `IP-resource-group-wrapper` and is defined below
  ```
  resource "azurerm_resource_group" "IP_resource_group" {
    name     = "IP-resource-group-wrapper"
    location = "West Europe"
  }
  ```
- refs: 
  - https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/manage-resource-groups-portal
  - https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/resource_group

## What are Storage Accounts?
- Another wrapper in azure that contains Azure Storage Data object just as blobs, files, queues, tables etc.
- how to set up? see code below
```
resource "azurerm_storage_account" "IP_storage_account" {
  name                     = "team6ipstorageaccount"
  resource_group_name      = azurerm_resource_group.IP_resource_group.name
  location                 = azurerm_resource_group.IP_resource_group.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
```
  - notes: the name has to be all lowercase and no spaces or hyphens etc allowed
- refs:
  - https://learn.microsoft.com/en-us/azure/storage/common/storage-account-overview
