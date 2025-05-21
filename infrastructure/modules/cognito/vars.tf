variable "user_pool_name" {
  type        = string
  description = "name for user pool"
}

variable "callback_urls" {
  description = "Allowed callback URLs for the user pool client"
  type        = list(string)
}

