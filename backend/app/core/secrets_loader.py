"""
Load application secrets from AWS Secrets Manager into the process environment
*before* settings are parsed. Secrets therefore never live in image layers,
compose files, Git or the container's `docker inspect` output.

Enabled only when the relevant *_SECRET_ID variable is set (cloud deployment).
Local development keeps using plain environment variables / .env.
"""
import json
import os


def _fetch(secret_id: str) -> dict:
    import boto3  # imported lazily: not needed for local runs

    client = boto3.client("secretsmanager", region_name=os.getenv("AWS_REGION", "us-east-1"))
    return json.loads(client.get_secret_value(SecretId=secret_id)["SecretString"])


def load_secrets_into_env() -> None:
    db_id = os.getenv("DB_SECRET_ID")
    if db_id:
        db = _fetch(db_id)
        # sslmode=require: RDS enforces TLS (rds.force_ssl=1)
        os.environ["DATABASE_URL"] = (
            f"postgresql://{db['username']}:{db['password']}@{db['host']}:{db['port']}/{db['dbname']}?sslmode=require"
        )
    jwt_id = os.getenv("JWT_SECRET_ID")
    if jwt_id:
        os.environ["SECRET_KEY"] = _fetch(jwt_id)["secret_key"]
    seed_id = os.getenv("SEED_SECRET_ID")
    if seed_id:
        for key, value in _fetch(seed_id).items():
            os.environ[key] = value
