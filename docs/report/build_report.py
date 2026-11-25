#!/usr/bin/env python3
"""Builds report.html from docs + screenshots (then render with pdf.js). Usage: python3 build_report.py"""
import html, os
H = html.escape
SH = "../screenshots/"
APP = "../screenshots/app/"
P = "[STUDENT NAME(S)] · [ENROLLMENT NO.(S)] · [COURSE CODE] · [UNIVERSITY]"


def box(x, y, w, h, t, fill="#e8f3f1", stroke="#0f5f57", fs=11, sub=None):
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{fill}" stroke="{stroke}" stroke-width="1.4"/>'
    s += f'<text x="{x+w/2}" y="{y+h/2+(-2 if sub else 4)}" text-anchor="middle" font-size="{fs}" font-weight="700" fill="#10303a">{H(t)}</text>'
    if sub:
        s += f'<text x="{x+w/2}" y="{y+h/2+12}" text-anchor="middle" font-size="9" fill="#44525f">{H(sub)}</text>'
    return s


def arrow(x1, y1, x2, y2, dash=False):
    d = ' stroke-dasharray="5,4"' if dash else ''
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#0f5f57" stroke-width="1.6"{d} marker-end="url(#a)"/>'


DEFS = '<defs><marker id="a" markerWidth="9" markerHeight="9" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#0f5f57"/></marker></defs>'


def svg_built():
    s = f'<svg viewBox="0 0 760 470" width="100%" font-family="Helvetica,Arial">{DEFS}'
    s += '<rect x="5" y="5" width="750" height="460" rx="10" fill="#fbfcfd" stroke="#9fb3bd"/><text x="18" y="24" font-size="11" fill="#44525f">AWS us-east-1 · VPC 10.20.0.0/16 (account 211125469458)</text>'
    s += '<rect x="150" y="38" width="330" height="170" rx="8" fill="#fff8e6" stroke="#e0a800" stroke-dasharray="6,4"/><text x="160" y="54" font-size="10" fill="#8a6500">PUBLIC subnet · SG: 80/443 only · no SSH (SSM)</text>'
    s += '<rect x="150" y="238" width="330" height="95" rx="8" fill="#eaf5ee" stroke="#2e7d32" stroke-dasharray="6,4"/><text x="160" y="254" font-size="10" fill="#2e7d32">PRIVATE-DB subnets · no internet route · SG: 5432 from app SG only</text>'
    s += box(20, 90, 100, 44, "Users", "#fff", "#44525f", 11, "browser (HTTPS)")
    s += box(165, 66, 140, 52, "Caddy proxy", "#fff", "#0f5f57", 11, "Let's Encrypt TLS")
    s += box(325, 66, 140, 52, "Frontend", "#fff", "#0f5f57", 11, "Next.js, uid 1001")
    s += box(165, 140, 300, 52, "FastAPI backend, 2 workers", "#fff", "#0f5f57", 11, "JWT · RBAC · audit · EC2 t4g.small + Elastic IP")
    s += box(165, 266, 300, 52, "RDS PostgreSQL 16", "#fff", "#2e7d32", 11, "KMS · TLS enforced · 7-day backups · single-AZ")
    s += arrow(120, 112, 165, 92) + arrow(305, 92, 325, 92) + arrow(235, 118, 235, 140) + arrow(315, 192, 315, 266)
    s += box(520, 66, 220, 40, "S3 records vault", "#fff", "#0f5f57", 11, "SSE-KMS · versioning · block public")
    s += box(520, 116, 220, 40, "Secrets Manager + KMS CMK", "#fff", "#0f5f57", 11, "DB + JWT secrets · key rotation")
    s += box(520, 166, 220, 40, "SQS (+DLQ) > Lambda > SNS", "#fff", "#0f5f57", 11, "appointment notifications")
    s += box(520, 216, 220, 40, "Lambda document scanner", "#fff", "#0f5f57", 11, "S3 event · SHA-256 · basic check")
    s += box(520, 266, 220, 40, "CloudWatch + alarms + dashboard", "#fff", "#0f5f57", 11, "container logs (awslogs)")
    s += box(520, 316, 220, 40, "CloudTrail (multi-region)", "#fff", "#0f5f57", 11, "log validation · logs bucket")
    s += box(520, 366, 220, 40, "ECR · Cognito · SSM", "#fff", "#0f5f57", 11, "images · identity pool · Session Mgr")
    s += arrow(465, 160, 520, 90, True) + arrow(465, 166, 520, 136, True) + arrow(465, 172, 520, 186, True)
    s += '<text x="18" y="440" font-size="10" fill="#44525f">Browser talks to S3 directly with 15-min presigned URLs (files never stream through the API). Dashed = AWS API calls using the instance role.</text></svg>'
    return s


