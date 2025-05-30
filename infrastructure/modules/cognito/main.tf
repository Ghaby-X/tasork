resource "aws_cognito_user_pool" "this" {
  name = var.user_pool_name

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length = 8
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  schema {
    attribute_data_type = "String"
    mutable = true
    name = "tenantName"
    string_attribute_constraints {
      min_length = 0
      max_length = 100
    }
  }
  schema {
    attribute_data_type = "String"
    mutable = true
    name = "tenantId"
    string_attribute_constraints {
      min_length = 0
      max_length = 100
    }
  }
  schema {
    attribute_data_type = "String"
    mutable = true
    name = "role"
    string_attribute_constraints {
      min_length = 0
      max_length = 100
    }
  }

  schema {
    attribute_data_type = "String"
    mutable = true
    name = "username"
    string_attribute_constraints {
      min_length = 0
      max_length = 100
    }
  }

}

resource "aws_cognito_user_pool_client" "this" {
  name         = "${var.user_pool_name}-client"
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret                      = false
  id_token_validity = 1
  explicit_auth_flows                  = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"]
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes = [
    "email",
    "openid",
    "profile"
  ]
  supported_identity_providers = ["COGNITO"]
  callback_urls                = var.callback_urls
  
  token_validity_units {
    id_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "this" {
  domain       = "tasork"
  user_pool_id = aws_cognito_user_pool.this.id
}
