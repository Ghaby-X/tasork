resource "aws_dynamodb_table" "tasork" {
  name           = "tasork"
  billing_mode   = "PAY_PER_REQUEST"  # No need to define read/write capacity
  hash_key       = "PartitionKey"
  range_key      = "SortKey"

  attribute {
    name = "PartitionKey"
    type = "S"
  }

  attribute {
    name = "SortKey"
    type = "S"
  }

  tags = {
    Name        = "tasork"
  }
}