def svg_designed():
    s = f'<svg viewBox="0 0 760 290" width="100%" font-family="Helvetica,Arial">{DEFS}'
    s += box(10, 120, 80, 40, "Users", "#fff", "#44525f", 11)
    s += box(110, 120, 100, 40, "CloudFront + WAF", "#f3f0ff", "#6a4fc0", 10, "DESIGNED")
    s += box(230, 120, 100, 40, "ALB + ACM", "#f3f0ff", "#6a4fc0", 10, "DESIGNED")
    s += box(350, 60, 130, 40, "ECS Fargate API", "#f3f0ff", "#6a4fc0", 10, "DESIGNED (EC2 built)")
    s += box(350, 180, 130, 40, "ECS Fargate API (AZ-b)", "#f3f0ff", "#6a4fc0", 10, "DESIGNED")
    s += box(500, 120, 120, 40, "RDS Multi-AZ", "#f3f0ff", "#6a4fc0", 10, "DESIGNED (single-AZ built)")
    s += box(640, 60, 110, 40, "2x NAT gateway", "#f3f0ff", "#6a4fc0", 10, "DESIGNED")
    s += box(640, 180, 110, 40, "GuardDuty, Config", "#f3f0ff", "#6a4fc0", 10, "DESIGNED")
    s += arrow(90, 140, 110, 140) + arrow(210, 140, 230, 140) + arrow(330, 130, 350, 85) + arrow(330, 150, 350, 195) + arrow(480, 85, 500, 130) + arrow(480, 200, 500, 150)
    s += '<text x="10" y="262" font-size="10" fill="#44525f">Purple = full zero-trust design in terraform/ (about USD 175-250/month). Not built: CloudFront is blocked in the Learner Lab; the others cost too much.</text></svg>'
    return s


def svg_cicd():
    s = f'<svg viewBox="0 0 760 170" width="100%" font-family="Helvetica,Arial">{DEFS}'
    xs = [(10, "git push", "GitHub"), (140, "CI", "lint, tests, scans"), (290, "Release", "images to GHCR :sha"), (440, ":release tag", "only after CI passed"), (590, "EC2 poller", "every 2 minutes")]
    for i, (x, t, sub) in enumerate(xs):
        s += box(x, 30, 125, 56, t, "#fff", "#0f5f57", 11, sub)
        if i:
            s += arrow(xs[i - 1][0] + 125, 58, x, 58)
    s += box(290, 110, 440, 44, "deploy.sh: pull, migrate, swap, health check (150 s), automatic rollback", "#fff8e6", "#e0a800", 10)
    s += arrow(650, 86, 650, 110)
    return s + '</svg>'


def fig(n, title, body):
    return f'<figure class="fig"><div>{body}</div><figcaption><b>Figure {n}.</b> {H(title)}</figcaption></figure>'


shots = []


def shot(file, cap, path=SH):
    shots.append(file)
    return f'<figure class="shot"><img src="{path}{file}"/><figcaption><b>Figure S{len(shots)}.</b> {cap}</figcaption></figure>'


def tbl(head, rows):
    t = '<table><tr>' + ''.join(f'<th>{H(h)}</th>' for h in head) + '</tr>'
    for r in rows:
        t += '<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>'
    return t + '</table>'


def tag(s):
    c = {"Verified": "ok", "Implemented-not-tested": "warn", "Designed-only": "des", "Not done": "bad"}[s]
    return f'<span class="tag {c}">{s}</span>'


def read(p):
    return open(p).read() if os.path.exists(p) else ""


V, I, D, N = tag("Verified"), tag("Implemented-not-tested"), tag("Designed-only"), tag("Not done")
parts = []

parts.append(f'''<section class="cover"><div class="logo">CAREvia</div><h1>Zero-Trust Multi-Tier Healthcare Records<br>and Tele-Consultation Portal</h1>
<h2>Cloud Computing Project Report: AWS hosting, services, costing, CI/CD, security and SLA</h2>
<p class="meta">{P}</p><p class="meta">Application: CAREvia / CareFlow · Repository: github.com/Nynlogic/carve · AWS account 211125469458 (Learner Lab), region us-east-1</p>
<p class="meta">Live site: https://35-172-149-226.nip.io</p>
<div class="legend"><b>How claims are labelled:</b> {V} evidence in <i>docs/evidence</i> &nbsp; {I} &nbsp; {D} &nbsp; {N}<br>
All data is <b>synthetic</b>. The design is <b>HIPAA-conscious</b>; it is <b>not</b> certified or HIPAA-compliant.</div></section>''')

parts.append(f'''<section><h1>Summary</h1>
<p>The portal lets patients book tele-consultations, doctors write SOAP notes (ICD-10) and issue e-prescriptions, patients store medical documents, and administrators review an audit trail. It was built as a local application and is now <b>hosted online on AWS</b>, attached to real AWS services, with documented costing, CI/CD, zero-trust security and SLA.</p>
{tbl(["Requirement from the professor", "Outcome", "Status"], [
    ["Application hosted online, attached to the cloud", "https://35-172-149-226.nip.io, HTTPS (Let's Encrypt), EC2 + RDS + S3 + KMS + 10 more services", V],
    ["Cloud generation", "Terraform stack <code>terraform/lab</code> (82 resources); CloudFormation for S3 buckets (SCP workaround)", V],
    ["Cloud service usage", "VPC, EC2, RDS, S3, KMS, Secrets Manager, ECR, SQS/SNS, Lambda, Cognito, CloudWatch, CloudTrail, SSM, CloudFormation", V],
    ["Costing", "about USD 0.052/h (about 38/month); full design about 175-250/month (section 8)", I + " list prices, unverified"],
    ["CI/CD pipeline", "CI + release workflows; pull-based deploy with migration, health check and automatic rollback; rollback proven live", V + " server side<br>" + N + " GitHub runs (repository not pushed yet)"],
    ["Cloud security", "zero-trust controls; 30/30 live security/functional checks; 2 critical and 5 high code flaws fixed", V],
    ["SLA documentation", "separate SLA PDF: AWS commitments, own targets, measured values", V]])}
<p><b>Most important finding:</b> the original code let anyone register as an administrator and exposed an unauthenticated endpoint that wiped the database. Both were fixed before hosting (section 9).</p></section>''')

