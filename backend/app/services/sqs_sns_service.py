import json
import logging
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

logger = logging.getLogger("careflow.async_events")


class NotificationQueueService:
    def __init__(self):
        self.queue_url = settings.SQS_NOTIFICATION_QUEUE_URL
        self.topic_arn = settings.SNS_ALERT_TOPIC_ARN
        self.region = settings.AWS_REGION
        
        self.sqs = None
        self.sns = None
        
        if self.queue_url:
            self.sqs = boto3.client("sqs", region_name=self.region)
        if self.topic_arn:
            self.sns = boto3.client("sns", region_name=self.region)

    def dispatch_appointment_event(
        self,
        event_type: str,
        payload: Dict[str, Any]
    ) -> bool:
        """
        Send appointment event to AWS SQS queue for asynchronous Lambda notification processing.
        Decouples synchronous API response from external notification delivery.
        """
        message_body = {
            "event_type": event_type,
            "data": payload
        }

        if self.sqs and self.queue_url:
            try:
                self.sqs.send_message(
                    QueueUrl=self.queue_url,
                    MessageBody=json.dumps(message_body),
                    MessageAttributes={
                        "EventType": {
                            "DataType": "String",
                            "StringValue": event_type
                        }
                    }
                )
                logger.info(f"[SQS] Sent message for {event_type}")
                return True
            except ClientError as e:
                logger.error(f"[SQS_ERROR] Failed to send to queue: {str(e)}")
                return False
        else:
            # Local development simulation
            logger.info(f"[LOCAL_QUEUE_SIMULATION] Event: {event_type} | Payload: {payload}")
            return True

    def publish_critical_alert(
        self,
        subject: str,
        message: str
    ) -> bool:
        """Publish critical clinical or operational alert to AWS SNS topic."""
        if self.sns and self.topic_arn:
            try:
                self.sns.publish(
                    TopicArn=self.topic_arn,
                    Subject=subject[:100],
                    Message=message
                )
                logger.info(f"[SNS] Published alert: {subject}")
                return True
            except ClientError as e:
                logger.error(f"[SNS_ERROR] Failed to publish alert: {str(e)}")
                return False
        else:
            logger.info(f"[LOCAL_SNS_SIMULATION] Subject: {subject} | Alert: {message}")
            return True


queue_service = NotificationQueueService()
