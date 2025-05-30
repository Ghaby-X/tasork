output "user_pool_id" {
  value = module.cognito.user_pool_id
}

output "user_pool_client_id" {
  value = module.cognito.user_pool_client_id
}

output "user_pool_domain" {
  value = module.cognito.user_pool_domain
}

output "table_name" {
  value = module.dynamodb.table_name
}