parts.append('''<section><h1>1. Project overview</h1>
<p><b>Problem.</b> Clinics must share sensitive health information between patients, doctors and administrators without trusting any network, user or component by default.</p>
<p><b>Roles.</b> Patient (book, view prescriptions, upload records), Doctor (consultations, SOAP notes, e-prescriptions), Administrator (users, analytics, audit log).</p>
<p><b>Technology.</b> Next.js 14 (React, Tailwind) · FastAPI (Python 3.11) · SQLAlchemy 2 + Alembic · PostgreSQL 16 · JWT + bcrypt · boto3 · Docker.</p>
<p><b>Why zero-trust and multi-tier matter in healthcare.</b> Health records are among the most sensitive data. Separate network tiers (web, application, database) limit the damage of any single break-in; zero-trust adds explicit authentication and authorisation on every request, least privilege, encryption everywhere and a complete audit trail.</p></section>''')

parts.append(f'''<section><h1>2. Application workflow</h1>
{tbl(["Flow", "Steps"], [
    ["Booking", "Patient chooses doctor and slot, API checks conflicts (HTTP 409 if taken), appointment and telemedicine room id are created, audit entry written, SQS message, Lambda, SNS notification"],
    ["Consultation", "Doctor opens the appointment, saves a SOAP note with ICD-10 and vitals (doctor must own the appointment), issues a signed e-prescription, patient reads it (ownership checked)"],
    ["Record upload", "Patient requests an upload URL, browser PUTs the file straight to S3 (KMS-encrypted, 15-minute URL), API stores metadata (the key must be inside the patient's own prefix), Lambda tags the object with SHA-256 and scan status"],
    ["Audit", "Logins, bookings, notes, prescriptions, uploads and downloads are written to an append-only audit table (actor, action, resource, IP, user agent, time); administrators read it; the API has no route to edit or delete it"]])}
<p class="sub">Verified end to end on the live site by <code>scripts/e2e_cloud_test.py</code> (section 12).</p></section>''')

parts.append(f'''<section style="page-break-before:always"><h1>3. Architecture</h1>
<p>Two architectures are shown. The <b>built</b> one runs today. The <b>designed</b> one is the full zero-trust target (Terraform in <code>terraform/</code>); parts are blocked in the Learner Lab (CloudFront) or too costly for the credit (NAT, ALB, WAF, Multi-AZ).</p>
{fig(1, "Built architecture (Verified)", svg_built())}
{fig(2, "Full designed architecture (Designed-only)", svg_designed())}
<h3>Trust boundaries</h3>
{tbl(["Boundary", "Control"], [
    ["Internet to host", "only ports 80/443; TLS 1.3 via Caddy; security headers; no SSH"],
    ["Host to database", "private subnets with no internet route; security group accepts only the application group; TLS enforced by RDS"],
    ["Browser to S3", "presigned URL (15 min); bucket policy denies non-TLS; public access fully blocked"],
    ["Application to AWS", "instance role (IMDSv2, hop limit 2 for containers); no static keys in containers"],
    ["Secrets", "Secrets Manager (KMS), fetched at application start; not in images, Git or the container environment"]])}
<p><b>Why the frontend is a container, not S3 + CloudFront:</b> the Next.js app is a Node server (<code>next start</code>), not a static export, and CloudFront is blocked in this account. <b>Why no ALB/NAT:</b> about USD 20 and 33 per month each (section 8); Caddy gives HTTPS and routing on the single host, and the free S3 gateway endpoint keeps S3 traffic off the internet.</p></section>''')

parts.append(f'''<section><h1>4. Cloud generation / provisioning</h1>
<p>Infrastructure is code: <code>terraform/lab</code> (Terraform 1.7, AWS provider 5.x, state kept out of Git). One <code>terraform apply</code> created 82 resources in two stages (everything, then the EC2 host once images were in ECR). The plan showed <b>0 destroys and 0 replacements</b>. All resources are tagged <code>Project / Environment / Owner</code> and prefixed <code>carevia-</code>.</p>
{tbl(["Adaptation for the Learner Lab", "Reason / evidence"], [
    ["S3 buckets created through <b>CloudFormation</b>; every bucket setting still managed by Terraform", "SCP: <code>explicit deny ... s3:GetBucketObjectLockConfiguration</code> breaks <code>aws_s3_bucket</code>"],
    ["<code>LabRole</code> / <code>LabInstanceProfile</code> reused for the host and Lambdas", "custom IAM roles cannot be created (documented gap)"],
    ["No CloudFront", "<code>AccessDenied cloudfront:ListDistributions</code>"],
    ["No NAT gateway; S3 gateway endpoint", "cost; S3 traffic stays on the AWS network"],
    ["Elastic IP + <code>&lt;ip&gt;.nip.io</code>", "stable HTTPS name without owning a domain"]])}
<p>Reproducibility: <code>cd terraform/lab &amp;&amp; terraform init &amp;&amp; terraform apply</code> with credentials from environment variables only. {V}</p></section>''')

