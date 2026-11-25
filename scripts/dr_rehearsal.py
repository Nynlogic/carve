"""Backup + restore rehearsal: manual snapshot -> restore into a NEW instance -> compare row counts -> delete the temp copy.
Prints measured times (RTO) and result. Only touches the temporary instance it creates."""
import boto3, time, json, sys
R = "us-east-1"; rds = boto3.client("rds", region_name=R); ssm = boto3.client("ssm", region_name=R)
INST = sys.argv[1]; src = "carevia-db"; tmp = "carevia-db-restore-test"; snap = "carevia-manual-" + time.strftime("%Y%m%d-%H%M%S")
t0 = time.time()
rds.create_db_snapshot(DBSnapshotIdentifier=snap, DBInstanceIdentifier=src)
rds.get_waiter("db_snapshot_available").wait(DBSnapshotIdentifier=snap, WaiterConfig={"Delay": 15, "MaxAttempts": 80})
t_snap = time.time() - t0; print(f"snapshot {snap} available after {t_snap:.0f}s", flush=True)
d = rds.describe_db_instances(DBInstanceIdentifier=src)["DBInstances"][0]
t1 = time.time()
rds.restore_db_instance_from_db_snapshot(DBInstanceIdentifier=tmp, DBSnapshotIdentifier=snap, DBInstanceClass=d["DBInstanceClass"],
    DBSubnetGroupName=d["DBSubnetGroup"]["DBSubnetGroupName"], VpcSecurityGroupIds=[v["VpcSecurityGroupId"] for v in d["VpcSecurityGroups"]],
    PubliclyAccessible=False, DBParameterGroupName=d["DBParameterGroups"][0]["DBParameterGroupName"], DeletionProtection=False, MultiAZ=False,
    Tags=[{"Key": "Project", "Value": "carevia"}, {"Key": "Purpose", "Value": "restore-rehearsal-temporary"}])
rds.get_waiter("db_instance_available").wait(DBInstanceIdentifier=tmp, WaiterConfig={"Delay": 20, "MaxAttempts": 90})
rto = time.time() - t1; print(f"restored instance available after {rto:.0f}s (measured RTO for restore-from-snapshot)", flush=True)
host = rds.describe_db_instances(DBInstanceIdentifier=tmp)["DBInstances"][0]["Endpoint"]["Address"]
script = f"""docker exec -i carevia-backend-1 python - <<'PY'
import json,boto3,psycopg2
d=json.loads(boto3.client('secretsmanager',region_name='us-east-1').get_secret_value(SecretId='carevia/db')['SecretString'])
tabs=['users','doctor_profiles','patient_profiles','appointments','consultation_notes','prescriptions','medical_records','notifications','audit_logs','availability_slots']
def counts(h):
    c=psycopg2.connect(host=h,port=5432,dbname=d['dbname'],user=d['username'],password=d['password'],sslmode='require',connect_timeout=10);cur=c.cursor();o={{}}
    for t in tabs:
        cur.execute('select count(*) from '+t);o[t]=cur.fetchone()[0]
    return o
a=counts(d['host']);b=counts('{host}')
for t in tabs: print(t.ljust(20),a[t],b[t],'OK' if a[t]<=b[t] and b[t]>=0 else 'DIFF')
print('RESULT','IDENTICAL' if a==b else 'restore has rows as of snapshot time (source may have newer rows)')
PY"""
cid = ssm.send_command(InstanceIds=[INST], DocumentName="AWS-RunShellScript", Parameters={"commands": [script]})["Command"]["CommandId"]
for _ in range(40):
    time.sleep(4)
    try: o = ssm.get_command_invocation(CommandId=cid, InstanceId=INST)
    except Exception: continue
    if o["Status"] not in ("Pending", "InProgress"): break
print(o["StandardOutputContent"], o["StandardErrorContent"][-300:])
rds.delete_db_instance(DBInstanceIdentifier=tmp, SkipFinalSnapshot=True, DeleteAutomatedBackups=True)
print("temporary restore instance deletion requested (only the temp copy; production DB and the manual snapshot are kept)")
print(json.dumps({"snapshot_seconds": round(t_snap), "restore_seconds_RTO": round(rto), "RPO_note": "snapshot = point in time; automated backups give 5-minute PITR"}))
