import logging
from typing import Optional, Dict, Any
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

logger = logging.getLogger("careflow.cognito")


class CognitoAuthService:
    def __init__(self):
        self.enabled = settings.USE_AWS_COGNITO and bool(settings.COGNITO_USER_POOL_ID)
        self.client_id = settings.COGNITO_CLIENT_ID
        self.user_pool_id = settings.COGNITO_USER_POOL_ID
        self.region = settings.COGNITO_REGION
        
        if self.enabled:
            self.idp = boto3.client("cognito-idp", region_name=self.region)
        else:
            self.idp = None

    def register_user(
        self,
        email: str,
        password: str,
        full_name: str,
        role: str
    ) -> Optional[str]:
        """
        Register user in AWS Cognito User Pool and associate with RBAC Group.
        Returns Cognito Sub ID on success.
        """
        if not self.enabled or not self.idp:
            return None

        try:
            resp = self.idp.sign_up(
                ClientId=self.client_id,
                Username=email,
                Password=password,
                UserAttributes=[
                    {"Name": "email", "Value": email},
                    {"Name": "name", "Value": full_name},
                    {"Name": "custom:role", "Value": role}
                ]
            )
            sub = resp.get("UserSub")
            
            # Map role to Cognito group: Patients, Doctors, Admins
            group_name = {
                "patient": "Patients",
                "doctor": "Doctors",
                "admin": "Admins"
            }.get(role, "Patients")

            try:
                self.idp.admin_add_user_to_group(
                    UserPoolId=self.user_pool_id,
                    Username=email,
                    GroupName=group_name
                )
            except Exception as grp_err:
                logger.warning(f"Cognito group assignment warning: {str(grp_err)}")

            return sub
        except ClientError as e:
            logger.error(f"[COGNITO_SIGNUP_ERROR] {str(e)}")
            raise RuntimeError(f"Cognito registration error: {e.response['Error']['Message']}")


cognito_service = CognitoAuthService()