svc = [
    ("VPC, subnets, route tables, security groups",
     "Isolated network with three tiers. The public subnets hold the host; two private-db subnets hold RDS and have no internet route. The security groups form the chain internet, web SG (80/443), DB SG (5432 from the web SG only).",
     [("01-vpc-resource-map.png", "VPC <code>carevia-vpc</code> (10.20.0.0/16) resource map: public and private-db subnets, route tables, internet gateway and the S3 gateway endpoint. This is the network segmentation behind the zero-trust micro-perimeters."),
      ("04b-sg-db-inbound.png", "Security group <code>carevia-db-sg</code>: one inbound rule, PostgreSQL TCP 5432. Its source is the web security group (no CIDR range; confirmed by the API check in <code>evidence/aws_verification.txt</code>), so nothing on the internet can reach the database."),
      ("04a-sg-web-inbound.png", "Security group <code>carevia-web-sg</code>: inbound 80 and 443 only. There is no port 22; administration uses Session Manager."),
      ("02-vpc-subnets.png", "Four subnets in two AZs: <code>carevia-public-*</code> and <code>carevia-private-db-*</code>."),
      ("03-route-tables.png", "Route tables: <code>carevia-rt-public</code> has the internet route; <code>carevia-rt-private-db</code> has none.")]),
    ("EC2 (Graviton), Docker and Systems Manager",
     "One <code>t4g.small</code> host (IMDSv2 required, encrypted gp3 root volume) runs Caddy, Next.js and FastAPI in Docker (non-root, health-checked, logs to CloudWatch). Systems Manager gives shell access and remote commands without SSH.",
     [("05-ec2-instance.png", "Instance <code>carevia-web</code>, type t4g.small, running, Elastic IP attached."),
      ("23-ssm-fleet.png", "Fleet Manager lists the instance as a managed node. All operations (deploy, backup, tests) use it; no SSH key exists.")]),
    ("ECR: private container registry",
     "Stores the backend and frontend images. Tags are immutable, scan-on-push is on and images are KMS-encrypted; a lifecycle rule keeps the last 10.",
     [("06-ecr-repos.png", "Repositories <code>carevia-backend</code> and <code>carevia-frontend</code>: tag immutability <b>Immutable</b>, encryption <b>KMS</b>."),
      ("07-ecr-backend-images.png", "Backend image tags (v1, v2 and the deliberately broken <code>v1-broken</code> used for the rollback test).")]),
    ("RDS PostgreSQL",
     "Private (no public address), KMS-encrypted, TLS enforced (<code>rds.force_ssl</code>), 7-day automated backups, deletion protection, logs exported to CloudWatch. Single-AZ by choice because Multi-AZ doubles the cost.",
     [("08-rds-database.png", "<code>carevia-db</code> (db.t4g.micro, PostgreSQL, Available): the only security-group rule is <code>carevia-db-sg</code> inbound from <code>sg-008a918311d37dad0</code> (the web security group). &ldquo;Publicly accessible: No&rdquo; is confirmed by the API check in <code>evidence/aws_verification.txt</code> and by the failed connection from the internet."),
      ("08b-rds-maintenance-backups.png", "Maintenance and backups: automated backups <b>Enabled (7 days)</b>, latest restore time shown (point-in-time restore, RPO of about 5 minutes), backup window, and the snapshot list with the manual and automated snapshots."),
      ("09-rds-snapshots.png", "Manual snapshot taken before the restore rehearsal (section 10).")]),
    ("S3 medical-records vault",
     "Documents are stored encrypted with the KMS key and versioned. The bucket is never public and is reached only through 15-minute presigned URLs issued after an authorisation check. A Lambda tags each upload.",
     [("10-s3-properties.png", "Bucket properties: default encryption <b>SSE-KMS</b> with the customer-managed key ARN, Bucket Key enabled, and the project tags."),
      ("10c-s3-logging-events.png", "Server access logging is <b>Enabled</b> (destination: the logs bucket) and an event notification invokes <code>carevia-document-scanner</code> for objects created under <code>patients/</code>."),
      ("11-s3-permissions.png", "Permissions: <b>Block all public access ON</b> and a bucket policy that denies any request not using TLS (<code>aws:SecureTransport = false</code>)."),
      ("10b-s3-objectlock-events.png", "Evidence of the Learner-Lab restriction: the console cannot read Object Lock settings (<code>s3:GetBucketObjectLockConfiguration</code> denied by an SCP). This is why the buckets are created through CloudFormation.")]),
    ("KMS and Secrets Manager",
     "One customer-managed key (rotation on) protects RDS, S3, secrets, EBS, SNS and CloudTrail. Three secrets hold the DB credentials, the JWT signing key and synthetic demo-user passwords. <b>Values are never shown.</b>",
     [("12-kms-keys.png", "Customer-managed key <code>alias/carevia</code>, enabled."),
      ("13-secrets-manager.png", "Secrets <code>carevia/db</code>, <code>carevia/jwt</code>, <code>carevia/demo-users</code> (names only).")]),
    ("Cognito",
     "User pool with groups patients, doctors, admins and optional TOTP MFA. <b>Provisioned</b>, but the running app uses its own JWT mode; end-to-end Cognito login is not verified.",
     [("14-cognito.png", "User pool <code>carevia-users</code>.")]),
    ("SQS, SNS and Lambda",
     "Booking events go to an SQS queue (with dead-letter queue), then the notifier Lambda, then SNS. Uploads trigger the document-scanner Lambda (SHA-256 plus a basic signature check; <b>not</b> an anti-malware engine).",
     [("15-sqs.png", "Queue <code>carevia-notifications</code> and its DLQ (SSE enabled, redrive after 3 failures)."),
      ("16-sns.png", "Topic <code>carevia-alerts</code> (KMS-encrypted). No e-mail subscriber is configured yet; the owner must supply an address."),
      ("17-lambda.png", "Functions <code>carevia-appointment-notifier</code> and <code>carevia-document-scanner</code> (arm64, Python 3.12). The scanner tagged the test upload <code>ScanStatus=CLEAN</code>.")]),
    ("CloudWatch and CloudTrail",
     "Container logs stream to <code>/carevia/app</code>; eight alarms (host status, CPU, RDS CPU/storage/connections, application errors, DLQ, Lambda errors) notify an SNS topic; a dashboard shows the key metrics. CloudTrail records API activity (multi-region, log-file validation).",
     [("18-cloudwatch-alarms.png", "Alarms (the host status alarm starts as INSUFFICIENT_DATA until metrics arrive)."),
      ("19-cloudwatch-dashboard.png", "Dashboard <code>carevia-overview</code>: RDS CPU and connections, queue depth, Lambda, latest log lines."),
      ("20-cloudwatch-logs.png", "Log groups: <code>/carevia/app</code> (backend, frontend, caddy), Lambda and RDS PostgreSQL logs."),
      ("21-cloudtrail.png", "Trail <code>carevia-trail</code>: multi-region, log-file validation, delivering to the encrypted logs bucket.")]),
    ("CloudFormation", "Creates the three S3 buckets (workaround for the SCP).",
     [("22-cloudformation.png", "Stack <code>carevia-buckets</code>: CREATE_COMPLETE.")]),
]
parts.append('<section style="page-break-before:always"><h1>5. AWS services used</h1>' + tbl(["Service", "Purpose in the project", "Approx. cost"], [
    ["VPC / SG / S3 endpoint", "3-tier segmentation", "free"], ["EC2 t4g.small + Elastic IP", "Docker host", "0.0168 + 0.005 $/h"],
    ["RDS db.t4g.micro", "PostgreSQL", "0.016 $/h + storage"], ["S3 + KMS", "encrypted records", "cents + 1 $/month"],
    ["Secrets Manager", "3 secrets", "1.2 $/month"], ["ECR", "container images", "cents"],
    ["SQS / SNS / Lambda", "notifications, scanning", "free tier"], ["Cognito", "identity (provisioned)", "free tier"],
    ["CloudWatch / CloudTrail", "logs, alarms, audit", "about 6 $/month / free"], ["SSM / CloudFormation", "operations / buckets", "free"]]) + '</section>')
