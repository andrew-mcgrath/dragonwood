output "bucket_name" {
  value = aws_s3_bucket.game.id
}

output "website_url" {
  value = aws_s3_bucket_website_configuration.game.website_endpoint
}
