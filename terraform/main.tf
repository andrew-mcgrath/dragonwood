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

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.game.website_endpoint
    origin_id   = aws_s3_bucket.game.id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = aws_s3_bucket.game.id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

