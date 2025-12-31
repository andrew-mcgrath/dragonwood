provider "aws" {
  region = "us-east-1"
}

data "aws_iam_account_alias" "current" {}

resource "aws_s3_bucket" "game" {
  bucket = "dragonwood-game-${data.aws_iam_account_alias.current.account_alias}"
}

resource "aws_s3_bucket_website_configuration" "game" {
  bucket = aws_s3_bucket.game.id

  index_document {
    suffix = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "game" {
  bucket = aws_s3_bucket.game.id

  block_public_acls       = false
  ignore_public_acls      = false
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "game" {
  bucket = aws_s3_bucket.game.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.game.arn}/*"
      },
    ]
  })
  
  # Ensure public access block is disabled before applying policy
  depends_on = [aws_s3_bucket_public_access_block.game]
}
