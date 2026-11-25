"""Read-only verification of the deployed AWS controls. Prints facts, never secret values."""
import boto3, socket, json, sys, datetime
R = "us-east-1"; N = "carevia"
b = lambda s: boto3.client(s, region_name=R)
def p(k, v): print(f"{k}: {v}")

rds = b("rds").describe_db_instances(DBInstanceIdentifier=f"{N}-db")["DBInstances"][0]
p("RDS engine/class/AZ-mode", f"{rds['Engine']} {rds['EngineVersion']} / {rds['DBInstanceClass']} / MultiAZ={rds['MultiAZ']}")
p("RDS publicly_accessible", rds["PubliclyAccessible"]); p("RDS storage_encrypted", rds["StorageEncrypted"])
p("RDS backup_retention_days", rds["BackupRetentionPeriod"]); p("RDS deletion_protection", rds["DeletionProtection"])
p("RDS log exports", rds.get("EnabledCloudwatchLogsExports"))
pg = b("rds").describe_db_parameters(DBParameterGroupName=f"{N}-pg16", Source="user")["Parameters"]
p("RDS TLS enforced (rds.force_ssl)", [x["ParameterValue"] for x in pg if x["ParameterName"] == "rds.force_ssl"])
ip = socket.gethostbyname(rds["Endpoint"]["Address"]); p("RDS endpoint resolves to", ip + " (private RFC1918)" if ip.startswith("10.") else ip)
s = socket.socket(); s.settimeout(6)
try: s.connect((rds["Endpoint"]["Address"], 5432)); p("TCP 5432 from the internet", "REACHABLE (BAD)")
except Exception as e: p("TCP 5432 from the internet", f"unreachable ({type(e).__name__}) - GOOD")

s3 = b("s3"); bk = f"{N}-records-211125469458"
p("S3 encryption", s3.get_bucket_encryption(Bucket=bk)["ServerSideEncryptionConfiguration"]["Rules"][0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"])
p("S3 versioning", s3.get_bucket_versioning(Bucket=bk).get("Status"))
p("S3 public access block", s3.get_public_access_block(Bucket=bk)["PublicAccessBlockConfiguration"])
p("S3 TLS-only policy", "aws:SecureTransport" in s3.get_bucket_policy(Bucket=bk)["Policy"])
p("S3 access logging", bool(s3.get_bucket_logging(Bucket=bk).get("LoggingEnabled")))
objs = s3.list_objects_v2(Bucket=bk, Prefix="patients/").get("Contents", [])
p("S3 objects in vault", len(objs))
if objs:
    o = s3.head_object(Bucket=bk, Key=objs[-1]["Key"]); p("object SSE / KMS key", f"{o.get('ServerSideEncryption')} / {o.get('SSEKMSKeyId','')[-36:]}")
    p("object scan tags (Lambda document_scanner)", {t['Key']: t['Value'] for t in s3.get_object_tagging(Bucket=bk, Key=objs[-1]["Key"])["TagSet"]})

k = b("kms"); a = k.describe_key(KeyId=f"alias/{N}")["KeyMetadata"]
p("KMS CMK state / rotation", f"{a['KeyState']} / {k.get_key_rotation_status(KeyId=a['KeyId'])['KeyRotationEnabled']}")
p("Secrets (names only)", [x["Name"] for x in b("secretsmanager").list_secrets()["SecretList"]])
ec = b("ecr")
for r in ["backend", "frontend"]:
    im = ec.describe_images(repositoryName=f"{N}-{r}")["imageDetails"][0]
    p(f"ECR {r}", f"tags={im.get('imageTags')} scan={im.get('imageScanStatus',{}).get('status')} findings={im.get('imageScanFindingsSummary',{}).get('findingSeverityCounts')}")
p("ECR immutable tags", ec.describe_repositories(repositoryNames=[f"{N}-backend"])["repositories"][0]["imageTagMutability"])
ct = b("cloudtrail"); t = ct.describe_trails()["trailList"][0]; st = ct.get_trail_status(Name=t["Name"])
p("CloudTrail", f"{t['Name']} multi-region={t['IsMultiRegionTrail']} validation={t['LogFileValidationEnabled']} logging={st['IsLogging']}")
al = b("cloudwatch").describe_alarms(AlarmNamePrefix=N)["MetricAlarms"]
p("CloudWatch alarms", {x["AlarmName"]: x["StateValue"] for x in al})
q = b("sqs"); u = q.get_queue_url(QueueName=f"{N}-notifications")["QueueUrl"]
p("SQS attrs", {k: v for k, v in q.get_queue_attributes(QueueUrl=u, AttributeNames=["All"])["Attributes"].items() if k in ("ApproximateNumberOfMessages", "SqsManagedSseEnabled", "RedrivePolicy")})
lg = b("logs")
for fn in ["appointment-notifier", "document-scanner"]:
    try: s = lg.describe_log_streams(logGroupName=f"/aws/lambda/{N}-{fn}")["logStreams"]; p(f"Lambda {fn} invoked", f"{len(s)} log stream(s)")
    except Exception as e: p(f"Lambda {fn}", e)
ev = lg.describe_log_streams(logGroupName=f"/{N}/app", orderBy="LastEventTime", descending=True, limit=3)["logStreams"]
p("App container logs in CloudWatch (/carevia/app)", [x["logStreamName"] for x in ev])
ec2 = b("ec2").describe_instances(Filters=[{"Name": "tag:Name", "Values": [f"{N}-web"]}])["Reservations"][0]["Instances"][0]
p("EC2", f"{ec2['InstanceType']} {ec2['State']['Name']} IMDSv2={ec2['MetadataOptions']['HttpTokens']} profile={ec2['IamInstanceProfile']['Arn'].split('/')[-1]}")
sg = b("ec2").describe_security_groups(GroupIds=[g["GroupId"] for g in ec2["SecurityGroups"]])["SecurityGroups"][0]
p("Web SG inbound ports", sorted({x["FromPort"] for x in sg["IpPermissions"]}))
dbsg = b("ec2").describe_security_groups(GroupIds=[g["GroupId"] for g in rds["VpcSecurityGroups"] and [{"GroupId": v["VpcSecurityGroupId"]} for v in rds["VpcSecurityGroups"]]])["SecurityGroups"][0]
p("DB SG inbound", [(x["FromPort"], [g["GroupId"] == sg["GroupId"] for g in x["UserIdGroupPairs"]], x["IpRanges"]) for x in dbsg["IpPermissions"]])
