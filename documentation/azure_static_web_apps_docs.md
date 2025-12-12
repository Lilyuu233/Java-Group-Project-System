# How Does the UI connect to Azure and how is it hosted?

## Terraform Code

```terraform
resource "azurerm_static_web_app" "ip_react_static_app" {
  name                = "ip-team6-static-webapp"
  resource_group_name = azurerm_resource_group.IP_resource_group.name
  location            = azurerm_resource_group.IP_resource_group.location
  sku_tier            = "Free"
  sku_size            = "Free"

  tags = {
    "environment" = "dev"
  }
}

output "static_app_url" {
  value       = "https://${azurerm_static_web_app.ip_react_static_app.default_host_name}"
  description = "The URL of the deployed React static web app"
}
```

when you do `terraform apply` you will get the token that you can then use when linking it with the `az` command line utility


## How to Build the App

1. Install Dependencies

```npm install```

2. Build the App

```npm run build```

  - this creates a `build/` folder with static files such as `index.html` and a `static/`
  - if command not found error then `react-scripts` is not installed
  - if `build/` is empty then check `src/` for valid React code

3. Verify Build Output

```ls src/build```

  - should list a `index.html` and a bunch of JS and CSS files
  - if not then rerun `npm run build`

## How to Deploy to Azure Static Web Apps

1. install Static Web Apps cli tool (globally)

  ```npm install -g @azure/static-web-apps-cli```
  
2. get deployment token

  ```az staticwebapp secrets list --resource-group IP-resource-group-wrapper --name ip-team6-static-webapp --query "properties.apiKey" --output tsv```
  
  - you'll get a token, you should copy it and use for later steps
  
3. Deploy!

  - ensure you are at the root of the React project
  ```
  swa deploy --app-name ip-team6-static-webapp --resource-group IP-resource-group-wrapper --deployment-token <your-token-here> --app-location ./build --no-api
  ```

  - success should look like this
  
  ```
  Deploying front-end files from folder:
  /home/frazer/Documents/nottingham/COMP2002/team6_project/src/build
Deploying to environment: preview
✔ Project deployed to https://calm-bush-09d87f503-preview.westeurope.4.azurestaticapps.net 🚀
  ```
  
  - the `-preview` is because it is a manual deployment