for name, text, imgs in svc:
    sec = f'<section class="svc"><h2>{name}</h2><p>{text}</p>'
    for i in range(0, len(imgs), 2):
        sec += '<div class="pair">' + ''.join(shot(f, c) for f, c in imgs[i:i + 2]) + '</div>'
    parts.append(sec + '</section>')

parts.append(f'''<section><h1>6. Dockerization</h1>
{tbl(["Item", "Result", "Status"], [
    ["Images", "backend (python:3.11-slim, multi-stage, about 740 MB), frontend (node:20-alpine, multi-stage, about 650 MB), built natively for arm64", V],
    ["Non-root", "both run as uid 1001 (checked on the live host)", V],
    ["Health checks", "backend <code>/health/ready</code> (database check), frontend HTTP; used by compose and the deploy script", V],
    ["No secrets in image or environment", "<code>docker inspect</code> shows 0 password/secret variables; secrets come from Secrets Manager at start", V],
    ["Fixes needed", "PostgreSQL driver missing; <code>public/</code> missing for clean builds; build argument for the API URL (<code>/api/v1</code>, same origin)", V],
    ["Trivy scan", "configured in CI (fails on CRITICAL with a fix); ECR scan-on-push enabled; no scan results captured yet", I],
    ["Production compose", "<code>deploy/docker-compose.prod.yml</code>: Caddy + frontend + backend, <code>awslogs</code> driver, restart policy", V]])}</section>''')

parts.append(f'''<section><h1>7. CI/CD pipeline</h1>
{fig(3, "Pipeline: CI on GitHub, release promotion, pull-based deployment with rollback", svg_cicd())}
<p><b>Why pull-based.</b> Learner-Lab credentials expire and OIDC providers or custom IAM roles cannot be created, so GitHub cannot deploy. The server pulls only what CI has promoted; <b>no cloud secret is stored in GitHub</b>.</p>
{tbl(["Stage", "Content"], [
    ["CI (<code>ci.yml</code>)", "flake8, pytest with a coverage gate (70 % today), Bandit, pip-audit, Next.js build, npm audit, gitleaks, Terraform fmt/validate, arm64 image build, Trivy (CRITICAL fails), non-root check"],
    ["Release (<code>deploy.yml</code>)", "runs only when CI succeeded on <code>main</code>; pushes <code>ghcr.io/.../carve-*:sha</code> and, last, moves <code>:release</code>"],
    ["Deploy (<code>deploy.sh</code>)", "pull, <code>alembic upgrade head</code> (before the swap), swap, health check 150 s, automatic rollback, history log"],
    ["Fixed false-green", "the old workflow used <code>continue-on-error: true</code> on AWS login and could succeed without deploying; removed"]])}
<h3>Live evidence</h3>
{tbl(["Test", "Result", "Status"], [
    ["Deploy v1, v2, v3 through <code>deploy.sh</code>", "DEPLOY ok each time (about 15 s swap)", V],
    ["Deliberately unhealthy release", "<code>ROLLBACK reason=health check failed</code> after 171 s; previous version restored; site healthy", V],
    ["Failing tests are not deployed; GitHub run history", "repository not pushed (needs the owner's GitHub token)", N]])}
<pre>{H(read("../evidence/rollback_demo.txt")[:1000])}</pre>
<p><b>Limits.</b> Migrations are forward-only; a few seconds of unavailability during the swap; <code>terraform apply</code> is manual by design; branch protection should require the CI checks.</p></section>''')

