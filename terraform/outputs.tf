output "bucket_name" {
  value = aws_s3_bucket.game.id
}

output "website_url" {
  value = aws_s3_bucket_website_configuration.game.website_endpoint
}

output "cloudfront_url" {
  value = aws_cloudfront_distribution.s3_distribution.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.s3_distribution.id
}
