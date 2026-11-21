"""
AWS Lambda: CareFlow Appointment & Reminder Dispatcher.
Triggered asynchronously by SQS queue events when appointments are booked, rescheduled, or cancelled.
Integrates with AWS SNS and SES to deliver email/SMS reminders.
"""
import json
import logging
import os
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN")
sns_client = boto3.client("sns") if SNS_TOPIC_ARN else None


def lambda_handler(event, context):
    logger.info(f"Received SQS event with {len(event.get('Records', []))} records.")
    
    processed_count = 0
    errors = []

    for record in event.get("Records", []):
        try:
            body = json.loads(record.get("body", "{}"))
            event_type = body.get("event_type")
            data = body.get("data", {})
            
            logger.info(f"Processing event: {event_type} for appointment {data.get('appointment_id')}")

            if event_type == "APPOINTMENT_BOOKED":
                send_booking_notification(data)
            elif event_type == "APPOINTMENT_CANCELLED":
                send_cancellation_notification(data)
            elif event_type == "APPOINTMENT_RESCHEDULED":
                send_rescheduled_notification(data)
            elif event_type == "PRESCRIPTION_ISSUED":
                send_prescription_notification(data)
            else:
                logger.warning(f"Unhandled event type: {event_type}")

            processed_count += 1
        except Exception as e:
            logger.error(f"Error processing SQS record {record.get('messageId')}: {str(e)}")
            errors.append({"messageId": record.get("messageId"), "error": str(e)})

    if errors:
        # Return batch item failures for SQS DLQ handling
        return {
            "statusCode": 500,
            "processed": processed_count,
            "batchItemFailures": [{"itemIdentifier": err["messageId"]} for err in errors]
        }

    return {
        "statusCode": 200,
        "processed": processed_count,
        "message": "Successfully dispatched all notification reminders."
    }


def send_booking_notification(data):
    subject = f"CareFlow Appointment Confirmed: {data.get('doctor_name')}"
    message = (
        f"Hello,\n\nYour consultation with {data.get('doctor_name')} has been confirmed for {data.get('date')} at {data.get('time')}.\n"
        f"Telemedicine Access Room: {data.get('telemedicine_room_id', 'In-Person')}\n\n"
        f"Thank you for choosing CareFlow Telemedicine."
    )
    _dispatch_sns(subject, message)


def send_cancellation_notification(data):
    subject = f"CareFlow Appointment Cancelled #{data.get('appointment_id')}"
    message = (
        f"Your appointment #{data.get('appointment_id')} was cancelled.\n"
        f"Reason: {data.get('cancellation_reason')}\n"
    )
    _dispatch_sns(subject, message)


def send_rescheduled_notification(data):
    subject = f"CareFlow Appointment Rescheduled #{data.get('appointment_id')}"
    message = (
        f"Your consultation #{data.get('appointment_id')} has been rescheduled.\n"
        f"New Schedule: {data.get('new_date')} at {data.get('new_time')}.\n"
    )
    _dispatch_sns(subject, message)


def send_prescription_notification(data):
    subject = f"CareFlow: New Prescription Ready ({data.get('prescription_code')})"
    message = (
        f"Dr. {data.get('doctor_name')} has signed an electronic prescription for you ({data.get('prescription_code')}).\n"
        f"You can view and download your digital prescription from your CareFlow patient portal."
    )
    _dispatch_sns(subject, message)


def _dispatch_sns(subject, message):
    if sns_client and SNS_TOPIC_ARN:
        try:
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=subject[:100],
                Message=message
            )
            logger.info(f"Published SNS message: {subject}")
        except ClientError as e:
            logger.error(f"SNS publishing failed: {str(e)}")
    else:
        logger.info(f"[LOG ONLY] SNS alert dispatched -> {subject}")