parts.append(f'''<section><h1>8. Costing</h1>
<p>Region us-east-1, 730 h/month. <b>List-price estimates, not re-verified against the AWS price-list files.</b> Real consumption must be read from the Learner Lab credit page. <i>Owner: record actual credit used: ________</i></p>
{tbl(["Component", "per hour", "per month"], [["EC2 t4g.small + Elastic IP + RDS db.t4g.micro", "0.038", "27.6"], ["EBS + RDS storage (20 GB each)", "0.005", "3.9"], ["KMS, 3 secrets, alarms, dashboard", "0.009", "6.4"], ["<b>Built stack total</b>", "<b>about 0.052</b>", "<b>about 38</b>"], ["Full designed stack (2 NAT, ALB, Multi-AZ, WAF, Fargate, CloudFront)", "about 0.24-0.34", "about 175-250"]])}
{tbl(["Scenario", "Approx. cost"], [["24/7 for a month", "about 38"], ["Demo weekend (3 days)", "about 3.8"], ["Office hours only", "about 10-14"], ["Everything stopped", "about 8-10 per month (EBS, RDS storage, snapshots, Elastic IP, KMS, secrets)"], ["Forgotten for a month", "about 38; exceeds the roughly 50 credit in about 5 weeks"]])}
<p><b>Rejected options:</b> second NAT gateway (0.045 $/h each), ALB (about 20 $/month), RDS Multi-AZ (twice the price), WAF (about 10 $/month plus requests), no Elastic IP (public address changes on every stop). <b>Still billed when stopped:</b> EBS, RDS storage and snapshots, Elastic IP, KMS, secrets, logs. RDS restarts by itself after 7 days stopped.</p></section>''')

parts.append(f'''<section style="page-break-before:always"><h1>9. Cloud security</h1>
<h2>9.1 Code review: findings fixed before hosting</h2>
{tbl(["Severity", "Finding", "Result"], [
    ["Critical", "Anyone could self-register as <b>admin</b>", "fixed; live: 403 " + V],
    ["Critical", "Unauthenticated <code>/users/clean-slate</code> deleted all patients, doctors and records", "fixed; live: 404 " + V],
    ["High", "Any logged-in user could list all patients (PHI)", "doctor/admin only " + V],
    ["High", "Prescriptions readable by appointment id (IDOR)", "ownership check " + V],
    ["High", "Cognito mode accepted unsigned tokens when keys could not be fetched", "fail-closed " + I],
    ["High", "Patient could attach records to any patient or file key; unauthenticated local file endpoints", "fixed " + V],
    ["High", "Default JWT secret in the repository, CORS <code>*</code>, DEBUG on", "production refuses unsafe config; secrets from Secrets Manager " + V],
    ["Medium", "No PostgreSQL driver; frontend upload called non-existent endpoints; demo passwords in the UI bundle", "fixed " + V],
    ["Low", "Migration drift (indexes); scanner overstated (<code>HIPAACompliant</code> tag)", "scanner wording fixed; migration drift documented"]])}
<h2>9.2 Zero-trust mapping</h2>
{tbl(["Principle", "Controls", "Status"], [
    ["Verify explicitly", "JWT + bcrypt, role and object-level checks, admin-gated account creation; Cognito pool and MFA provisioned", V + " / Cognito " + I],
    ["Least privilege", "DB reachable only from the app SG; web SG 80/443; no SSH; presigned URLs 15 min; TLS-only bucket policy. Gap: broad <code>LabRole</code>", V],
    ["Assume breach", "private DB subnets, KMS everywhere with rotation, TLS in transit and for RDS, secrets store, immutable ECR tags, non-root containers, IMDSv2, CloudTrail and audit trail", V],
    ["Perimeter defences", "WAF managed rules and rate limit, GuardDuty, Config, Security Hub", D]])}
<h2>9.3 Threat model (STRIDE-lite) and accepted gaps</h2>
{tbl(["Threat", "Mitigation", "Residual risk"], [
    ["Spoofing", "bcrypt, signed JWT, auth rate limit", "no MFA in app mode, no lockout"], ["Tampering", "RBAC, ownership checks, S3 versioning", "single JWT key"],
    ["Repudiation", "append-only audit via the API, CloudTrail", "audit rows live in the app database (use S3 Object Lock in production)"],
    ["Information disclosure", "private DB, KMS, TLS, presigned URLs, generic errors", "broad lab role; a presigned URL is a bearer link for 15 min"],
    ["Denial of service", "restart policy, 2 workers", "no WAF or CDN, single instance"], ["Elevation of privilege", "admin creation gated, demo endpoints disabled", "none known"]])}
<p><b>HIPAA-conscious, not compliant:</b> there is no BAA for a student account and only synthetic data is used. Other gaps: single AZ, Cognito not wired, WebRTC media untested, the scanner is not anti-malware, Let's Encrypt on a third-party <code>nip.io</code> name.</p></section>''')

