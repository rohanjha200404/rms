#!/bin/sh
awslocal s3 mb s3://gs-insurance-documents
awslocal sqs create-queue --queue-name gs-insurance-renewal-jobs
awslocal sns create-topic --name gs-insurance-alerts