parts.append(f'''<section><h1>10. Backup and disaster recovery</h1>
{tbl(["Item", "Result", "Status"], [
    ["Automated backups", "7 days, point-in-time, KMS-encrypted", V],
    ["Manual snapshot", "<code>carevia-manual-20261125-235454</code> available after 170 s", V],
    ["<b>Restore into a new instance</b>", "restored instance available after <b>575 s</b> (measured database RTO); then deleted (only the temporary copy)", V],
    ["Row-count comparison", "users 7/7, doctors 3/3, patients 3/3, notes 2/2, prescriptions 2/2, records 2/2, slots 15/15; appointments 3 vs 2, notifications 4 vs 3, audit 15 vs 10. The restore equals the <i>snapshot time</i>; the source gained those rows during the later load test (this illustrates the RPO)", V],
    ["Off-AWS copy", "<code>pg_dump</code> (gzip) stored in S3 and downloaded to the owner's computer (<code>backups/</code>, git-ignored)", V],
    ["Document files in S3", "versioned in S3; <b>no off-AWS copy</b> of the objects", N]])}
<p><b>RPO</b> up to 5 minutes (point-in-time restore); manual dumps equal the time of the dump. <b>RTO</b>: database restore about 10 minutes plus about 5 minutes to repoint the application; bad release about 3 minutes (automatic); host loss up to 30 minutes (design, not measured). Procedures for app down, bad deploy, corruption, lab loss and key loss are in <code>docs/BACKUP_AND_DR.md</code>.</p></section>''')

parts.append(f'''<section><h1>11. SLA (summary)</h1>
<p>The full SLA is the separate document <b>Healthcare_Portal_SLA.pdf</b>. In short: the weakest AWS commitments in the design are a single EC2 instance and single-AZ RDS (99.5 % class, about 3.65 h downtime per month), so the portal targets <b>99.5 % during clinic hours</b>, RPO up to 5 minutes, RTO up to 20 minutes for a database restore and up to 5 minutes for a bad release. <b>No long-term uptime has been measured yet.</b> Multi-AZ RDS and a second instance behind a load balancer would raise the ceiling to 99.9 % or more ({D}).</p></section>''')

parts.append(f'''<section><h1>12. Testing and performance</h1>
{tbl(["Test", "Result", "Status"], [
    ["Backend pytest", "21 passed (11 original + 10 new security tests), coverage 70 %; flake8 and Bandit clean", V],
    ["Live end-to-end and zero-trust checks", "<b>30/30 passed</b>: 3 roles log in; booking; 409 on conflict; SOAP note; e-prescription; S3 upload and download; unsigned S3 URL gives 403; unauthenticated gives 401; admin self-registration gives 403; patient B cannot read patient A's record or prescription; audit entries recorded; audit has no delete route", V],
    ["Network exposure", "DB port 5432 from the internet: timeout; non-TLS DB connection refused, TLS accepted; web SG ports 80/443 only", V],
    ["Concurrency", "25 simultaneous bookings of one slot: 1 accepted, 24 rejected with 409; no double-booking", V],
    ["WebRTC media between two browsers, Cognito login, CI on GitHub, alarm e-mail delivery", "not tested", N]])}
<h3>Load test (client over the internet to 1 x t4g.small, 2 workers, db.t4g.micro)</h3>
{tbl(["Users", "Requests", "Errors", "Req/s", "p50", "p95", "p99"], [["50", "250", "0", "76.6", "351 ms", "1.55 s", "1.81 s"], ["100", "500", "0", "32.8", "1.35 s", "6.6 s", "7.0 s"]])}
<p class="sub">Limits: includes internet latency from the test machine; logins excluded (API rate limit 20/min/IP, tokens shared); host and DB metrics not captured per run; the single-worker baseline was 2.1 s and 7.7 s p95, so two workers were deployed. Suitable for a clinic demo, not a hospital.</p></section>
<section class="svc"><h2>Live application screenshots</h2>
<div class="pair">{shot("00-login.png", "Login page of the live site over HTTPS. The production build has no demo-password buttons.", APP)}{shot("patient-overview.png", "Patient dashboard.", APP)}</div>
<div class="pair">{shot("patient-records.png", "Health Records vault: the document uploaded through S3 during the end-to-end test.", APP)}{shot("doctor-overview.png", "Doctor dashboard.", APP)}</div>
<div class="pair">{shot("admin-audit.png", "Administrator Security and Audit page: logins recorded with actor, role and IP.", APP)}{shot("admin-overview.png", "Administrator overview.", APP)}</div></section>''')

parts.append(f'''<section><h1>13. Limitations and future work</h1>
<ul><li>Single AZ and single host: no tolerance for an AZ failure; add Multi-AZ RDS, a second instance and an ALB (designed).</li>
<li>The Learner-Lab role is broad: use least-privilege IAM roles in a normal account (Terraform provided).</li>
<li>CloudFront, WAF, GuardDuty, Config and Security Hub not built (blocked or costly).</li>
<li>Cognito is provisioned but not used by the app; MFA is not enforced in application mode.</li>
<li>CI/CD proof on GitHub is pending the repository push; Trivy and ECR scan results not yet captured.</li>
<li>Document files have no off-AWS backup; audit rows share the application database (use S3 Object Lock or a separate store).</li>
<li>Migration drift (missing indexes) and the in-memory rate limiter should be fixed for real use.</li></ul>
<h1 style="margin-top:8mm">14. Conclusion</h1>
<p>The portal runs online on AWS behind HTTPS, attached to a database, encrypted storage, secrets, messaging, monitoring and audit services, with infrastructure as code, a tested automatic rollback, a rehearsed database restore and measured performance. Before hosting, the audit found two critical and several high-severity flaws that would have made any deployment unsafe; they were fixed and verified on the live system. The honest limits (single AZ, lab role, untested WebRTC and Cognito, pending GitHub pipeline proof) are listed so that the next step, a normal account with the full designed architecture, is clear.</p></section>''')

parts.append(f'''<section><h1>Appendix A: How to reproduce and demo</h1>
<ol><li><code>cd terraform/lab &amp;&amp; terraform init &amp;&amp; terraform apply</code> (stage 1), push images to ECR, then <code>-var enable_instance=true -var backend_image=... -var frontend_image=...</code>.</li>
<li>Open the URL from <code>terraform output site_url</code>; passwords are in Secrets Manager <code>carevia/demo-users</code>.</li>
<li>Run <code>python scripts/e2e_cloud_test.py &lt;url&gt;</code> and <code>scripts/verify_aws.py</code>.</li>
<li>Operating steps: <code>docs/RUNBOOK.md</code>; demo script and teacher Q&amp;A: <code>docs/DEMO_GUIDE.md</code>.</li></ol>
<h1>Appendix B: Glossary</h1>
{tbl(["Term", "Meaning"], [["Zero trust", "never trust by default; verify every request, least privilege, assume breach"], ["PHI", "protected health information"], ["KMS CMK", "customer-managed encryption key"], ["Presigned URL", "time-limited signed link to one S3 object"], ["RPO / RTO", "maximum data-loss window / maximum time to restore"], ["SCP", "service control policy: an organisation rule that can deny actions even to admins"], ["IMDSv2", "token-protected instance metadata service"], ["DLQ", "dead-letter queue for messages that keep failing"]])}
<h1>Appendix C: Evidence index</h1>
<p>Files in <code>docs/evidence/</code>: <code>e2e_cloud_test.txt</code>, <code>aws_verification.txt</code>, <code>host_checks.txt</code>, <code>rollback_demo.txt</code>, <code>deploy_v2.txt</code>, <code>deploy_v3.txt</code>, <code>dr_rehearsal.txt</code>, <code>pgdump.txt</code>, <code>load_test.txt</code>. Console screenshots: <code>docs/screenshots/</code>.</p></section>''')

CSS = '''@page{size:A4;margin:16mm 14mm 18mm}body{font-family:Helvetica,Arial,sans-serif;font-size:10pt;line-height:1.42;color:#1b2430}
h1{font-size:18pt;color:#0f5f57;margin:0 0 3mm;border-bottom:2px solid #0f5f57;padding-bottom:1mm}h2{font-size:13pt;color:#0f5f57;margin:3mm 0 2mm}h3{font-size:11pt;color:#10303a;margin:4mm 0 1.5mm}
section{page-break-before:auto;margin-top:7mm}section.cover{page-break-after:always;margin-top:0;padding-top:35mm}h1{page-break-after:avoid}.cover h1{font-size:26pt;border:0;line-height:1.15}.cover h2{font-size:14pt;color:#44525f}.logo{font-size:15pt;font-weight:800;color:#fff;background:#0f5f57;display:inline-block;padding:2mm 6mm;border-radius:3mm;margin-bottom:10mm}.meta{color:#44525f;font-size:10.5pt}.legend{margin-top:14mm;padding:4mm;border:1px solid #cfd8dc;background:#f6f9fa;font-size:9.5pt}
section.svc{page-break-before:auto;margin-top:5mm}h2{page-break-after:avoid}section.svc h2{border-bottom:1.5px solid #0f5f57;padding-bottom:1mm}
table{border-collapse:collapse;width:100%;margin:2mm 0 3mm;font-size:8.8pt}th{background:#0f5f57;color:#fff;text-align:left;padding:3px 5px}td{border:1px solid #cfd8dc;padding:3px 5px;vertical-align:top}
code{background:#eef3f5;padding:0 2px;border-radius:2px;font-size:8.6pt}pre{background:#10202a;color:#d6e4ea;padding:3mm;font-size:6.8pt;white-space:pre-wrap;border-radius:2mm}
.tag{font-size:7.6pt;font-weight:700;padding:1px 5px;border-radius:8px;white-space:nowrap}.ok{background:#d9f2dc;color:#1b5e20}.warn{background:#fff1c9;color:#7a5600}.des{background:#e8e0fa;color:#4527a0}.bad{background:#fbdcdc;color:#b71c1c}
figure{margin:2mm 0;page-break-inside:avoid}figcaption{font-size:8.3pt;color:#44525f;margin-top:1mm}.fig{border:1px solid #e0e6e9;padding:2mm;border-radius:2mm}
.pair figure.shot img{width:122mm;border:1px solid #cfd8dc;display:block;margin:0 auto}.sub{color:#5c6b7a;font-size:9pt}ul,ol{margin:1mm 0 2mm 5mm;padding-left:3mm}'''
doc = f'<!doctype html><html><head><meta charset="utf-8"><title>Healthcare Portal Cloud Report</title><style>{CSS}</style></head><body>' + '\n'.join(parts) + '</body></html>'
open('report.html', 'w').write(doc)
print("report.html", len(doc), "shots", len(shots))
